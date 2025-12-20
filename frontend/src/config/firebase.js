// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCMqj-eHi1t3Hok4iE3L5rFuboTg5U8m-I",
  authDomain: "try1-7d848.firebaseapp.com",
  databaseURL: "https://try1-7d848-default-rtdb.firebaseio.com",
  projectId: "try1-7d848",
  storageBucket: "try1-7d848.firebasestorage.app",
  messagingSenderId: "632927777196",
  appId: "1:632927777196:web:3aa41b6a20fa7c685b8a09",
  measurementId: "G-PM5TVCND6C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);
const database = getDatabase(app);

export { app, analytics, storage, database };
export default app;
