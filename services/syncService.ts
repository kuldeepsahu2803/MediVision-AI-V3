import * as localDB from './localDatabaseService.ts';
import * as dbService from './databaseService.ts';
import { SyncQueueItem, SyncStatus } from '@/shared/types/sync.types';
import { supabase } from '@/lib/supabaseClient';

class SyncManager {
    private inProgressCount = 0;
    private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    private listeners: (() => void)[] = [];

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleConnectivityChange(true));
            window.addEventListener('offline', () => this.handleConnectivityChange(false));
            
            // Periodically check queue even if online status doesn't change
            setInterval(() => this.processQueue(), 30000);
        }
        
        // Initial sync attempt
        this.processQueue();
    }

    private handleConnectivityChange(online: boolean) {
        this.isOnline = online;
        if (online) {
            console.log("Network back online. Resuming sync queue...");
            this.processQueue();
        }
        this.notify();
    }

    public subscribe(callback: () => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notify() {
        this.listeners.forEach(l => l());
    }

    public getStatus() {
        return {
            isOnline: this.isOnline,
            inProgressCount: this.inProgressCount,
            isSyncing: this.inProgressCount > 0
        };
    }

    /**
     * Queues a new sync task.
     */
    public async enqueue(type: 'prescription' | 'lab', action: 'create' | 'update' | 'delete', data: any) {
        const queueItem: SyncQueueItem = {
            id: data.id,
            type,
            action,
            data,
            priority: data.sync?.syncPriority || 0,
            createdAt: new Date().toISOString(),
            retryCount: 0
        };

        // Mark local item as pending
        const updatedData = {
            ...data,
            sync: {
                ...data.sync,
                status: 'pending' as SyncStatus,
                isLocalOnly: true
            }
        };

        if (type === 'prescription') {
            await localDB.saveToLocalDB(updatedData);
        } else {
            await localDB.saveLabToLocalDB(updatedData);
        }

        await localDB.addToSyncQueue(queueItem);
        this.notify();
        this.processQueue();
    }

    /**
     * Processes the sync queue sequentially.
     */
    public async processQueue() {
        if (!this.isOnline || this.inProgressCount > 0) return;

        const queue = await localDB.getSyncQueue();
        if (queue.length === 0) {
            if (this.inProgressCount !== 0) {
                this.inProgressCount = 0;
                this.notify();
            }
            return;
        }

        this.inProgressCount = queue.length;
        this.notify();

        for (const item of queue) {
            if (!this.isOnline) break;

            try {
                await this.syncItem(item);
                await localDB.removeFromSyncQueue(item.id);
                this.inProgressCount--;
                this.notify();
            } catch (error: any) {
                console.error(`Sync failed for ${item.id}:`, error);
                
                // If it's a conflict (optimistic concurrency fail)
                if (error.status === 409 || error.message?.includes('conflict')) {
                    await this.handleConflict(item, error.cloudData);
                } else {
                    // Backoff retry logic
                    item.retryCount++;
                    item.lastError = error.message;
                    await localDB.addToSyncQueue(item);
                    
                    // Stop processing the rest of the queue if we hit a non-conflict error (might be network/server issue)
                    this.inProgressCount = 0;
                    this.notify();
                    break;
                }
                
                this.inProgressCount--;
                this.notify();
            }
        }
        
        this.inProgressCount = 0;
        this.notify();
    }

    private async syncItem(item: SyncQueueItem) {
        const { type, action, data } = item;

        if (action === 'delete') {
            if (type === 'prescription') {
                await dbService.deletePrescription(item.id);
            } else {
                await dbService.deleteLabReport(item.id);
            }
            return;
        }

        // Check for version conflict if it's an update
        if (action === 'update' && data.sync?.version) {
            const tableName = type === 'prescription' ? 'prescriptions' : 'lab_reports';
            const { data: cloudData } = await supabase
                .from(tableName)
                .select('full_data')
                .eq('id', item.id)
                .single();
            
            if (cloudData && cloudData.full_data?.sync?.version > data.sync.version) {
               const err = new Error('Version conflict') as any;
               err.status = 409;
               err.cloudData = cloudData.full_data;
               throw err;
            }
        }

        // Perform primary save
        if (type === 'prescription') {
            await dbService.savePrescription({
                ...data,
                sync: {
                    ...data.sync,
                    status: 'synced' as SyncStatus,
                    lastSyncedAt: new Date().toISOString(),
                    version: (data.sync?.version || 0) + 1,
                    isLocalOnly: false
                }
            }, true); // forceCloud: true
        } else {
            await dbService.saveLabReport({
                ...data,
                sync: {
                    ...data.sync,
                    status: 'synced' as SyncStatus,
                    lastSyncedAt: new Date().toISOString(),
                    version: (data.sync?.version || 0) + 1,
                    isLocalOnly: false
                }
            }, true); // forceCloud: true
        }

        // Update local item as synced
        const syncedData = {
            ...data,
            sync: {
                ...data.sync,
                status: 'synced' as SyncStatus,
                isLocalOnly: false
            }
        };
        
        if (type === 'prescription') {
            await localDB.saveToLocalDB(syncedData);
        } else {
            await localDB.saveLabToLocalDB(syncedData);
        }
    }

    private async handleConflict(item: SyncQueueItem, cloudData: any) {
        console.warn(`Conflict detected for ${item.id}. Entering conflict state.`);
        
        const conflictData = {
            ...item.data,
            sync: {
                ...item.data.sync,
                status: 'conflict' as SyncStatus,
                conflictData: {
                    cloudVersion: cloudData
                }
            }
        };

        if (item.type === 'prescription') {
            await localDB.saveToLocalDB(conflictData);
        } else {
            await localDB.saveLabToLocalDB(conflictData);
        }
        
        await localDB.removeFromSyncQueue(item.id);
        this.notify();
    }
}

export const syncManager = new SyncManager();

export const syncLocalToCloud = async () => {
    await syncManager.processQueue();
};
