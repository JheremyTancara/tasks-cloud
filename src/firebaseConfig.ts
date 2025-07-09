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

// FOLLOWERS & NOTIFICATIONS LOGIC
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

// Seguir a un usuario (actualiza ambos: following y followers)
export async function followUser(currentUserId: string, targetUserId: string) {
  const followingRef = doc(db, 'followers', currentUserId);
  const followersRef = doc(db, 'followers', targetUserId);
  // following
  const followingSnap = await getDoc(followingRef);
  if (followingSnap.exists()) {
    await updateDoc(followingRef, { following: arrayUnion(targetUserId) });
  } else {
    await setDoc(followingRef, { following: [targetUserId] });
  }
  // followers
  const followersSnap = await getDoc(followersRef);
  if (followersSnap.exists()) {
    await updateDoc(followersRef, { followers: arrayUnion(currentUserId) });
  } else {
    await setDoc(followersRef, { followers: [currentUserId] });
  }
}

// Dejar de seguir a un usuario (actualiza ambos)
export async function unfollowUser(currentUserId: string, targetUserId: string) {
  const followingRef = doc(db, 'followers', currentUserId);
  const followersRef = doc(db, 'followers', targetUserId);
  await updateDoc(followingRef, { following: arrayRemove(targetUserId) });
  await updateDoc(followersRef, { followers: arrayRemove(currentUserId) });
}

// Verificar si sigo a un usuario (por following)
export async function isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
  const ref = doc(db, 'followers', currentUserId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data();
  return Array.isArray(data.following) && data.following.includes(targetUserId);
}

// Crear notificación para un usuario
export async function createNotification(targetUserId: string, postId: string, postTitle: string, authorId: string, authorName: string, type: string = 'new_post') {
  let message = '';
  if (type === 'like') {
    message = `${authorName} liked your post: ${postTitle}`;
  } else {
    message = `${authorName} published: ${postTitle}`;
  }
  const notifRef = collection(db, 'users', targetUserId, 'notifications');
  await addDoc(notifRef, {
    type,
    postId,
    postTitle,
    authorId,
    authorName,
    message,
    createdAt: serverTimestamp(),
    read: false
  });
}

export async function createPostWithNotifications(postData: any) {
  // Crear el post
  const postRef = await addDoc(collection(db, 'posts'), postData);
  // Obtener followers (usuarios que siguen al autor)
  const followersRef = doc(db, 'followers', postData.userId);
  const followersSnap = await getDoc(followersRef);
  if (followersSnap.exists() && Array.isArray(followersSnap.data().followers)) {
    const followers: string[] = followersSnap.data().followers;
    for (const followerId of followers) {
      await createNotification(
        followerId,
        postRef.id,
        postData.title,
        postData.userId,
        postData.userName
      );
    }
  }
  return postRef;
} 