
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDPDsDEoyRYLfh8SMorMOU02I-wmQBAlTk",
  authDomain: "school-prefects-managements.firebaseapp.com",
  projectId: "school-prefects-managements",
  storageBucket: "school-prefects-managements.firebasestorage.app",
  messagingSenderId: "68655535651",
  appId: "1:68655535651:web:7b5fc556e61e1e2a814396",
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
