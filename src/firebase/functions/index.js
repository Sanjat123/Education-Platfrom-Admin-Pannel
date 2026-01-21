const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Set custom claims when user is created
exports.setUserRole = functions.auth.user().onCreate(async (user) => {
  try {
    // Check Firestore for user role
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const customClaims = {
        role: userData.role || 'student',
        email: user.email,
        name: userData.name || ''
      };
      
      // Set custom claims
      await admin.auth().setCustomUserClaims(user.uid, customClaims);
      
      console.log(`Custom claims set for ${user.uid}`, customClaims);
    }
  } catch (error) {
    console.error('Error setting custom claims:', error);
  }
});

// Update custom claims when user document is updated
exports.updateUserRole = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const userId = context.params.userId;
    
    try {
      const customClaims = {
        role: newData.role || 'student',
        email: newData.email,
        name: newData.name || ''
      };
      
      await admin.auth().setCustomUserClaims(userId, customClaims);
      console.log(`Custom claims updated for ${userId}`, customClaims);
    } catch (error) {
      console.error('Error updating custom claims:', error);
    }
  });