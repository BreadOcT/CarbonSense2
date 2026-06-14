import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';

const extendedConfig = {
  ...firebaseConfig,
  databaseURL: "https://carbonsense-iot-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(extendedConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
