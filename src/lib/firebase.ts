import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCR2tmPmf7A4sSLsbNUyuJwiv8EjOOjXNc",
  authDomain: "hospital-dashboard-da852.firebaseapp.com",
  projectId: "hospital-dashboard-da852",
  storageBucket: "hospital-dashboard-da852.firebasestorage.app",
  messagingSenderId: "16484343426",
  appId: "1:16484343426:web:a5d9c8d0e7a820e06e5e9b",
  measurementId: "G-SYTW00Z6VP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;