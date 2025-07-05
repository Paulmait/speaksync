# SpeakSync Mobile

A React Native teleprompter application built with Expo that helps users manage and display scripts in a professional teleprompter format with cloud synchronization.

## Features

### � User Authentication
- Secure email/password authentication
- User account creation and management
- Profile management with sync status

### �📝 Script Management
- Create, edit, and delete scripts
- Rich text editing with basic formatting (bold, italic)
- Search through your script library
- Optimistic UI updates for instant feedback
- Comprehensive CRUD operations with robust error handling

### ☁️ Cloud Synchronization
- **Firebase Firestore** backend for reliable cloud storage
- **Real-time sync** across all devices
- **Offline-first architecture** with local caching
- **Conflict resolution** for simultaneous edits
- **Automatic retry** for failed sync operations
- **Sync status indicators** (synced, pending, conflict, error)

### 🎬 Teleprompter
- Full-screen teleprompter view
- Auto-scrolling with adjustable speed
- Customizable font size
- Play/pause/reset controls
- Hide/show controls for distraction-free reading

### 🔄 Robust Data Management
- **AsyncStorage** for local persistence and offline capability
- **Optimistic updates** for immediate UI feedback
- **Network state monitoring** with automatic sync when online
- **Error handling** with user-friendly messages
- **Data versioning** for conflict detection

### 🎨 Modern UI/UX
- Clean, intuitive interface
- Material Design components with React Native Paper
- Cross-platform compatibility (iOS/Android)
- Responsive design with proper spacing and typography
- Real-time sync status indicators
- Offline/online state banners

## Tech Stack

- **React Native** with **Expo** for cross-platform development
- **TypeScript** for type safety
- **React Navigation** for screen navigation
- **Zustand** for state management with persistence
- **Firebase Authentication** for user management
- **Firebase Firestore** for cloud database
- **React Native Paper** for Material Design UI components
- **AsyncStorage** for local data persistence
- **NetInfo** for network state monitoring

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SpeakSyncMobile
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions):
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Update `src/services/firebase.ts` with your configuration

4. Start the development server:
```bash
npm start
```

5. Use the Expo Go app on your phone to scan the QR code, or use an emulator

### Running on Different Platforms

```bash
# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on Web
npm run web
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ConflictResolution.tsx  # Sync conflict resolution UI
│   ├── RichTextToolbar.tsx     # Text formatting toolbar
│   └── ScriptCard.tsx          # Script list item component
├── navigation/          # Navigation configuration
├── screens/            # Screen components
│   ├── AuthScreen.tsx          # Welcome/landing screen
│   ├── SignInScreen.tsx        # User sign in
│   ├── SignUpScreen.tsx        # User registration
│   ├── ProfileScreen.tsx       # User profile and sync status
│   ├── HomeScreen.tsx          # Script list and management
│   ├── ScriptEditorScreen.tsx  # Script creation and editing
│   └── TeleprompterScreen.tsx  # Teleprompter display
├── services/           # Business logic and external services
│   ├── authService.ts          # Authentication management
│   ├── syncService.ts          # Cloud synchronization
│   ├── networkService.ts       # Network state monitoring
│   └── firebase.ts             # Firebase configuration
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── ...
```

## Key Features Deep Dive

### Authentication Flow
- Welcome screen with feature overview
- Sign up/Sign in with email validation
- Automatic session management
- Profile screen with account management

### Sync Architecture
- **Local-first**: All operations work offline
- **Optimistic updates**: Immediate UI feedback
- **Background sync**: Automatic synchronization when online
- **Conflict resolution**: Smart handling of simultaneous edits
- **Error recovery**: Automatic retry with manual fallback

### Offline Capabilities
- Full CRUD operations work offline
- Local storage with AsyncStorage
- Automatic sync when connection restored
- Visual indicators for sync status
- Offline mode banners and feedback

### Data Flow
1. User performs action (create/edit/delete)
2. Immediate optimistic UI update
3. Local storage update
4. Background cloud sync (if online)
5. Conflict detection and resolution
6. UI status updates

## Development

### Adding New Features
1. Create new components in `src/components/`
2. Add new screens to `src/screens/` and update navigation
3. Extend types in `src/types/index.ts`
4. Update store if needed in `src/store/scriptStore.ts`
5. Add service logic in `src/services/`

### Code Style
- Use functional components with hooks
- Follow TypeScript best practices
- Use React Native Paper components for consistency
- Implement proper error handling
- Add accessibility features where appropriate
- Write comprehensive types for all data structures

### Testing Sync Functionality
1. Create scripts while online
2. Go offline and make changes
3. Come back online and verify sync
4. Test conflict resolution with simultaneous edits
5. Verify error handling with network issues

## Firebase Setup

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase configuration instructions.

## Environment Configuration

For production deployments:

1. Set up environment variables for Firebase config
2. Configure Firestore security rules
3. Enable proper authentication settings
4. Set up monitoring and analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue in the repository or contact the development team.

---

Built with ❤️ using React Native, Expo, and Firebase
