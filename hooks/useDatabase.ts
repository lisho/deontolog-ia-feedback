import { useState, useEffect, useCallback } from 'react';
import type { FeedbackData, ReviewStatus, ReportData } from '../types.ts';
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
    const [reports, setReports] = useState<ReportData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingReports, setIsLoadingReports] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const feedbackCol = collection(db, 'feedback');
        const q = query(feedbackCol, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: FeedbackData[] = querySnapshot.docs.map(doc => {
                const d = doc.data();
                const sanitized: FeedbackData = {
                    id: doc.id,
                    nombre_evaluador: String(d.nombre_evaluador || ''),
                    fecha_hora: '',
                    dispositivo: d.dispositivo || '',
                    escenario_keywords: String(d.escenario_keywords || ''),
                    tipo_feedback: d.tipo_feedback || '',
                    descripcion: String(d.descripcion || ''),
                    respuesta_chatbot: String(d.respuesta_chatbot || ''),
                    claridad: d.claridad || '',
                    utilidad: d.utilidad || '',
                    valoracion_deontologica: Number(d.valoracion_deontologica || 0),
                    valoracion_pertinencia: Number(d.valoracion_pertinencia || 0),
                    valoracion_calidad_interaccion: Number(d.valoracion_calidad_interaccion || 0),
                    comentarios_finales: String(d.comentarios_finales || ''),
                    utilidad_experto_aplicabilidad: d.utilidad_experto_aplicabilidad || '',
                    utilidad_experto_justificacion: String(d.utilidad_experto_justificacion || ''),
                    impacto_resolucion_dilemas: Number(d.impacto_resolucion_dilemas || 0),
                    coherencia_interacciones: Number(d.coherencia_interacciones || 0),
                    numero_interacciones: Number(d.numero_interacciones || 0),
                    facilidad_avance_resolucion: Number(d.facilidad_avance_resolucion || 0),
                    corpus_c1_fuentes_pertinentes: Number(d.corpus_c1_fuentes_pertinentes || 0),
                    corpus_c2_estructura_exhaustiva: Number(d.corpus_c2_estructura_exhaustiva || 0),
                    corpus_c3_libre_info_no_autorizada: Number(d.corpus_c3_libre_info_no_autorizada || 0),
                    corpus_c4_detalle_suficiente: Number(d.corpus_c4_detalle_suficiente || 0),
                    corpus_c5_core_fiable_legitimo: Number(d.corpus_c5_core_fiable_legitimo || 0),
                    corpus_c6_cobertura_tematica: Number(d.corpus_c6_cobertura_tematica || 0),
                    corpus_c7_actualizacion_vigencia: Number(d.corpus_c7_actualizacion_vigencia || 0),
                    corpus_c8_precision_rigor: Number(d.corpus_c8_precision_rigor || 0),
                    corpus_c9_representatividad_diversidad: Number(d.corpus_c9_representatividad_diversidad || 0),
                    corpus_c10_redaccion_claridad: Number(d.corpus_c10_redaccion_claridad || 0),
                    corpus_c11_referenciacion_trazabilidad: Number(d.corpus_c11_referenciacion_trazabilidad || 0),
                    corpus_comentarios: String(d.corpus_comentarios || ''),
                    corpus_propuestas: String(d.corpus_propuestas || ''),
                    timestamp: new Date(0).toISOString(),
                    review_status: d.review_status || 'Pendiente',
                    review_result: String(d.review_result || ''),
                };
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
            console.error("Error fetching feedback:", error);
            setIsLoading(false);
        });
        
        setIsLoadingReports(true);
        const reportsCol = collection(db, 'reports');
        const reportsQuery = query(reportsCol, orderBy('createdAt', 'desc'));
        const unsubscribeReports = onSnapshot(reportsQuery, (querySnapshot) => {
             const data: ReportData[] = querySnapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    title: d.title,
                    tab: d.tab,
                    aiSummary: d.aiSummary,
                    infographicHtml: d.infographicHtml,
                    tableHtml: d.tableHtml,
                    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
                };
            });
            setReports(data);
            setIsLoadingReports(false);
        }, (error) => {
            console.error("Error fetching reports:", error);
            setIsLoadingReports(false);
        });


        return () => {
            unsubscribe();
            unsubscribeReports();
        };
    }, []);

    const addFeedback = useCallback(async (data: FeedbackData) => {
        const { id, timestamp, ...feedbackData } = data;
        const newFeedback = { ...feedbackData, timestamp: serverTimestamp() };
        await addDoc(collection(db, 'feedback'), newFeedback);
    }, []);

    const updateFeedbackReview = useCallback(async (id: string, status: ReviewStatus, result: string) => {
        const feedbackDoc = doc(db, 'feedback', id);
        await updateDoc(feedbackDoc, { review_status: status, review_result: result });
    }, []);

    const deleteFeedback = useCallback(async (id: string) => {
        await deleteDoc(doc(db, 'feedback', id));
    }, []);

    const bulkUpdateFeedbackStatus = useCallback(async (ids: string[], status: ReviewStatus) => {
        const batch = writeBatch(db);
        ids.forEach(id => batch.update(doc(db, 'feedback', id), { review_status: status }));
        await batch.commit();
    }, []);

    const bulkDeleteFeedback = useCallback(async (ids: string[]) => {
        const batch = writeBatch(db);
        ids.forEach(id => batch.delete(doc(db, 'feedback', id)));
        await batch.commit();
    }, []);

    const addReport = useCallback(async (reportData: Omit<ReportData, 'id' | 'createdAt'>) => {
        const newReport = { ...reportData, createdAt: serverTimestamp() };
        await addDoc(collection(db, 'reports'), newReport);
    }, []);

    const deleteReport = useCallback(async (id: string) => {
        await deleteDoc(doc(db, 'reports', id));
    }, []);


    return { 
        feedbackList, 
        isLoading, 
        addFeedback, 
        updateFeedbackReview, 
        deleteFeedback, 
        bulkUpdateFeedbackStatus, 
        bulkDeleteFeedback,
        reports,
        isLoadingReports,
        addReport,
        deleteReport
    };
};