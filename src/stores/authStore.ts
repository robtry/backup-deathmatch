import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { authLogger } from '@/lib/utils/logger';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  registrationInProgress: boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ currentRoom: string | null }>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  initializeAuth: () => (() => void);
  clearCurrentRoom: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
  initialized: false,
  registrationInProgress: false,

  setUser: (user) => set({ user }),

  setError: (error) => set({ error }),

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Skip if registration is in progress - register() will handle state updates
        const { registrationInProgress } = get();
        if (registrationInProgress) {
          authLogger.debug('Skipping onAuthStateChanged during registration - register() will handle state');
          return;
        }

        // User is signed in, fetch user data from Firestore
        try {
          authLogger.info('User authenticated', { uid: firebaseUser.uid, email: firebaseUser.email });

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            authLogger.debug('User document found in Firestore');
            const userData = userDoc.data();
            set({
              user: {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: userData.name,
                currentRoom: userData.current_room || null
              },
              firebaseUser,
              loading: false,
              initialized: true,
              error: null
            });
          } else {
            // User document doesn't exist, create it
            authLogger.warn('User document NOT found in Firestore, creating new document');

            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Player',
              currentRoom: null
            };

            const firestoreData = {
              email: newUser.email,
              name: newUser.name,
              current_room: null
            };

            authLogger.debug('Creating Firestore user document', {
              path: `users/${firebaseUser.uid}`,
              data: firestoreData
            });

            await setDoc(userDocRef, firestoreData);

            authLogger.info('Firestore user document created successfully');

            set({
              user: newUser,
              firebaseUser,
              loading: false,
              initialized: true,
              error: null
            });
          }
        } catch (error) {
          authLogger.error('Error fetching/creating user data', error);
          set({
            user: null,
            firebaseUser: null,
            loading: false,
            initialized: true,
            error: 'Error al cargar datos del usuario'
          });
        }
      } else {
        // User is signed out
        set({
          user: null,
          firebaseUser: null,
          loading: false,
          initialized: true,
          error: null
        });
      }
    });

    return unsubscribe;
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    authLogger.info('Login attempt', { email });

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      authLogger.debug('Firebase Auth login successful', { uid: firebaseUser.uid });

      // Check if email is verified
      if (!firebaseUser.emailVerified) {
        authLogger.warn('Login blocked - email not verified', { uid: firebaseUser.uid, email: firebaseUser.email });
        // Sign out the user since they can't access the app
        await signOut(auth);
        set({ loading: false, error: 'Debes verificar tu email antes de iniciar sesion. Revisa tu bandeja de entrada.' });
        throw new Error('EMAIL_NOT_VERIFIED');
      }

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        authLogger.error('User document not found in Firestore after login', { uid: firebaseUser.uid });
        throw new Error('Usuario no encontrado en la base de datos');
      }

      const userData = userDoc.data();
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: userData.name,
        currentRoom: userData.current_room || null
      };

      authLogger.info('Login successful', {
        uid: user.id,
        hasCurrentRoom: !!user.currentRoom,
        currentRoom: user.currentRoom
      });

      set({ user, firebaseUser, loading: false, error: null });

      return { currentRoom: user.currentRoom };
    } catch (error: any) {
      // If it's our custom error, re-throw it
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        throw error;
      }

      let errorMessage = 'Error al iniciar sesion';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contrasena incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Intenta mas tarde';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Credenciales invalidas';
      }

      authLogger.error('Login failed', { code: error.code, message: errorMessage });
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ loading: true, error: null, registrationInProgress: true });
    authLogger.info('Registration attempt', { email, name });

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      authLogger.debug('Firebase Auth registration successful', { uid: firebaseUser.uid });

      // Send email verification
      await sendEmailVerification(firebaseUser);
      authLogger.info('Verification email sent', { email: firebaseUser.email });

      // Create user document in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name,
        currentRoom: null
      };

      const firestoreData = {
        email: newUser.email,
        name: newUser.name,
        current_room: null
      };

      authLogger.debug('Creating Firestore user document for new user', {
        path: `users/${firebaseUser.uid}`,
        data: firestoreData
      });

      await setDoc(doc(db, 'users', firebaseUser.uid), firestoreData);

      authLogger.info('Registration successful - user created in Auth and Firestore, verification email sent', { uid: firebaseUser.uid });

      // CRITICAL: Store email in sessionStorage BEFORE signOut
      // signOut triggers onAuthStateChanged which remounts components
      // We need sessionStorage set BEFORE that happens
      sessionStorage.setItem('pendingVerificationEmail', email);

      // Sign out the user - they need to verify email first
      await signOut(auth);
      authLogger.info('User signed out after registration - awaiting email verification');

      set({ user: null, firebaseUser: null, loading: false, error: null, registrationInProgress: false });

      // Throw a special error to indicate registration was successful but verification is needed
      throw new Error('VERIFICATION_EMAIL_SENT');
    } catch (error: any) {
      // If it's our success signal, re-throw it
      if (error.message === 'VERIFICATION_EMAIL_SENT') {
        throw error;
      }

      let errorMessage = 'Error al registrarse';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya esta registrado';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contrasena debe tener al menos 6 caracteres';
      }

      authLogger.error('Registration failed', { code: error.code, message: errorMessage });
      set({ loading: false, error: errorMessage, registrationInProgress: false });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    authLogger.info('Logout attempt');

    try {
      await signOut(auth);
      authLogger.info('Logout successful');
      set({ user: null, firebaseUser: null, loading: false, error: null });
    } catch (error) {
      authLogger.error('Logout failed', error);
      set({ loading: false, error: 'Error al cerrar sesión' });
      throw error;
    }
  },

  clearCurrentRoom: async () => {
    const { user } = get();
    if (!user) {
      authLogger.warn('Cannot clear current room: no user logged in');
      return;
    }

    try {
      authLogger.info('Clearing current room', { userId: user.id, previousRoom: user.currentRoom });

      // Update Firebase
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { current_room: null });

      // Update local state
      set({ user: { ...user, currentRoom: null } });

      authLogger.info('Current room cleared successfully', { userId: user.id });
    } catch (error) {
      authLogger.error('Failed to clear current room', error);
      throw error;
    }
  }
}));
