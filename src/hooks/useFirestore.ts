import { useState, useEffect } from 'react';
import {
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';

export function useFirestore<T extends { id?: string }>(
  collectionName: string
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    const path = `users/${userId}/${collectionName}`;
    const colRef = collection(db, 'users', userId, collectionName);
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: (d.data().createdAt as Timestamp)?.toDate?.()?.toISOString(),
          updatedAt: (d.data().updatedAt as Timestamp)?.toDate?.()?.toISOString(),
        })) as unknown as T[];
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId, collectionName]);

  const add = async (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) throw new Error('Not logged in');
    const path = `users/${userId}/${collectionName}`;
    try {
      const colRef = collection(db, 'users', userId, collectionName);
      const docRef = await addDoc(colRef, {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const update = async (id: string, partial: Partial<Omit<T, 'id'>>) => {
    if (!userId) throw new Error('Not logged in');
    const path = `users/${userId}/${collectionName}/${id}`;
    try {
      const docRef = doc(db, 'users', userId, collectionName, id);
      await updateDoc(docRef, {
        ...partial,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const remove = async (id: string) => {
    if (!userId) throw new Error('Not logged in');
    const path = `users/${userId}/${collectionName}/${id}`;
    try {
      const docRef = doc(db, 'users', userId, collectionName, id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return { data, loading, error, add, update, remove };
}
