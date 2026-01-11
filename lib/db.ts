
// This file is DEPRECATED.
// Please import from specific services in @/services/

import * as localDB from '../services/localDatabaseService.ts';
import * as dbService from '../services/databaseService.ts';
import * as syncService from '../services/syncService.ts';

export const savePrescriptionToDB = dbService.savePrescription;
export const getAllPrescriptionsFromDB = dbService.getAllPrescriptions;
export const deletePrescriptionFromDB = dbService.deletePrescription;
export const syncLocalToCloud = syncService.syncLocalToCloud;

// Re-export specific local utils if strictly needed by legacy code not yet updated
export const initLocalDB = localDB.initLocalDB;
