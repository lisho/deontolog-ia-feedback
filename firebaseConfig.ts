// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCpaJ2tFQluaLzs_rJauY8AIfElZwDi_PE",
  authDomain: "deontolog-iafeedback.firebaseapp.com",
  projectId: "deontolog-iafeedback",
  storageBucket: "deontolog-iafeedback.firebasestorage.app",
  messagingSenderId: "6607457347",
  appId: "1:6607457347:web:4b54f1d97b9daa710398f6",
  measurementId: "G-X8VDBQP6DS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
