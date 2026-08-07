/**
 * Admin User Creation Utility
 * 
 * Usage: node scripts/createAdmin.js
 * 
 * This script creates a new admin user in Firebase Auth.
 * You MUST have Firebase Auth enabled in your console first.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('=================================');
console.log('  Admin User Creation Utility');
console.log('  It\'s ouR Studio Admin');
console.log('=================================\n');

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your-api-key') {
    console.error('❌ Error: Firebase API Key not found in .env');
    console.log('\nPlease ensure your .env file has the following variables:');
    console.log('VITE_FIREBASE_API_KEY');
    console.log('VITE_FIREBASE_AUTH_DOMAIN');
    console.log('VITE_FIREBASE_PROJECT_ID');
    console.log('VITE_FIREBASE_STORAGE_BUCKET');
    console.log('VITE_FIREBASE_MESSAGING_SENDER_ID');
    console.log('VITE_FIREBASE_APP_ID');
    console.log('\nYou can find these values in your Firebase Console or src/firebase.ts');
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter admin email: ', (email) => {
    rl.question('Enter admin password: ', async (password) => {
        try {
            console.log('\nCreating user...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('\n✅ Admin user created successfully!');
            console.log('UID:', userCredential.user.uid);
            console.log('\nNext steps:');
            console.log('1. Go to Firestore');
            console.log('2. Update your user document in "users" collection to match this email.');
            console.log('3. Now you can log in at /admin/login');
        } catch (error) {
            console.error('\n❌ Error creating user:', error.message);
        }
        rl.close();
    });
});
