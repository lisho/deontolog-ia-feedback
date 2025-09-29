import { useState, useEffect, useCallback } from 'react';
import type { FeedbackData, ReviewStatus } from '../types.ts';

// Generate more mock data to test pagination
const generateMockData = (count: number): FeedbackData[] => {
    const data: FeedbackData[] = [];
    const types: FeedbackData['tipo_feedback'][] = ['Error o Fallo', 'Sugerencia de Mejora', 'Valoración Positiva / Uso Relevante', 'Inquietud Ética/Deontológica'];
    const statuses: ReviewStatus[] = ['Pendiente', 'En Revisión', 'Revisado'];
    const scenarios = ['Confidencialidad', 'Consentimiento', 'Privacidad de datos', 'Sesgo algorítmico', 'Transparencia del modelo', 'Dilema del tranvía', 'Autonomía del usuario'];

    for (let i = 0; i < count; i++) {
        const timestamp = new Date(Date.now() - i * 1000 * 60 * 60 * 24 * (Math.random() * 2)); // Stagger entries over the last ~50 days
        data.push({
            id: `mock${i + 1}`,
            nombre_evaluador: `Usuario ${i + 1}`,
            fecha_hora: timestamp.toISOString().slice(0, 16),
            dispositivo: ['Movil', 'Tableta', 'Ordenador'][i % 3] as 'Movil' | 'Tableta' | 'Ordenador',
            escenario_keywords: `${scenarios[i % scenarios.length]} #${i + 1}`,
            tipo_feedback: types[i % types.length] || 'Error o Fallo',
            descripcion: `Descripción detallada para el feedback número ${i + 1}. Este es un texto de ejemplo para ilustrar el contenido que podría encontrarse aquí.`,
            respuesta_chatbot: 'Respuesta del chatbot de ejemplo.',
            claridad: i % 2 === 0 ? 'Sí' : 'No',
            utilidad: ['Sí', 'No', 'No Estoy Seguro'][i % 3] as 'Sí' | 'No' | 'No Estoy Seguro',
            valoracion_deontologica: (i % 5) + 1,
            comentarios_finales: `Comentario final ${i + 1}.`,
            timestamp: timestamp,
            review_status: statuses[i % statuses.length] || 'Pendiente',
            review_result: statuses[i % statuses.length] === 'Revisado' ? `Resultado de la revisión para el item ${i + 1}.` : '',
        });
    }
    return data;
};


const initialFeedback: FeedbackData[] = generateMockData(25);


// Mock database interactions with local state and timeouts
export const useDatabase = () => {
    const [feedbackList, setFeedbackList] = useState<FeedbackData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching data on mount
        setTimeout(() => {
            // Let's sort by date descending
            const sortedData = [...initialFeedback].sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
            setFeedbackList(sortedData);
            setIsLoading(false);
        }, 1000);
    }, []);

    const addFeedback = useCallback(async (data: FeedbackData) => {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const newFeedback: FeedbackData = {
                    ...data,
                    id: `mock${Date.now()}`,
                    timestamp: new Date(),
                    review_status: 'Pendiente',
                };
                setFeedbackList(prev => [newFeedback, ...prev].sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)));
                resolve();
            }, 500);
        });
    }, []);

    const updateFeedbackReview = useCallback(async (id: string, status: ReviewStatus, result: string) => {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                setFeedbackList(prev =>
                    prev.map(fb =>
                        fb.id === id ? { ...fb, review_status: status, review_result: result } : fb
                    )
                );
                resolve();
            }, 500);
        });
    }, []);

    return { feedbackList, isLoading, addFeedback, updateFeedbackReview };
};