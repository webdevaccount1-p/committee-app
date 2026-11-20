// firebase.js - Firebase + Firestore Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 👇 YAHAN APNA CONFIG PASTE KARO - Firebase Console > Project Settings > Your apps se copy karo
const firebaseConfig = {
  apiKey: "YAHAN-APNI-API-KEY-PASTE-KARO",
  authDomain: "committee-app.firebaseapp.com",
  projectId: "committee-app",
  storageBucket: "committee-app.appspot.com",
  messagingSenderId: "YAHAN-APNA-SENDER-ID",
  appId: "YAHAN-APNA-APP-ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.db = db;
window.fb = { doc, setDoc, getDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc };
window.firebaseReady = true;
console.log("✅ Firebase Connected!");