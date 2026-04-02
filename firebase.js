// Firebase CDN (SDK modulaire) pour un projet HTML/CSS/JS sans npm.
// Cette base est prête pour ajouter ensuite login, dashboard et formulaires.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAvLLbXLUGDcaoMKtnrK9YwewJpvdrFLfy',
  authDomain: 'sos-pneus-domicile-65.firebaseapp.com',
  projectId: 'sos-pneus-domicile-65',
  storageBucket: 'sos-pneus-domicile-65.firebasestorage.app',
  messagingSenderId: '650111970002',
  appId: '1:650111970002:web:35cffe53ed142f56009b0b',
};

// Initialisation Firebase
export const app = initializeApp(firebaseConfig);

// Auth email/password prêt à l'emploi
export const auth = getAuth(app);

// Firestore prêt à l'emploi
export const db = getFirestore(app);

// Helpers optionnels pour la suite (login/dashboard/formulaires)
export const registerWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const observeAuthState = (callback) => onAuthStateChanged(auth, callback);

export const createRequest = (payload) =>
  addDoc(collection(db, 'requests'), {
    ...payload,
    status: 'envoyée',
    createdAt: serverTimestamp(),
  });

export const subscribeUserRequests = (userId, callback) => {
  const q = query(
    collection(db, 'requests'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, callback);
};

export const upsertUserProfile = (uid, { email, role = 'pro' }) =>
  setDoc(
    doc(db, 'users', uid),
    {
      email,
      role,
    },
    { merge: true }
  );

export const getUserProfile = async (uid) => {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data() : null;
};

export const subscribeAllRequests = (callback) => {
  const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, callback);
};

export const updateRequestStatus = (requestId, status) =>
  updateDoc(doc(db, 'requests', requestId), { status });
