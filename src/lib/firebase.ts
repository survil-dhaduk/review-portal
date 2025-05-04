// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

console.log('Initializing Firebase...');

// Check if environment variables are available
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

// Verify that required Firebase config is available
if (!apiKey || !authDomain || !projectId) {
  console.error(
    "Firebase configuration is incomplete. Please set the required environment variables."
  );
  // You can set up a sample config for development, but this should be replaced with actual values
  // This is just to prevent the app from crashing during development
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('Firebase config:', {
  ...firebaseConfig,
  apiKey: '***' // Hide the API key in logs
});

let app;
let auth;
let db;
let storage;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  console.log('Firebase services initialized');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export { auth, db, storage };
export default app;
