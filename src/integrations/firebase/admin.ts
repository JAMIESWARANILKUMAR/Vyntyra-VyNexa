import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
if (getApps().length === 0) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountJson) {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is missing. Firebase Admin won't work.");
    } else {
      const serviceAccount = JSON.parse(serviceAccountJson);
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminAuth = getApps().length > 0 ? getAuth(getApp()) : null;
export const adminDb = getApps().length > 0 ? getFirestore(getApp()) : null;
export const adminStorage = getApps().length > 0 ? getStorage(getApp()) : null;
