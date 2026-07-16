import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCLkV-u7wyRiG_SlaKLgWdYww7xpx-XLAs",
  authDomain: "vynexa-2027.firebaseapp.com",
  databaseURL: "https://vynexa-2027-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vynexa-2027",
  storageBucket: "vynexa-2027.firebasestorage.app",
  messagingSenderId: "452512018383",
  appId: "1:452512018383:web:29d8e00480ac4c0b8e2cba",
  measurementId: "G-C12RW5V1YM"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
isSupported().then((supported) => {
    if (supported) {
        getAnalytics(app);
    }
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
