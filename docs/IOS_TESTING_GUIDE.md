# SpeakSync Mobile - iOS Testing Guide

This guide will help you test SpeakSync Mobile on iOS devices using EAS (Expo Application Services).

## Prerequisites

1. An [Expo Account](https://expo.dev/signup)
2. An Apple Developer account (for distributing to physical devices)
3. Physical iOS device(s) or access to iOS Simulator
4. Node.js and npm installed

## Step 1: Install Required Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account (if not already logged in)
eas login
```

## Step 2: Register Test Devices

To test on physical iOS devices, they must be registered with your Apple Developer account via EAS:

```bash
# Use our helper script to register devices
npm run register:helper

# Or register directly with EAS
npm run register:devices
```

Follow the instructions in the browser that opens to register your device.

## Step 3: Build the App for Testing

Choose the appropriate build profile based on your needs:

```bash
# For iOS simulator
npm run build:ios

# For physical devices (internal distribution)
npm run build:ios:test

# For TestFlight distribution
npm run build:ios:testflight
```

The build process will run on Expo's servers - no need for a Mac or Xcode locally! Once complete, you'll receive a URL to download the app or view build status.

## Step 4: Install on Your Device

### For Physical Devices:

1. After the build completes, you'll receive a QR code and URL
2. Open the URL on your iOS device
3. Follow the instructions to install the development build

### For TestFlight:

1. Complete the `build:ios:testflight` build
2. Submit to TestFlight using: `npm run submit:ios`
3. Wait for Apple's review (usually a few hours for TestFlight)
4. Use the TestFlight invitation sent to testers

## Common Issues and Troubleshooting

### Build Fails with Credentials Error
- Run `eas credentials` to manage your credentials
- Consider using `--clear-credentials` flag to reset problematic credentials

### Device Not Recognized
- Ensure your device is properly registered with `eas device:list`
- Re-register if needed with `npm run register:devices`

### App Won't Install
- Check the provisioning profile includes your device
- Verify your Apple Developer account has sufficient permissions
- Make sure your device has the latest iOS version

## Development Workflow

For rapid development cycles:

1. Make changes to your code
2. Run locally for quick testing: `npm run ios:local`
3. For complete testing on real devices, build with: `npm run build:ios:test`

## Additional Resources

- [EAS Documentation](https://docs.expo.dev/eas/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [Expo Build Process](https://docs.expo.dev/build/introduction/)
