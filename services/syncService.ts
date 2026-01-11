import * as localDB from './localDatabaseService.ts';
import * as dbService from './databaseService.ts';

export const syncLocalToCloud = async () => {
    const localData = await localDB.getFromLocalDB();
    if (localData.length === 0) return;

    console.log(`Syncing ${localData.length} records to cloud...`);

    for (const item of localData) {
        try {
            // Re-saving via the main service will trigger the Cloud upload logic 
            // because the user is logged in when this function is called.
            await dbService.savePrescription(item);
            
            // TRANSACTIONAL SAFETY: Only delete from local if the cloud save succeeded
            await localDB.deleteFromLocalDB(item.id);
            console.log(`Successfully synced and cleared local record: ${item.id}`);
        } catch (e) {
            console.error(`Failed to sync item ${item.id}. Keeping in local storage for retry.`, e);
        }
    }
};