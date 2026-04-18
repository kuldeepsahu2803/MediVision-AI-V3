
export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error';

export interface SyncMetadata {
  status: SyncStatus;
  lastSyncedAt?: string;
  version: number;
  isLocalOnly: boolean;
  syncPriority: number;
  conflictData?: {
    cloudVersion: any;
    resolvedAt?: string;
    resolution?: 'local' | 'cloud' | 'merge';
  };
}

export interface SyncQueueItem {
  id: string;
  type: 'prescription' | 'lab';
  action: 'create' | 'update' | 'delete';
  data: any;
  priority: number;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}
