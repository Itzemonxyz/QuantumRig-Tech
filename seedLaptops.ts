import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDYoNvGjDRk-HDFhuTpF4eaYJExqDyF1p0",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "emonxyz-48285.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "emonxyz-48285",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "emonxyz-48285.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1035995553022",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:1035995553022:web:a5843d6cb15f10464c99af"
};
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)");

const laptops = [];

async function seed() {
  console.log("Seeding Laptops...");
  for (let i = 0; i < laptops.length; i++) {
    const pData = {
      ...laptops[i],
      id: `p_laptop_${Date.now() + i}`,
      code: `LAP-${1000 + i}`
    };
    await setDoc(doc(db, 'products', pData.id), pData);
  }
  console.log("Laptops Uploaded!");
  process.exit(0);
}

seed().catch(console.error);
