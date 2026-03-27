/**
 * Fix script: Create a missing Firestore user document for an existing Firebase Auth user.
 * 
 * Usage:
 *   1. Install firebase-admin: npm install firebase-admin
 *   2. Download your Firebase service account key from Firebase Console > Project Settings > Service Accounts
 *   3. Save it as ./serviceAccountKey.json (DO NOT commit this file!)
 *   4. Run: node scripts/fix-missing-user.js
 * 
 * Alternatively, you can manually create the document in the Firebase Console:
 *   - Go to Firestore > users collection
 *   - Click "Add document"
 *   - Set Document ID to: d2U4u9cfbiWmGdLyR0xCJv9i8bo2
 *   - Add the following fields:
 *     - id: "d2U4u9cfbiWmGdLyR0xCJv9i8bo2" (string)
 *     - email: "<user's email>" (string)
 *     - name: "<user's name>" (string)
 *     - role: "doctor" (string) — or "consultant"
 *     - createdAt: <current timestamp> (timestamp)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixMissingUser() {
  const uid = 'd2U4u9cfbiWmGdLyR0xCJv9i8bo2';
  
  // Check if user doc already exists
  const existingDoc = await db.collection('users').doc(uid).get();
  if (existingDoc.exists) {
    console.log('User document already exists:', existingDoc.data());
    return;
  }

  // Get user info from Firebase Auth
  try {
    const authUser = await admin.auth().getUser(uid);
    console.log('Found Auth user:', authUser.email);
    
    // Create the missing Firestore document
    await db.collection('users').doc(uid).set({
      id: uid,
      email: authUser.email || '',
      name: authUser.displayName || authUser.email?.split('@')[0] || '',
      role: 'doctor', // Default role - change if needed
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Successfully created user document for ${uid}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

fixMissingUser();
