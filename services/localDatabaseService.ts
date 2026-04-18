
import { openDB, IDBPDatabase } from 'idb';
import { PrescriptionData } from '@/features/prescriptions';

const DB_NAME = 'RxSnapDB';
const STORE_NAME = 'prescriptions';
const LABS_STORE = 'labs';
const DRAFTS_STORE = 'drafts';
const SYNC_QUEUE_STORE = 'sync_queue';

export const initLocalDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, 4, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(LABS_STORE)) {
        db.createObjectStore(LABS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
      }
    },
  });
};

export const addToSyncQueue = async (item: any) => {
    const db = await initLocalDB();
    await db.put(SYNC_QUEUE_STORE, {
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
        retryCount: item.retryCount || 0
    });
};

export const getSyncQueue = async (): Promise<any[]> => {
    const db = await initLocalDB();
    const all = await db.getAll(SYNC_QUEUE_STORE);
    return all.sort((a, b) => (b.priority || 0) - (a.priority || 0) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const removeFromSyncQueue = async (id: string) => {
    const db = await initLocalDB();
    await db.delete(SYNC_QUEUE_STORE, id);
};

export const saveDraft = async (data: any) => {
    const db = await initLocalDB();
    await db.put(DRAFTS_STORE, { ...data, updatedAt: new Date().toISOString() });
};

export const getDraft = async (id: string) => {
    const db = await initLocalDB();
    return await db.get(DRAFTS_STORE, id);
};

export const deleteDraft = async (id: string) => {
    const db = await initLocalDB();
    await db.delete(DRAFTS_STORE, id);
};

export const saveToLocalDB = async (data: PrescriptionData) => {
  const db = await initLocalDB();
  // Ensure timestamp exists for consistency with cloud data
  const dataWithTimestamp = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
  };
  await db.put(STORE_NAME, dataWithTimestamp);
};

export const saveLabToLocalDB = async (data: any) => {
  const db = await initLocalDB();
  await db.put(LABS_STORE, data);
};

export const getLabsFromLocalDB = async (): Promise<any[]> => {
  const db = await initLocalDB();
  const all = await db.getAll(LABS_STORE);
  return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const deleteLabFromLocalDB = async (id: string) => {
  const db = await initLocalDB();
  await db.delete(LABS_STORE, id);
};

export const getFromLocalDB = async (): Promise<PrescriptionData[]> => {
  const db = await initLocalDB();
  const all = await db.getAll(STORE_NAME);
  // Sort by timestamp if available, else by date field
  return all.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
      return timeB - timeA;
  });
};

export const deleteFromLocalDB = async (id: string) => {
  const db = await initLocalDB();
  await db.delete(STORE_NAME, id);
};

export const clearLocalDB = async () => {
    const db = await initLocalDB();
    await db.clear(STORE_NAME);
};
