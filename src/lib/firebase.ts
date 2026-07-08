import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Authentication Provider
export const googleProvider = new GoogleAuthProvider();

// Error definitions for security rule audit tracking
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection Validation Checklist Rule
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client is offline.");
    }
  }
}
testConnection();

// Sign In with Google popup handler with Redirect fallback
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Erro ao autenticar com Google Firebase:", error);
    // If popup is blocked or closed, fallback to redirect
    if (
      error?.code === 'auth/popup-blocked' || 
      error?.code === 'auth/popup-closed-by-user' || 
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup')
    ) {
      console.log("Tentando entrar via redirecionamento (signInWithRedirect)...");
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError) {
        console.error("Erro ao redirecionar para login Google:", redirectError);
        throw redirectError;
      }
    }
    throw error;
  }
}

// Sign Out handler
export async function logoutFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao deslogar do Firebase:", error);
    throw error;
  }
}

// Fetch user database from Firestore
export async function fetchUserDatabaseFromFirestore(userId: string) {
  const path = `user_databases/${userId}`;
  try {
    const docRef = doc(db, 'user_databases', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Helper to recursively remove undefined values from an object before saving to Firestore
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj;
    }
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (obj[key] !== undefined) {
          newObj[key] = removeUndefined(obj[key]);
        }
      }
    }
    return newObj;
  }
  return obj;
}

// Save user database to Firestore
export async function saveUserDatabaseToFirestore(userId: string, data: any) {
  const path = `user_databases/${userId}`;
  try {
    const docRef = doc(db, 'user_databases', userId);
    const cleanedData = removeUndefined(data);
    await setDoc(docRef, cleanedData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
