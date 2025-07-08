// src/firebaseConfig.ts
// Configuración de Firebase para tu proyecto
// Reemplaza los valores de las variables por los de tu proyecto en https://console.firebase.google.com/

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCLSJ_naNXokkw-2F1tO_PXFGjsiRvG80c',
  authDomain: 'cloud-develpme.firebaseapp.com',
  projectId: 'cloud-develpme',
  storageBucket: 'cloud-develpme.firebasestorage.app',
  messagingSenderId: '1018788418248',
  appId: '1:1018788418248:web:e00adcf50e66c289da4bfd',
  measurementId: 'G-BDF367K48C'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 