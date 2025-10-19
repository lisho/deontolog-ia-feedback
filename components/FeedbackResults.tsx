import React, { useState, useEffect } from 'react';
import type { FeedbackData, ReviewStatus } from '../types.ts';
import { PaginationControls } from './PaginationControls.tsx';
import { ExportButton } from './ExportButton.tsx';
import { ConfirmationModal } from './ConfirmationModal.tsx';

interface FeedbackResultsProps {
    feedbackList: FeedbackData[];
    isLoading: boolean;
    onUpdateReview: (id: string, status: ReviewStatus, result: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error') => void;
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
        case 'Cerrado':
            return 'bg-gray-300 text-gray-800';
        default:
            return 'bg-gray-200 text-gray-800';
    }
};

const FeedbackCard: React.FC<{ 
    feedback: FeedbackData; 
    onUpdateReview: FeedbackResultsProps['onUpdateReview']; 
    onDelete: FeedbackResultsProps['onDelete'];
    showToast: FeedbackResultsProps['showToast'];
}> = ({ feedback, onUpdateReview, onDelete, showToast }) => {
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(feedback.review_status);
    const [reviewResult, setReviewResult] = useState(feedback.review_result);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // Sincroniza el estado interno cuando las props cambian desde el padre
    useEffect(() => {
        setReviewStatus(feedback.review_status);
        setReviewResult(feedback.review_result);
    }, [feedback.review_status, feedback.review_result]);
    
    const isCorpusValidation = feedback.tipo_feedback === 'Validación de Corpus';
    
    const avgCorpusRating = isCorpusValidation
    ? Math.round((
        (feedback.corpus_c1_fuentes_pertinentes || 0) +
        (feedback.corpus_c2_estructura_exhaustiva || 0) +
        (feedback.corpus_c3_libre_info_no_autorizada || 0) +
        (feedback.corpus_c4_detalle_suficiente || 0) +
        (feedback.corpus_c5_core_fiable_legitimo || 0) +
        (feedback.corpus_c6_cobertura_tematica || 0) +
        (feedback.corpus_c7_actualizacion_vigencia || 0) +
        (feedback.corpus_c8_precision_rigor || 0) +
        (feedback.corpus_c9_representatividad_diversidad || 0) +
        (feedback.corpus_c10_redaccion_claridad || 0) +
        (feedback.corpus_c11_referenciacion_trazabilidad || 0)
    ) / 11)
    : 0;
    
    const ratingToShow = isCorpusValidation ? avgCorpusRating : (feedback.valoracion_deontologica || 0);

    const filledStars = '★'.repeat(ratingToShow);
    const emptyStars = '☆'.repeat(5 - ratingToShow);
    const stars = filledStars + emptyStars;
    const date = feedback.timestamp ? new Date(feedback.timestamp).toLocaleDateString('es-ES') : 'Fecha desconocida';

    const handleSaveReview = async () => {
        if (!feedback.id) return;
        setIsSaving(true);
        try {
            await onUpdateReview(feedback.id, reviewStatus, reviewResult);
            showToast('Revisión actualizada con éxito.');
            setIsReviewing(false);
        } catch (error) {
            console.error(error);
            showToast('Error al actualizar la revisión.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!feedback.id) return;
        try {
            await onDelete(feedback.id);
            showToast('Feedback eliminado con éxito.');
        } catch (error) {
            console.error(error);
            showToast('Error al eliminar el feedback.', 'error');
        }
        setIsConfirmingDelete(false);
    };

    return (
        <>
            <div className="p-3 border border-indigo-100 rounded-lg shadow-sm bg-white flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">{isCorpusValidation ? 'Validación de Corpus' : feedback.escenario_keywords}</p>
                            <p className="text-xs text-indigo-600">{feedback.tipo_feedback}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap ${getStatusColor(feedback.review_status)}`}>
                            {feedback.review_status}
                        </span>
                    </div>

                    <div className="flex justify-between items-center mt-3 text-sm">
                        <span className="text-amber-400 text-lg" title={`${ratingToShow}/5 estrellas`}>{stars}</span>
                        <span className="text-gray-500 text-xs">{date}</span>
                    </div>

                    {feedback.descripcion && (
                        <p className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                            {feedback.descripcion}
                        </p>
                    )}
                     {isCorpusValidation && feedback.corpus_comentarios && (
                        <p className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                            <strong>Comentarios:</strong> {feedback.corpus_comentarios}
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
                                    <option value="Cerrado">Cerrado</option>
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
                             <div className="flex items-center gap-2">
                                <button onClick={() => setIsConfirmingDelete(true)} className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md">
                                    Borrar
                                </button>
                                <button onClick={() => setIsReviewing(true)} className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md whitespace-nowrap">
                                    Gestionar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmingDelete}
                onClose={() => setIsConfirmingDelete(false)}
                onConfirm={handleDelete}
                title="Confirmar Borrado"
                message="¿Estás seguro de que quieres borrar este registro de feedback? Esta acción no se puede deshacer."
                confirmText="Sí, Borrar"
            />
        </>
    );
};

export const FeedbackResults: React.FC<FeedbackResultsProps> = ({ feedbackList, isLoading, onUpdateReview, onDelete, showToast }) => {
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
            <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h3 className="text-xl font-bold text-gray-800">Últimos Feedbacks Recibidos</h3>
                {feedbackList.length > 0 && (
                   <ExportButton data={feedbackList} />
                )}
            </div>
            {isLoading ? (
                <div className="text-center text-gray-500 p-4">Cargando datos...</div>
            ) : feedbackList.length === 0 ? (
                <div className="text-center text-gray-500 p-4">Aún no hay feedback registrado.</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedFeedback.map((feedback) => (
                            <FeedbackCard key={feedback.id} feedback={feedback} onUpdateReview={onUpdateReview} onDelete={onDelete} showToast={showToast} />
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