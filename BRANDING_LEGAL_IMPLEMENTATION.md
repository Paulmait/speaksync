# SpeakSync Branding & Legal Documents Implementation

## Overview
This implementation adds comprehensive branding integration and a complete Firebase Firestore backend system for managing legal documents in SpeakSync.

## Branding Integration

### Brand Assets
- **Logo Images**: Added to `assets/branding/` directory
  - `logo-icon.png` - Icon-only version
  - `logo-full.png` - Full logo with text

### Brand Constants
- **File**: `src/constants/branding.ts`
- **Contents**:
  - Color palette (primary blue, secondary green, grays)
  - Typography settings (fonts, sizes, weights)
  - Spacing constants
  - Logo asset references

### UI Components
- **BrandedHeader** (`src/components/ui/BrandedHeader.tsx`)
  - Reusable header with logo and brand colors
  - Configurable back button and right actions
  - Integrated into HomeScreen

- **SplashScreen** (`src/components/ui/SplashScreen.tsx`)
  - Animated logo display with brand colors
  - Professional app startup experience

### Updated Screens
- **HomeScreen**: Added branded header with logo
- **AuthScreen**: Updated with branded logo and color scheme
- **AppNavigator**: Updated theme to use brand colors

## Legal Documents Backend System

### Firebase Firestore Collections

#### 1. `legalDocuments` Collection
```typescript
{
  id: string;
  name: string;
  version: string;
  effectiveDate: number;
  content: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: {
    wordCount?: number;
    estimatedReadingTime?: number;
    language?: string;
    format?: 'markdown' | 'html' | 'plain';
    category?: string;
    tags?: string[];
  };
}
```

#### 2. `legalDocumentVersions` Collection
```typescript
{
  id: string;
  documentId: string;
  version: string;
  content: string;
  effectiveDate: number;
  isActive: boolean;
  changelog?: string;
  createdBy: string;
  createdAt: number;
}
```

#### 3. `userLegalAcceptances` Collection
```typescript
{
  userId: string;
  documentId: string;
  documentVersion: string;
  acceptedAt: number;
  ipAddress?: string;
  userAgent?: string;
}
```

#### 4. `legalAdminActions` Collection
```typescript
{
  id: string;
  adminId: string;
  action: string;
  documentId?: string;
  timestamp: number;
  details?: any;
}
```

#### 5. `admins` Collection
```typescript
{
  userId: string;
  email: string;
  name: string;
  role: 'super_admin' | 'legal_admin';
  createdAt: number;
  createdBy: string;
  isActive: boolean;
}
```

### Firebase Security Rules

```javascript
// Legal Documents - public read, admin write only
match /legalDocuments/{documentId} {
  allow read: if true;
  allow create, update, delete: if isAdmin();
}

// Legal Document Versions - public read, admin write only
match /legalDocumentVersions/{versionId} {
  allow read: if true;
  allow create, update, delete: if isAdmin();
}

// User Legal Acceptances - users can read/write their own
match /userLegalAcceptances/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Legal Admin Actions - admin audit trail
match /legalAdminActions/{actionId} {
  allow read: if isAdmin();
  allow create: if isAdmin();
}

// Admin check function
function isAdmin() {
  return request.auth != null && 
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

### Services

#### 1. LegalDocumentService (`src/services/legalDocumentService.ts`)
- **Public Methods**:
  - `getActiveDocument(type)` - Get active version of a document
  - `getAllActiveDocuments()` - Get all active legal documents
  - `getDocumentHistory(documentId)` - Get version history
  - `getDocumentEffectiveDate(type)` - Get effective date

- **Admin Methods**:
  - `createDocument(document)` - Create new legal document
  - `updateDocument(documentId, updates)` - Update document
  - `createNewVersion(documentId, content, version)` - Create new version
  - `activateVersion(documentId, version)` - Activate specific version
  - `deactivateDocument(documentId)` - Deactivate document
  - `deleteDocument(documentId)` - Delete document (admin only)

#### 2. AdminManagementService (`src/services/adminManagementService.ts`)
- `addAdmin(adminData)` - Add new admin user
- `isAdmin(userId)` - Check if user is admin
- `getAdmin(userId)` - Get admin details
- `deactivateAdmin(userId)` - Deactivate admin
- `listActiveAdmins()` - List all active admins
- `initializeFirstAdmin(userId, email, name)` - Setup first admin

#### 3. LegalDocumentSetup (`src/services/legalDocumentSetup.ts`)
- `createPrivacyPolicy()` - Create initial privacy policy
- `createTermsOfUse()` - Create initial terms of use
- `createAIDisclaimer()` - Create initial AI disclaimer
- `initializeLegalDocuments()` - Initialize all documents

### Document Types
```typescript
enum LegalDocumentType {
  PRIVACY_POLICY = 'privacyPolicy',
  TERMS_OF_USE = 'termsOfUse',
  AI_DISCLAIMER = 'aiDisclaimer',
  COOKIE_POLICY = 'cookiePolicy',
  DMCA_POLICY = 'dmcaPolicy',
  COMMUNITY_GUIDELINES = 'communityGuidelines',
  DATA_PROCESSING_AGREEMENT = 'dataProcessingAgreement',
  END_USER_LICENSE = 'endUserLicense'
}
```

## Setup Instructions

### 1. Admin Setup
```typescript
// Initialize first admin (run once)
await adminManagementService.initializeFirstAdmin(
  'admin-user-id',
  'admin@speaksync.com',
  'System Administrator'
);
```

### 2. Legal Documents Setup
```typescript
// Create initial legal documents
await initializeLegalDocuments();
```

### 3. Firestore Rules Deployment
```bash
# Deploy security rules
firebase deploy --only firestore:rules
```

## Usage Examples

### Reading Legal Documents (Public)
```typescript
// Get active privacy policy
const privacyPolicy = await legalDocumentService.getActiveDocument(
  LegalDocumentType.PRIVACY_POLICY
);

// Get all active legal documents
const allDocs = await legalDocumentService.getAllActiveDocuments();
```

### Admin Operations
```typescript
// Create new document version
await legalDocumentService.createNewVersion(
  documentId,
  newContent,
  '1.1',
  Date.now()
);

// Activate the new version
await legalDocumentService.activateVersion(documentId, '1.1');
```

### User Acceptance Tracking
```typescript
// Record user acceptance
await legalDocumentService.recordUserAcceptance(
  userId,
  documentId,
  version,
  additionalData
);
```

## Security Features

1. **Public Read Access**: All users can read legal documents
2. **Admin-Only Write**: Only verified admins can modify documents
3. **Version Control**: Complete audit trail of document changes
4. **User Acceptance Tracking**: Track when users accept legal documents
5. **Admin Audit Trail**: Log all administrative actions

## Future Enhancements

1. **Admin UI**: Build admin dashboard for document management
2. **User Consent UI**: User-facing legal document display and acceptance
3. **Notifications**: Alert users when legal documents are updated
4. **Analytics**: Track document views and acceptance rates
5. **Multilingual Support**: Support for multiple languages
6. **Document Templates**: Predefined templates for common legal documents

## Testing

The implementation includes comprehensive TypeScript types and error handling. Test the system by:

1. Creating admin users
2. Initializing legal documents
3. Testing read/write permissions
4. Verifying security rules work correctly
5. Testing document versioning and activation

## Notes

- All timestamps are Unix timestamps (milliseconds)
- Documents support markdown format for rich text
- Security rules enforce proper access control
- Admin users must be manually created through the admin service
- The system supports multiple active document versions simultaneously
- All operations are logged for audit purposes
