import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firestoreLogger } from '@/lib/utils/logger';

// Firebase configuration for emulators
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "backup-deathmatch.firebaseapp.com",
  projectId: "backup-deathmatch",
  storageBucket: "backup-deathmatch.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore FIRST and connect to emulator BEFORE any other operation
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Connect to emulators ONLY in development mode
if (import.meta.env.DEV) {
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
