import { useState, useEffect, useCallback } from 'react';
import type { FeedbackData, ReviewStatus } from '../types.ts';

const DB_NAME = 'DeontoFeedbackDB';
const STORE_NAME = 'feedback';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
  return dbPromise;
};


// Real database interactions with IndexedDB
export const useDatabase = () => {
    const [feedbackList, setFeedbackList] = useState<FeedbackData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            setIsLoading(true);
            try {
                const db = await openDB();
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const data: FeedbackData[] = request.result;
                    const sortedData = data.sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
                    setFeedbackList(sortedData);
                    setIsLoading(false);
                };
                request.onerror = () => {
                    console.error('Error fetching data from DB', request.error);
                    setFeedbackList([]);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Failed to open DB", error);
                setFeedbackList([]);
                setIsLoading(false);
            }
        };

        fetchFeedback();
    }, []);

    const addFeedback = useCallback(async (data: FeedbackData) => {
        const newFeedback: FeedbackData = {
            ...data,
            id: `fb_${Date.now()}`,
            timestamp: new Date(),
            review_status: 'Pendiente',
        };

        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(newFeedback);

        return new Promise<void>((resolve, reject) => {
            request.onsuccess = () => {
                setFeedbackList(prev => [newFeedback, ...prev]);
                resolve();
            };
            request.onerror = () => {
                console.error("Error adding feedback", request.error);
                reject(request.error);
            };
        });
    }, []);

    const updateFeedbackReview = useCallback(async (id: string, status: ReviewStatus, result: string) => {
        const db = await openDB();
        
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(id);

            getRequest.onerror = () => {
                console.error("Error fetching feedback for update", getRequest.error);
                reject(getRequest.error);
            };

            getRequest.onsuccess = () => {
                const feedbackToUpdate = getRequest.result;
                if (feedbackToUpdate) {
                    const updatedFeedback = { ...feedbackToUpdate, review_status: status, review_result: result };
                    const putRequest = store.put(updatedFeedback);
                    
                    putRequest.onsuccess = () => {
                        setFeedbackList(prev =>
                            prev.map(fb =>
                                fb.id === id ? updatedFeedback : fb
                            )
                        );
                        resolve();
                    };
                    putRequest.onerror = () => {
                        console.error("Error updating feedback", putRequest.error);
                        reject(putRequest.error);
                    };
                } else {
                    reject(new Error("Feedback not found"));
                }
            };
        });
    }, []);

    const deleteFeedback = useCallback(async (id: string) => {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        return new Promise<void>((resolve, reject) => {
            request.onsuccess = () => {
                setFeedbackList(prev => prev.filter(fb => fb.id !== id));
                resolve();
            };
            request.onerror = () => {
                console.error("Error deleting feedback", request.error);
                reject(request.error);
            }
        });
    }, []);


    return { feedbackList, isLoading, addFeedback, updateFeedbackReview, deleteFeedback };
};