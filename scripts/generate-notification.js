
// Ensure we're reading .env files
import { config } from 'dotenv';
config();

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const requiredFirebaseEnv = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

const missingFirebaseEnv = requiredFirebaseEnv.filter((key) => !process.env[key]);

if (missingFirebaseEnv.length > 0) {
    throw new Error(`Missing Firebase environment variables: ${missingFirebaseEnv.join(', ')}`);
}

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const createNotifications = async () => {
    try {
        console.log("Creating Patch 1.2.0 Notification...");
        await addDoc(collection(db, 'notifications'), {
            type: 'system',
            title: 'Patch 1.2.0 Update',
            message: 'Patch 1.2.0 is now live! ⚠️ IMPORTANT: Please read the patch notes for critical setup instructions regarding the new notification system.',
            timestamp: serverTimestamp(),
            isRead: false,
            link: 'patch-notes' // Link to patch notes page
        });
        console.log("✅ Patch 1.2.0 Notification created.");

        console.log("Creating Patch 1.2.1 Notification...");
        await addDoc(collection(db, 'notifications'), {
            type: 'system',
            title: 'Patch 1.2.1 Update',
            message: 'Patch 1.2.1 has been released. Includes minor bug fixes and UI improvements for the Notification Hub.',
            timestamp: serverTimestamp(),
            isRead: false,
            link: 'patch-notes'
        });
        console.log("✅ Patch 1.2.1 Notification created.");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating notifications:", error);
        process.exit(1);
    }
};

createNotifications();
