import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

// Firebase configuration using Expo Constants
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.['firebaseApiKey'] || "AIzaSyB17iE1vMzqfyTMhjTnues5mq5R5BRLBe8",
  authDomain: Constants.expoConfig?.extra?.['firebaseAuthDomain'] || "speaksyncmobile.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.['firebaseProjectId'] || "speaksyncmobile",
  storageBucket: Constants.expoConfig?.extra?.['firebaseStorageBucket'] || "speaksyncmobile.appspot.com",
  messagingSenderId: Constants.expoConfig?.extra?.['firebaseMessagingSenderId'] || "738419715683",
  appId: Constants.expoConfig?.extra?.['firebaseAppId'] || "1:738419715683:web:your_app_id_here"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// For development - connect to emulators
if (__DEV__) {
  // Uncomment these lines when using Firebase emulators
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

export default app;
