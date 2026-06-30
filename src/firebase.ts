import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA4Qb_xT-Q33qowX-DIXohPj6TGYETk59o",
  authDomain: "tembo-page-prod-25.firebaseapp.com",
  projectId: "tembo-page-prod-25",
  storageBucket: "tembo-page-prod-25.firebasestorage.app",
  messagingSenderId: "130718915454",
  appId: "1:130718915454:web:0fbcd5c8161185ffe0312f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with persistent caching
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Initialize Storage
export const storage = getStorage(app);

// Initialize Functions
import { getFunctions } from 'firebase/functions';
export const functions = getFunctions(app);
