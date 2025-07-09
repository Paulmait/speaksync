# SpeakSync Mobile - Manual Testing Checklist

## Pre-Testing Setup
- [ ] Environment variables configured (`.env` file)
- [ ] Firebase project connected
- [ ] Expo development environment ready
- [ ] Dependencies installed (`npm install`)

## Core Functionality Tests

### 1. App Startup & Navigation
- [ ] App launches without crashing
- [ ] Splash screen displays correctly
- [ ] Main navigation tabs work (Home, Scripts, Teleprompter, Settings)
- [ ] Navigation between screens smooth and responsive

### 2. Authentication Flow
- [ ] **Sign Up**: New user registration works
- [ ] **Sign In**: Existing user login works
- [ ] **Sign Out**: User can log out successfully
- [ ] **Password Reset**: Forgot password flow functional
- [ ] **User Profile**: Display name and email show correctly

### 3. Script Management
- [ ] **Create Script**: New script creation works
- [ ] **Edit Script**: Existing script editing functional
- [ ] **Delete Script**: Script deletion with confirmation
- [ ] **Script List**: All scripts display in list view
- [ ] **Search Scripts**: Script search functionality works
- [ ] **Rich Text**: Bold/italic formatting works

### 4. Teleprompter Core Features
- [ ] **Display Script**: Script content displays in teleprompter
- [ ] **Auto-scroll**: Automatic scrolling starts/stops correctly
- [ ] **Manual Control**: Play/pause controls work
- [ ] **Speed Control**: Scroll speed adjustment functional
- [ ] **Font Size**: Text size adjustment works
- [ ] **Full Screen**: Full-screen mode toggles correctly

### 5. Cloud Synchronization
- [ ] **Online Sync**: Changes sync when online
- [ ] **Offline Mode**: App works without internet
- [ ] **Conflict Resolution**: Handles simultaneous edits
- [ ] **Sync Status**: Visual indicators show sync state
- [ ] **Auto-sync**: Background synchronization works

### 6. Advanced Features
- [ ] **Karaoke Mode**: Word highlighting during playback
- [ ] **Speech Recognition**: Voice input works (if implemented)
- [ ] **Multi-language**: Language switching functional
- [ ] **Analytics**: Usage tracking and statistics
- [ ] **Team Features**: Team management and sharing

### 7. Settings & Preferences
- [ ] **Teleprompter Settings**: Speed, font, colors customizable
- [ ] **App Settings**: General preferences save correctly
- [ ] **Privacy Settings**: Data consent and privacy controls
- [ ] **Export/Import**: Script backup and restore

### 8. Performance & UX
- [ ] **Loading Times**: App responds quickly to user actions
- [ ] **Memory Usage**: No memory leaks during extended use
- [ ] **Battery Usage**: Reasonable power consumption
- [ ] **Error Handling**: Graceful error messages and recovery

### 9. Cross-Platform Compatibility
- [ ] **iOS**: All features work on iOS devices
- [ ] **Android**: All features work on Android devices
- [ ] **Tablet Support**: UI adapts well to tablet screens
- [ ] **Different Screen Sizes**: Responsive design works

### 10. Edge Cases & Error Scenarios
- [ ] **Network Loss**: App handles connectivity changes
- [ ] **Low Storage**: Appropriate warnings for storage issues
- [ ] **Background/Foreground**: App state preserves correctly
- [ ] **Force Quit Recovery**: App recovers after force close

## Critical Bug Assessment

### High Priority Issues
- [ ] App crashes or becomes unresponsive
- [ ] Data loss or corruption
- [ ] Authentication failures
- [ ] Sync failures causing data inconsistency

### Medium Priority Issues
- [ ] Performance degradation
- [ ] UI layout problems
- [ ] Minor feature malfunctions
- [ ] Accessibility issues

### Low Priority Issues
- [ ] Minor UI inconsistencies
- [ ] Non-critical feature enhancements
- [ ] Performance optimizations

## Test Results Summary

**Test Date:** ___________  
**Tester:** ___________  
**Device:** ___________  
**OS Version:** ___________  

### Overall Status
- [ ] ✅ All critical features working
- [ ] ⚠️ Minor issues identified
- [ ] ❌ Critical issues require immediate attention

### Critical Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Recommendations
1. ________________________________
2. ________________________________
3. ________________________________

## Automated Build Test Commands

```bash
# Basic build verification
npm run build

# Type checking (with errors expected)
npx tsc --noEmit --project tsconfig.mobile.json

# Lint checking
npm run lint

# Expo development server
npm start

# iOS simulator (macOS only)
npm run ios

# Android emulator
npm run android
```

## Development Testing Commands

```bash
# Install dependencies
npm install

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
expo r -c

# Reset Metro bundler
npx react-native start --reset-cache

# Check for outdated packages
npm outdated
```

---

**Note:** This manual testing approach ensures the app functions correctly from a user perspective, even while automated testing infrastructure is being established.
