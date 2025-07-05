# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `speaksync-mobile`
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In the Firebase console, go to **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Email/Password** authentication
5. Click "Save"

## 3. Enable Firestore Database

1. In the Firebase console, go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

## 4. Add Web App

1. In the Firebase console, go to **Project settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Enter app nickname: `SpeakSync Mobile`
5. **Do not** check "Also set up Firebase Hosting"
6. Click "Register app"
7. Copy the Firebase configuration object

## 5. Update Firebase Configuration

Replace the placeholder config in `src/services/firebase.ts` with your actual Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 6. Firestore Security Rules (Production)

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own scripts
    match /scripts/{scriptId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 7. Development vs Production

- **Development**: Use test mode with the current rules
- **Production**: Update security rules and disable test mode

## 8. Optional: Firebase Emulators (Development)

For local development, you can use Firebase emulators:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase login`
3. Run `firebase init emulators`
4. Select Firestore and Authentication emulators
5. Uncomment the emulator connection lines in `src/services/firebase.ts`
6. Run `firebase emulators:start`

This allows you to develop offline with a local Firebase instance.

## Environment Variables (Optional)

For better security, you can use environment variables:

1. Create `.env` file in project root
2. Add your Firebase config as environment variables
3. Update `firebase.ts` to use `process.env` values
4. Add `.env` to your `.gitignore` file

Example `.env`:
```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
```
