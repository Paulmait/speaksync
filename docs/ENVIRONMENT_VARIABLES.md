# Environment Variables Guide for SpeakSync Mobile

This guide explains how to set up environment variables for SpeakSync Mobile's different build environments.

## Local Development

For local development, create or update your `.env` file in the root directory:

```
# API Keys
DEEPGRAM_API_KEY=your_deepgram_api_key

# Firebase Config
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# App Config
DEBUG_MODE=true
ENABLE_SPEECH_LOGGING=false
```

## EAS Builds (Expo Application Services)

For EAS builds, you need to set up secrets that are securely stored and applied during build time:

```bash
# Set secrets for all builds
eas secret:create --scope project --name DEEPGRAM_API_KEY --value "your_deepgram_api_key"
eas secret:create --scope project --name FIREBASE_API_KEY --value "your_firebase_api_key"
eas secret:create --scope project --name FIREBASE_AUTH_DOMAIN --value "your_project.firebaseapp.com"
eas secret:create --scope project --name FIREBASE_PROJECT_ID --value "your_project_id"
eas secret:create --scope project --name FIREBASE_STORAGE_BUCKET --value "your_bucket.appspot.com"
eas secret:create --scope project --name FIREBASE_MESSAGING_SENDER_ID --value "your_sender_id"
eas secret:create --scope project --name FIREBASE_APP_ID --value "your_app_id"

# Environment-specific secrets (optional)
eas secret:create --scope project --name DEBUG_MODE_DEVELOPMENT --value "true"
eas secret:create --scope project --name DEBUG_MODE_PRODUCTION --value "false"
```

## Accessing Environment Variables

In your application code, access these variables through the Expo Constants:

```typescript
import Constants from 'expo-constants';

// Access environment variables
const deepgramApiKey = Constants.expoConfig.extra.deepgramApiKey;
const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.firebaseApiKey,
  authDomain: Constants.expoConfig.extra.firebaseAuthDomain,
  projectId: Constants.expoConfig.extra.firebaseProjectId,
  storageBucket: Constants.expoConfig.extra.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig.extra.firebaseMessagingSenderId,
  appId: Constants.expoConfig.extra.firebaseAppId,
};
const debugMode = Constants.expoConfig.extra.debugMode;
```

## Environment-Specific Configurations

Our EAS build profiles in `eas.json` define environment-specific settings:

- **Development**: Debug mode enabled, full logging
- **Test**: Testing configuration with minimal logging
- **Preview**: Internal testing builds with production-like settings
- **Production**: Full production configuration with optimizations

## Managing Secrets

To view existing secrets:
```bash
eas secret:list
```

To update a secret:
```bash
eas secret:delete --name SECRET_NAME
eas secret:create --scope project --name SECRET_NAME --value "new_value"
```

## Important Notes

1. Never commit the `.env` file to version control
2. EAS secrets are encrypted and secure
3. Be careful when logging environment variables in your app
4. Different build profiles may use different values for the same variable
