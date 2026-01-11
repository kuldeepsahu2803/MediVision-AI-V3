
import { openDB, IDBPDatabase } from 'idb';
import { PrescriptionData } from '../types.ts';

const DB_NAME = 'MediVisionDB';
const STORE_NAME = 'prescriptions';

export const initLocalDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
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
