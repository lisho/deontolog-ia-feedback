import { useState, useEffect, useCallback } from 'react';
import type { FeedbackData, ReviewStatus } from '../types.ts';
import { db } from '../firebaseConfig.ts';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
    writeBatch,
    Timestamp
} from 'firebase/firestore';


export const useDatabase = () => {
    const [feedbackList, setFeedbackList] = useState<FeedbackData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const feedbackCol = collection(db, 'feedback');
        const q = query(feedbackCol, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: FeedbackData[] = querySnapshot.docs.map(doc => {
                const d = doc.data();

                // 1. Create a guaranteed-clean object with default primitive values.
                const sanitized: FeedbackData = {
                    id: doc.id,
                    nombre_evaluador: '',
                    fecha_hora: '',
                    dispositivo: '',
                    escenario_keywords: '',
                    tipo_feedback: '',
                    descripcion: '',
                    respuesta_chatbot: '',
                    claridad: '',
                    utilidad: '',
                    valoracion_deontologica: 0,
                    valoracion_pertinencia: 0,
                    valoracion_calidad_interaccion: 0,
                    comentarios_finales: '',
                    corpus_c1_fuentes_pertinentes: 0,
                    corpus_c2_estructura_exhaustiva: 0,
                    corpus_c3_libre_info_no_autorizada: 0,
                    corpus_c4_detalle_suficiente: 0,
                    corpus_c5_core_fiable_legitimo: 0,
                    corpus_comentarios: '',
                    corpus_propuestas: '',
                    timestamp: new Date(0).toISOString(),
                    review_status: 'Pendiente',
                    review_result: '',
                };

                // 2. Defensively populate the clean object with converted primitives.
                
                // Process strings
                const stringKeys: (keyof FeedbackData)[] = ['nombre_evaluador', 'dispositivo', 'escenario_keywords', 'tipo_feedback', 'descripcion', 'respuesta_chatbot', 'claridad', 'utilidad', 'comentarios_finales', 'corpus_comentarios', 'corpus_propuestas', 'review_status', 'review_result'];
                stringKeys.forEach(key => {
                    if (d[key] != null) {
                        (sanitized as any)[key] = String(d[key]);
                    }
                });

                // Process numbers
                const numberKeys: (keyof FeedbackData)[] = ['valoracion_deontologica', 'valoracion_pertinencia', 'valoracion_calidad_interaccion', 'corpus_c1_fuentes_pertinentes', 'corpus_c2_estructura_exhaustiva', 'corpus_c3_libre_info_no_autorizada', 'corpus_c4_detalle_suficiente', 'corpus_c5_core_fiable_legitimo'];
                numberKeys.forEach(key => {
                    if (d[key] != null) {
                        const num = Number(d[key]);
                        (sanitized as any)[key] = isNaN(num) ? 0 : num;
                    }
                });

                // Special handling for dates
                const tsSource = d.timestamp;
                if (tsSource instanceof Timestamp) {
                    sanitized.timestamp = tsSource.toDate().toISOString();
                } else if (typeof tsSource === 'string' && tsSource) {
                    sanitized.timestamp = tsSource;
                }

                const fhSource = d.fecha_hora;
                if (fhSource instanceof Timestamp) {
                    const date = fhSource.toDate();
                    const timezoneOffset = date.getTimezoneOffset() * 60000;
                    sanitized.fecha_hora = new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
                } else if (typeof fhSource === 'string' && fhSource) {
                    sanitized.fecha_hora = fhSource;
                }
                
                return sanitized;
            });

            setFeedbackList(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching data from Firestore:", error);
            if (error.code === 'failed-precondition') {
                 console.error("Firestore error: Missing or insufficient permissions. Make sure your Firestore security rules are set up correctly and you have created the necessary indexes.");
            }
            setIsLoading(false);
            setFeedbackList([]);
        });

        return () => unsubscribe();
    }, []);

    const addFeedback = useCallback(async (data: FeedbackData) => {
        const { id, timestamp, ...feedbackData } = data;
        
        const newFeedback = {
            ...feedbackData,
            timestamp: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, 'feedback'), newFeedback);
        } catch (error) {
            console.error("Error adding feedback to Firestore", error);
            throw error;
        }
    }, []);

    const updateFeedbackReview = useCallback(async (id: string, status: ReviewStatus, result: string) => {
        const feedbackDoc = doc(db, 'feedback', id);
        try {
            await updateDoc(feedbackDoc, {
                review_status: status,
                review_result: result,
            });
        } catch (error) {
            console.error("Error updating feedback in Firestore", error);
            throw error;
        }
    }, []);

    const deleteFeedback = useCallback(async (id: string) => {
        const feedbackDoc = doc(db, 'feedback', id);
        try {
            await deleteDoc(feedbackDoc);
        } catch (error) {
            console.error("Error deleting feedback from Firestore", error);
            throw error;
        }
    }, []);

    const bulkUpdateFeedbackStatus = useCallback(async (ids: string[], status: ReviewStatus) => {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const feedbackDoc = doc(db, 'feedback', id);
            batch.update(feedbackDoc, { review_status: status });
        });
        try {
            await batch.commit();
        } catch (error) {
            console.error("Error in bulk update in Firestore", error);
            throw error;
        }
    }, []);

    const bulkDeleteFeedback = useCallback(async (ids: string[]) => {
        const batch = writeBatch(db);
        ids.forEach(id => {
            const feedbackDoc = doc(db, 'feedback', id);
            batch.delete(feedbackDoc);
        });
        try {
            await batch.commit();
        } catch (error) {
            console.error("Error in bulk delete in Firestore", error);
            throw error;
        }
    }, []);

    return { feedbackList, isLoading, addFeedback, updateFeedbackReview, deleteFeedback, bulkUpdateFeedbackStatus, bulkDeleteFeedback };
};