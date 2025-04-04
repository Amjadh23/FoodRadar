import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCZ-3ChZmp4yU_ucy7L5XGyViPPFd2c1ZA",
  authDomain: "foodradar-ecb5f.firebaseapp.com",
  projectId: "foodradar-ecb5f",
  storageBucket: "foodradar-ecb5f.firebasestorage.app",
  messagingSenderId: "708600253824",
  appId: "1:708600253824:web:ede0e06f82d4f1bc968565",
  measurementId: "G-WVZSTTV3WL"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)