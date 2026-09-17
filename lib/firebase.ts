import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoKeyForMCABrochure12345678',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mca-brochure.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mca-brochure',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mca-brochure.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1074990013468',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1074990013468:web:f09f1b9bd76164b907d3d9',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e: any) {
  console.warn('Firebase client SDK fallback mode:', e?.message || e);
  app = getApps()[0] || ({} as FirebaseApp);
  try { auth = getAuth(app); } catch { auth = {} as Auth; }
  try { db = getFirestore(app); } catch { db = {} as Firestore; }
}

export { auth, db };
export default app;
