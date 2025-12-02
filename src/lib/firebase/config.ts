import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firestoreLogger } from '@/lib/utils/logger';

// Firebase configuration - these keys are safe to be public
// Security is handled by Firestore Rules and Auth, not by hiding API keys
const firebaseConfig = {
  apiKey: "AIzaSyCpNS8DjCVLdaN6WXELgMpeMepQz4SCddY",
  authDomain: "backup-deathmatch.firebaseapp.com",
  projectId: "backup-deathmatch",
  storageBucket: "backup-deathmatch.firebasestorage.app",
  messagingSenderId: "246277781651",
  appId: "1:246277781651:web:02c05b1f6b645b2ef6b566",
  measurementId: "G-N11J7QCFH1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Check if we should use emulators
// In development mode AND emulators are running (check via environment or default to true in dev)
const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS !== 'false';

if (useEmulators) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    firestoreLogger.info('Connected to Firestore emulator at localhost:8080');
  } catch (error) {
    firestoreLogger.error('Error connecting to Firestore emulator', error);
  }

  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    firestoreLogger.info('Connected to Auth emulator at localhost:9099');
  } catch (error) {
    firestoreLogger.error('Error connecting to Auth emulator', error);
  }
} else {
  firestoreLogger.info('Running in production mode - connecting to Firebase');
}

// Set persistence to LOCAL (survives browser restarts)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  firestoreLogger.error('Error setting auth persistence', error);
});

export { app, auth, db };
