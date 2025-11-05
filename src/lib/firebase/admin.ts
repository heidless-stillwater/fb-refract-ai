'use server';

import * as admin from 'firebase-admin';

export async function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }

  try {
    // The credential is automatically discovered by Google Cloud environments.
    await admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Re-throw the error to ensure the calling function is aware of the failure.
    // This prevents subsequent Firebase calls from failing with a misleading error.
    throw new Error('Failed to initialize Firebase Admin SDK. Check server logs for details.');
  }
}
