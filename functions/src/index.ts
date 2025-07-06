import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

/**
 * Function to track script creation for free tier users
 * This ensures atomic incrementation of script count and security
 */
export const trackScriptCreation = functions.https.onCall(async (data: Record<string, unknown>, context: functions.https.CallableContext) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to track script creation'
    );
  }

  const userId = context.auth.uid;
  const subscriptionRef = db.collection('subscriptions').doc(userId);
  
  // Get user's subscription data
  const subscriptionDoc = await subscriptionRef.get();
  
  if (!subscriptionDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'User subscription not found'
    );
  }
  
  const subscriptionData = subscriptionDoc.data();
  
  // Only track usage for free tier users
  if (subscriptionData?.subscriptionTier !== 'free') {
    return { success: true, message: 'User is not on free tier, no tracking needed' };
  }
  
  // Get free tier usage doc
  const usageRef = db.collection('freeTierUsage').doc(userId);
  const usageDoc = await usageRef.get();
  
  // Atomically increment script count
  if (!usageDoc.exists) {
    // Create new usage document if it doesn't exist
    await usageRef.set({
      freeSessionCount: 0,
      freeSessionDurationAccumulated: 0,
      savedScriptsCount: 1, // Start with this script
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // Increment script count
    await usageRef.update({
      savedScriptsCount: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  
  // Get updated usage after increment
  const updatedUsageDoc = await usageRef.get();
  const updatedUsage = updatedUsageDoc.data();
  
  return {
    success: true,
    message: 'Script creation tracked successfully',
    currentCount: updatedUsage?.savedScriptsCount || 1,
  };
});

/**
 * Function to track session start for free tier users
 * This ensures atomic incrementation of session count and security
 */
export const trackSessionStart = functions.https.onCall(async (data: Record<string, unknown>, context: functions.https.CallableContext) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to track session start'
    );
  }

  const userId = context.auth.uid;
  const subscriptionRef = db.collection('subscriptions').doc(userId);
  
  // Get user's subscription data
  const subscriptionDoc = await subscriptionRef.get();
  
  if (!subscriptionDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'User subscription not found'
    );
  }
  
  const subscriptionData = subscriptionDoc.data();
  
  // Only track usage for free tier users
  if (subscriptionData?.subscriptionTier !== 'free') {
    return { success: true, message: 'User is not on free tier, no tracking needed' };
  }
  
  // Get free tier usage doc
  const usageRef = db.collection('freeTierUsage').doc(userId);
  const usageDoc = await usageRef.get();
  
  // Atomically increment session count
  if (!usageDoc.exists) {
    // Create new usage document if it doesn't exist
    await usageRef.set({
      freeSessionCount: 1, // Start with this session
      freeSessionDurationAccumulated: 0,
      savedScriptsCount: 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // Increment session count
    await usageRef.update({
      freeSessionCount: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  
  // Get updated usage after increment
  const updatedUsageDoc = await usageRef.get();
  const updatedUsage = updatedUsageDoc.data();
  
  return {
    success: true,
    message: 'Session start tracked successfully',
    currentCount: updatedUsage?.freeSessionCount || 1,
  };
});

/**
 * Function to track session duration for free tier users
 * This ensures atomic incrementation of session duration and security
 */
export const trackSessionDuration = functions.https.onCall(async (data: { durationInSeconds?: number }, context: functions.https.CallableContext) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to track session duration'
    );
  }

  // Validate duration parameter
  const duration = data?.durationInSeconds;
  if (!duration || typeof duration !== 'number' || duration <= 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Duration must be a positive number'
    );
  }

  const userId = context.auth.uid;
  const subscriptionRef = db.collection('subscriptions').doc(userId);
  
  // Get user's subscription data
  const subscriptionDoc = await subscriptionRef.get();
  
  if (!subscriptionDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'User subscription not found'
    );
  }
  
  const subscriptionData = subscriptionDoc.data();
  
  // Only track usage for free tier users
  if (subscriptionData?.subscriptionTier !== 'free') {
    return { success: true, message: 'User is not on free tier, no tracking needed' };
  }
  
  // Get free tier usage doc
  const usageRef = db.collection('freeTierUsage').doc(userId);
  const usageDoc = await usageRef.get();
  
  // Atomically increment session duration
  if (!usageDoc.exists) {
    // Create new usage document if it doesn't exist
    await usageRef.set({
      freeSessionCount: 1,
      freeSessionDurationAccumulated: duration,
      savedScriptsCount: 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // Increment session duration
    await usageRef.update({
      freeSessionDurationAccumulated: admin.firestore.FieldValue.increment(duration),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  
  // Get updated usage after increment
  const updatedUsageDoc = await usageRef.get();
  const updatedUsage = updatedUsageDoc.data();
  
  return {
    success: true,
    message: 'Session duration tracked successfully',
    currentDuration: updatedUsage?.freeSessionDurationAccumulated || duration,
  };
});

/**
 * Function to reset usage limits when user upgrades from free tier
 */
export const resetFreeTierUsage = functions.https.onCall(async (data: Record<string, unknown>, context: functions.https.CallableContext) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to reset usage limits'
    );
  }

  const userId = context.auth.uid;
  const subscriptionRef = db.collection('subscriptions').doc(userId);
  
  // Get user's subscription data
  const subscriptionDoc = await subscriptionRef.get();
  
  if (!subscriptionDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'User subscription not found'
    );
  }
  
  const subscriptionData = subscriptionDoc.data();
  
  // Only reset usage if user is on paid plan
  if (subscriptionData?.subscriptionTier === 'free') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Free tier users cannot reset usage limits'
    );
  }
  
  // Reset usage limits
  const usageRef = db.collection('freeTierUsage').doc(userId);
  
  await usageRef.update({
    freeSessionCount: 0,
    freeSessionDurationAccumulated: 0,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  return {
    success: true,
    message: 'Usage limits reset successfully',
  };
});

/**
 * Firestore trigger to enforce script limits for free users
 * This prevents users from creating more scripts than allowed in free tier
 */
export const enforceScriptLimits = functions.firestore
  .document('scripts/{scriptId}')
  .onCreate(async (snapshot: functions.firestore.QueryDocumentSnapshot) => {
    const scriptData = snapshot.data();
    const userId = scriptData.userId;
    
    if (!userId) {
      functions.logger.info('Script has no userId, skipping limit enforcement');
      return null;
    }
    
    // Get user's subscription
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    const subscriptionDoc = await subscriptionRef.get();
    
    // If no subscription found or not free tier, no enforcement needed
    if (!subscriptionDoc.exists || subscriptionDoc.data()?.subscriptionTier !== 'free') {
      return null;
    }
    
    // Get free tier usage
    const usageRef = db.collection('freeTierUsage').doc(userId);
    const usageDoc = await usageRef.get();
    
    if (!usageDoc.exists) {
      // Create usage document with this script counted
      await usageRef.set({
        freeSessionCount: 0,
        freeSessionDurationAccumulated: 0,
        savedScriptsCount: 1,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }
    
    const usageData = usageDoc.data() || { savedScriptsCount: 0 };
    
    // Increment script count
    await usageRef.update({
      savedScriptsCount: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Check if user has exceeded the limit
    if (usageData.savedScriptsCount >= 1) { // Free tier limit is 1 script
      functions.logger.info(`User ${userId} has exceeded free tier script limit`);
      
      // Could send notification or perform other actions here
      // For now, we'll just log the event
    }
    
    return null;
  });
