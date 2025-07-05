# Environment Configuration Guide

## Overview

SpeakSync Mobile uses environment variables for secure configuration of API keys and Firebase settings. This guide explains how to set up your environment properly.

## Files Setup

### 1. Environment Variables (.env)

The `.env` file contains your actual API keys and configuration. **This file should never be committed to version control.**

```bash
# Environment Configuration for SpeakSync Mobile

# Deepgram API Configuration
DEEPGRAM_API_KEY=c1f6fab47dcb3ac00c275cf015e211782134ddc7

# Firebase Configuration - SpeakSyncMobile Project
FIREBASE_API_KEY=AIzaSyB17iE1vMzqfyTMhjTnues5mq5R5BRLBe8
FIREBASE_AUTH_DOMAIN=speaksyncmobile.firebaseapp.com
FIREBASE_PROJECT_ID=speaksyncmobile
FIREBASE_STORAGE_BUCKET=speaksyncmobile.appspot.com
FIREBASE_MESSAGING_SENDER_ID=738419715683
FIREBASE_APP_ID=1:738419715683:web:your_app_id_here

# Development Settings
DEBUG_MODE=true
ENABLE_SPEECH_LOGGING=false
```

### 2. Example Environment (.env.example)

The `.env.example` file serves as a template and can be safely committed to version control. It shows the required environment variables without exposing actual values.

### 3. Expo Configuration (app.config.js)

The `app.config.js` file loads environment variables and makes them available to the React Native application through Expo's Constants API.

## Getting Your API Keys

### Deepgram API Key

1. Sign up at [https://deepgram.com](https://deepgram.com)
2. Create a new project
3. Generate an API key from the project dashboard
4. Copy the API key to your `.env` file as `DEEPGRAM_API_KEY`

### Firebase Configuration

Your Firebase configuration has been extracted from the project settings:

- **Project ID**: speaksyncmobile
- **API Key**: AIzaSyB17iE1vMzqfyTMhjTnues5mq5R5BRLBe8
- **Auth Domain**: speaksyncmobile.firebaseapp.com
- **Storage Bucket**: speaksyncmobile.appspot.com
- **Messaging Sender ID**: 738419715683

**Note**: You'll need to get the complete `FIREBASE_APP_ID` from your Firebase project console.

## Setup Instructions

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Update .env with Your Keys

Edit the `.env` file and replace placeholder values with your actual API keys.

### 3. Verify Configuration

The app will automatically load these environment variables on startup:

- **Firebase**: Configured in `src/services/firebase.ts`
- **Deepgram**: Configured in `src/services/speechRecognitionService.ts`

## Security Best Practices

### ✅ Do:
- Keep `.env` files out of version control
- Use different API keys for development and production
- Regularly rotate API keys
- Use the minimum required permissions for each service

### ❌ Don't:
- Commit `.env` files to Git
- Share API keys in plain text
- Use production keys in development
- Hard-code API keys in source code

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DEEPGRAM_API_KEY` | Deepgram Speech-to-Text API key | Yes (for speech recognition) |
| `FIREBASE_API_KEY` | Firebase Web API key | Yes (for authentication) |
| `FIREBASE_AUTH_DOMAIN` | Firebase Authentication domain | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project identifier | Yes |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | Yes |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging sender ID | Yes |
| `FIREBASE_APP_ID` | Firebase application ID | Yes |
| `DEBUG_MODE` | Enable debug logging | No (default: false) |
| `ENABLE_SPEECH_LOGGING` | Enable speech recognition logging | No (default: false) |

## Troubleshooting

### Firebase Not Connecting
- Verify all Firebase environment variables are set correctly
- Check Firebase project settings match your `.env` file
- Ensure Firebase services (Auth, Firestore) are enabled

### Deepgram Speech Recognition Not Working
- Verify `DEEPGRAM_API_KEY` is correct
- Check Deepgram account has sufficient credits
- Ensure microphone permissions are granted

### Environment Variables Not Loading
- Restart the Expo development server
- Clear Metro bundler cache: `npx expo start --clear`
- Verify `.env` file is in the project root directory

## Production Deployment

For production deployment:

1. **Never include `.env` files in builds**
2. **Use platform-specific secure storage**:
   - iOS: Keychain Services
   - Android: Encrypted SharedPreferences
3. **Consider using environment-specific builds**
4. **Implement proper key rotation procedures**

## Development Workflow

1. **New Developer Setup**:
   ```bash
   git clone <repository>
   cd SpeakSyncMobile
   npm install
   cp .env.example .env
   # Edit .env with your API keys
   npm start
   ```

2. **Adding New Environment Variables**:
   - Add to `.env.example` (without real values)
   - Add to `app.config.js` extra section
   - Update this documentation
   - Use in your service files via `Constants.expoConfig?.extra?.yourVariable`

This configuration ensures secure, flexible environment management for SpeakSync Mobile development and deployment.
