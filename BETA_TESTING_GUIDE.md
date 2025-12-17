# SpeakSync Mobile - Beta Testing Guide

## 🔒 Security Overview

This guide ensures safe beta testing by implementing:
- **Secure API Key Management**: No hardcoded keys in source code
- **Environment Validation**: Automatic checks for proper configuration
- **Feature Limits**: Controlled access to prevent abuse
- **Error Monitoring**: Comprehensive logging and crash reporting
- **Data Protection**: Limited data collection for beta testing

## 🚀 Quick Start for iPhone Testing

### Prerequisites
1. **iPhone with iOS 12+**
2. **Expo Go app** installed from App Store
3. **Valid API keys** for Firebase and Deepgram
4. **Same WiFi network** as your development machine

### Setup Steps

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd SpeakSyncMobile
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your actual API keys
   # Required: DEEPGRAM_API_KEY, FIREBASE_API_KEY, FIREBASE_PROJECT_ID
   ```

3. **Run Beta Setup**
   ```bash
   npm run setup:beta
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

5. **Connect iPhone**
   - Open **Expo Go** on your iPhone
   - Scan the QR code from terminal
   - Or use: `npm run ios:local`

## 🔧 Beta Testing Configuration

### Environment Variables
```bash
# Required for functionality
DEEPGRAM_API_KEY=your_actual_key
FIREBASE_API_KEY=your_actual_key
FIREBASE_PROJECT_ID=your_project_id

# Beta testing features
BETA_TESTING_MODE=true
ENABLE_MOCK_SERVICES=false
ENABLE_API_KEY_VALIDATION=true
ENABLE_ENVIRONMENT_CHECK=true
ENABLE_ANALYTICS=true
ENABLE_CRASH_REPORTING=true
DEBUG_MODE=false
```

### Feature Limits (Beta Testing)
- **Session Duration**: 60 minutes maximum
- **Scripts per User**: 10 maximum
- **Sessions per Day**: 5 maximum
- **Analytics**: Enabled for performance monitoring
- **Crash Reporting**: Enabled for bug tracking

## 📱 Core Features to Test

### 1. Authentication
- [ ] Sign up with email/password
- [ ] Sign in with existing account
- [ ] Password reset functionality
- [ ] Session persistence

### 2. Script Management
- [ ] Create new script
- [ ] Edit existing script
- [ ] Delete script
- [ ] Search scripts
- [ ] Script sync status

### 3. Teleprompter
- [ ] Load script into teleprompter
- [ ] Adjust scroll speed
- [ ] Font size adjustment
- [ ] Background color changes
- [ ] Speech recognition (if enabled)

### 4. Analytics & Performance
- [ ] Session tracking
- [ ] Performance metrics
- [ ] Error reporting
- [ ] Usage analytics

### 5. Subscription Features
- [ ] Free tier limits
- [ ] Upgrade prompts
- [ ] Feature gating
- [ ] Usage tracking

## 🐛 Bug Reporting

### How to Report Issues
1. **Take Screenshots**: Capture the issue
2. **Note Steps**: Document how to reproduce
3. **Include Device Info**: iOS version, app version
4. **Submit via App**: Use the in-app feedback feature

### What to Include
- **Device**: iPhone model and iOS version
- **App Version**: Current beta version
- **Steps**: Exact steps to reproduce
- **Expected vs Actual**: What should happen vs what happened
- **Screenshots**: Visual evidence of the issue

## 📊 Performance Monitoring

### Metrics Tracked
- **App Launch Time**: Should be under 3 seconds
- **Script Loading**: Should be under 2 seconds
- **Teleprompter Performance**: Smooth scrolling
- **Memory Usage**: No memory leaks
- **Battery Usage**: Reasonable consumption

### Performance Targets
- **Cold Start**: < 3 seconds
- **Warm Start**: < 1 second
- **Script Load**: < 2 seconds
- **UI Responsiveness**: < 100ms

## 🔒 Security Checklist

### Before Beta Testing
- [ ] API keys are properly configured
- [ ] No hardcoded secrets in source code
- [ ] Environment validation is enabled
- [ ] Error logging is configured
- [ ] Crash reporting is active

### During Beta Testing
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Validate data security
- [ ] Test feature limits
- [ ] Verify user privacy

## 🚨 Troubleshooting

### Common Issues

**App Won't Load**
```bash
# Clear cache and restart
npm start -- --clear
```

**QR Code Not Working**
- Ensure iPhone and computer are on same WiFi
- Try using `npm run ios:local` instead

**API Errors**
- Check `.env` file configuration
- Verify API keys are valid
- Check network connectivity

**Performance Issues**
- Close other apps on iPhone
- Restart Expo development server
- Check device storage space

### Debug Commands
```bash
# Check environment
npm run setup:beta

# Run with TypeScript checking
npm run ios:check

# Clear cache and restart
npm start -- --clear

# Build for testing
npm run build:ios:test
```

## 📈 Beta Testing Metrics

### Success Criteria
- **Stability**: < 5% crash rate
- **Performance**: All targets met
- **Usability**: Positive user feedback
- **Security**: No data breaches
- **Functionality**: All core features work

### Monitoring Dashboard
- **Real-time Metrics**: Available in development
- **Error Tracking**: Automatic crash reporting
- **Usage Analytics**: Feature usage patterns
- **Performance Data**: Response times and memory usage

## 🎯 Next Steps

### After Beta Testing
1. **Analyze Feedback**: Review all user reports
2. **Fix Critical Issues**: Address high-priority bugs
3. **Performance Optimization**: Improve based on metrics
4. **Security Review**: Validate all security measures
5. **Production Preparation**: Final testing and deployment

### Production Release
- [ ] All critical bugs fixed
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] User feedback incorporated
- [ ] Documentation updated

---

**Need Help?** Contact the development team with any questions or issues during beta testing. 