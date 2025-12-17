import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

export class AuthService {
  private static instance: AuthService;
  private authStateListeners: ((user: User | null) => void)[] = [];
  private currentUser: User | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Listen for auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.createUserFromFirebase(firebaseUser);
        this.currentUser = user;
        this.notifyAuthStateListeners(user);
      } else {
        this.currentUser = null;
        this.notifyAuthStateListeners(null);
      }
    });
  }

  private async createUserFromFirebase(firebaseUser: FirebaseUser): Promise<User> {
    // Check if user document exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    let userData: User;
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: data['displayName'] || firebaseUser.displayName || undefined,
        createdAt: data['createdAt']?.toDate() || new Date()
      };
    } else {
      // Create new user document
      userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || undefined,
        createdAt: new Date()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: userData.email,
        displayName: userData.displayName,
        createdAt: userData.createdAt
      });
    }
    
    return userData;
  }

  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile with display name if provided
      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      }
      
      // Create user document in Firestore
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: displayName || firebaseUser.displayName || undefined,
        createdAt: new Date()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: userData.email,
        displayName: userData.displayName,
        createdAt: userData.createdAt
      });
      
      return userData;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await this.createUserFromFirebase(userCredential.user);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  addAuthStateListener(listener: (user: User | null) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  private notifyAuthStateListeners(user: User | null) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  private handleAuthError(error: any): Error {
    let message = 'An unexpected error occurred';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'This email is already registered';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/weak-password':
          message = 'Password should be at least 6 characters';
          break;
        case 'auth/user-not-found':
          message = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection';
          break;
        default:
          message = error.message || 'Authentication failed';
      }
    }
    
    return new Error(message);
  }
}

export const authService = AuthService.getInstance();
