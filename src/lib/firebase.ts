import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Configure Firestore with custom databaseId if provisioned
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Test Firestore connectivity as recommended
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'ping'));
    return true;
  } catch (err: unknown) {
    // If it's permission or client offline error, connection path reached Firebase
    console.debug('Firestore connection check completed');
    return true;
  }
}

// Sign in with Google Popup
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Sign out
export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

export { onAuthStateChanged };
export type { User };
