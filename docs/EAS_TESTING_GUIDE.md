# EAS Testing Guide for SpeakSync Mobile

This guide provides step-by-step instructions for using EAS (Expo Application Services) to build and test SpeakSync Mobile on iOS devices.

## Setup Complete

Your project has been configured with:

1. **EAS Project ID**: `4728c611-fe9a-42b7-90d4-54d9ebef1c73` (linked to your Expo account)
2. **Build Profiles**: Development, Test, Preview, Production, and TestFlight
3. **Scripts**: Added npm scripts for various build and submit operations
4. **Configuration**: Updated app.config.js with proper iOS and Android settings

## Testing on iPhone - Step by Step

### 1. Register Test Devices

Before you can install builds on physical iOS devices, you must register them:

```bash
# Use our helper script
npm run register:helper

# Or use EAS CLI directly
npm run register:devices
```

This will open a browser where you'll follow instructions to register your device.

### 2. Set Required Environment Variables

Ensure all required environment variables are available to EAS:

```bash
# Set up essential secrets for your builds
eas secret:create --scope project --name DEEPGRAM_API_KEY --value "your_key_here"
eas secret:create --scope project --name FIREBASE_API_KEY --value "your_key_here"
# ... add other required secrets (see ENVIRONMENT_VARIABLES.md)
```

### 3. Build for Testing

Choose the appropriate build type:

#### For Internal Testing (Ad Hoc Distribution)

```bash
# Build for registered physical devices
npm run build:ios:test
```

This creates an iOS build that can be installed on your registered devices.

#### For TestFlight Distribution

```bash
# Build for TestFlight
npm run build:ios:testflight

# Submit to TestFlight
npm run submit:ios
```

### 4. Install on Your Device

After the build completes:

1. EAS will provide a QR code and URL
2. Open the URL on your iOS device
3. Follow the instructions to install the app

For TestFlight builds, invite testers through App Store Connect and they'll receive an email with installation instructions.

## Build Profiles Explained

Our configuration includes several build profiles:

| Profile | Purpose | Command | Notes |
|---------|---------|---------|-------|
| **development** | Local development | `npm run build:ios` | Includes simulator support |
| **test** | Internal testing | `npm run build:ios:test` | For registered physical devices |
| **preview** | Internal pre-release | `npm run build:ios:preview` | Production-like for final testing |
| **testflight** | TestFlight distribution | `npm run build:ios:testflight` | For external testers |
| **production** | App Store | N/A | For final App Store submission |

## Troubleshooting Common Issues

### Build Fails with Credentials Error

```bash
# Check your current credentials
eas credentials

# Reset problematic credentials
eas build --platform ios --profile test --clear-credentials
```

### Device Not Recognized

```bash
# List registered devices
eas device:list

# Register again if needed
npm run register:devices
```

### App Won't Install

- Verify your Apple Developer account has the necessary permissions
- Check that your device is running a supported iOS version
- Ensure your provisioning profile includes your device's UDID

## Additional Commands

```bash
# View build status
eas build:list

# Cancel an in-progress build
eas build:cancel

# View build logs
eas build:logs

# View project settings
eas project
```

## Next Steps

1. Complete your TypeScript error fixes
2. Run local tests with `npm run ios:check`
3. Build for iOS testing with `npm run build:ios:test`
4. Distribute to external testers with TestFlight

For more details, refer to:
- [IOS_TESTING_GUIDE.md](./IOS_TESTING_GUIDE.md)
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [Expo EAS Documentation](https://docs.expo.dev/eas/)
