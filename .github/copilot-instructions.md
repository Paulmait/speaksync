<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# SpeakSync Mobile - Copilot Instructions

This is a React Native application built with Expo for teleprompter functionality with comprehensive cloud synchronization capabilities. The app allows users to create, edit, and display scripts in a teleprompter format with robust offline/online sync.

## Project Architecture
- Built with Expo and TypeScript
- Uses React Navigation for screen navigation
- Zustand for state management with persistence
- React Native Paper for UI components
- Firebase Authentication for user management
- Firebase Firestore for cloud database
- AsyncStorage for local caching and offline capabilities
- NetInfo for network state monitoring

## Key Features
- **User Authentication**: Email/password auth with Firebase
- **Script Management**: CRUD operations with optimistic updates
- **Cloud Synchronization**: Real-time sync with conflict resolution
- **Offline-First Architecture**: Full functionality without internet
- **Rich Text Editing**: Basic formatting with bold/italic support
- **Teleprompter View**: Auto-scroll with customizable settings
- **Sync Status Tracking**: Visual indicators for sync states
- **Error Handling**: Comprehensive error recovery and retry logic

## Development Guidelines
- Follow TypeScript best practices with comprehensive types
- Use React Native Paper components for UI consistency
- Implement proper error handling with user-friendly messages
- Ensure cross-platform compatibility (iOS/Android)
- Maintain clean, modern UI/UX design patterns
- Use Zustand store for all state management
- Implement proper navigation types with TypeScript
- Follow offline-first principles for all data operations
- Use optimistic updates for immediate UI feedback
- Handle network state changes gracefully

## Code Style
- Use functional components with hooks
- Implement proper TypeScript interfaces for all data structures
- Follow React Native naming conventions
- Use StyleSheet for component styling
- Implement proper accessibility features
- Use services for external API interactions
- Separate business logic from UI components
- Use async/await for all asynchronous operations
- Implement proper loading states and error boundaries

## Data Flow Architecture
1. **User Action**: Create/edit/delete operations
2. **Optimistic Update**: Immediate UI feedback
3. **Local Storage**: AsyncStorage persistence
4. **Background Sync**: Firebase Firestore sync (when online)
5. **Conflict Resolution**: Handle simultaneous edits
6. **Status Updates**: Visual sync status indicators

## State Management
- **Scripts**: Array of script objects with sync metadata
- **Auth State**: User authentication and profile data
- **Sync State**: Network status, pending operations, errors
- **UI State**: Current screen, loading states, modals

## Error Handling Patterns
- Network errors: Retry with exponential backoff
- Auth errors: User-friendly messages with retry options
- Sync conflicts: Interactive resolution UI
- Storage errors: Fallback to in-memory state
- Validation errors: Real-time form feedback

## Testing Considerations
- Test offline/online transitions
- Verify conflict resolution scenarios
- Test authentication flows
- Validate error recovery mechanisms
- Ensure data persistence across app restarts
