'use server';

import * as admin from 'firebase-admin';

export async function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }

  try {
    await admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}
