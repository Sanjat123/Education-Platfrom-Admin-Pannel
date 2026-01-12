import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAn8QMe1Cjv4xenBZYgrCGDeJZ898a8A8o",
  authDomain: "student-60e64.firebaseapp.com",
  projectId: "student-60e64",
  storageBucket: "student-60e64.firebasestorage.app",
  messagingSenderId: "910667858948",
  appId: "1:910667858948:web:cb76745759de8b75dea151"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);