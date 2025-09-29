import React, { useState, useEffect } from 'react';
import type { FeedbackData, ReviewStatus } from '../types.ts';
import { PaginationControls } from './PaginationControls.tsx';

interface FeedbackResultsProps {
    feedbackList: FeedbackData[];
    isLoading: boolean;
    onUpdateReview: (id: string, status: ReviewStatus, result: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 9;

const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
        case 'Pendiente':
            return 'bg-yellow-200 text-yellow-800';
        case 'En Revisión':
            return 'bg-blue-200 text-blue-800';
        case 'Revisado':
            return 'bg-green-200 text-green-800';
        default:
            return 'bg-gray-200 text-gray-800';
    }
};

const FeedbackCard: React.FC<{ feedback: FeedbackData; onUpdateReview: FeedbackResultsProps['onUpdateReview'] }> = ({ feedback, onUpdateReview }) => {
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(feedback.review_status);
    const [reviewResult, setReviewResult] = useState(feedback.review_result);
    const [isSaving, setIsSaving] = useState(false);

    const filledStars = '★'.repeat(feedback.valoracion_deontologica || 0);
    const emptyStars = '☆'.repeat(5 - (feedback.valoracion_deontologica || 0));
    const stars = filledStars + emptyStars;
    const date = feedback.timestamp ? new Date(feedback.timestamp).toLocaleDateString('es-ES') : 'Fecha desconocida';

    const handleSaveReview = async () => {
        if (!feedback.id) return;
        setIsSaving(true);
        await onUpdateReview(feedback.id, reviewStatus, reviewResult);
        setIsSaving(false);
        setIsReviewing(false);
    };

    return (
        <div className="p-3 border border-indigo-100 rounded-lg shadow-sm bg-white flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-gray-800 text-sm">{feedback.escenario_keywords}</p>
                        <p className="text-xs text-indigo-600">{feedback.tipo_feedback}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap ${getStatusColor(feedback.review_status)}`}>
                        {feedback.review_status}
                    </span>
                </div>

                <div className="flex justify-between items-center mt-3 text-sm">
                    <span className="text-amber-400 text-lg" title={`${feedback.valoracion_deontologica || 0}/5 estrellas`}>{stars}</span>
                    <span className="text-gray-500 text-xs">{date}</span>
                </div>

                {feedback.descripcion && (
                    <p className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                        {feedback.descripcion}
                    </p>
                )}
            </div>
            
            <div className="mt-3 pt-3 border-t">
                {isReviewing ? (
                    <div className="space-y-3">
                        <div>
                            <label htmlFor={`review-status-${feedback.id}`} className="block text-xs font-medium text-gray-700">Cambiar Estado</label>
                            <select
                                id={`review-status-${feedback.id}`}
                                value={reviewStatus}
                                onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1.5 text-xs focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Revisión">En Revisión</option>
                                <option value="Revisado">Revisado</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor={`review-result-${feedback.id}`} className="block text-xs font-medium text-gray-700">Resultado</label>
                            <textarea
                                id={`review-result-${feedback.id}`}
                                rows={2}
                                value={reviewResult}
                                onChange={(e) => setReviewResult(e.target.value)}
                                placeholder="Añadir notas..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1.5 text-xs focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsReviewing(false)} className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveReview}
                                disabled={isSaving}
                                className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400"
                            >
                                {isSaving ? '...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                         <p className="text-xs text-gray-500 italic truncate pr-2" title={feedback.review_result || "Sin resultado de revisión"}>
                            {feedback.review_result || "Sin resultado..."}
                         </p>
                        <button onClick={() => setIsReviewing(true)} className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md whitespace-nowrap">
                            Gestionar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const FeedbackResults: React.FC<FeedbackResultsProps> = ({ feedbackList, isLoading, onUpdateReview }) => {
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [feedbackList]);

    const totalPages = Math.ceil(feedbackList.length / ITEMS_PER_PAGE);
    const paginatedFeedback = feedbackList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="mt-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Últimos Feedbacks Recibidos</h3>
            {isLoading ? (
                <div className="text-center text-gray-500 p-4">Cargando datos...</div>
            ) : feedbackList.length === 0 ? (
                <div className="text-center text-gray-500 p-4">Aún no hay feedback registrado.</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedFeedback.map((feedback) => (
                            <FeedbackCard key={feedback.id} feedback={feedback} onUpdateReview={onUpdateReview} />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <PaginationControls 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </>
            )}
        </div>
    );
};