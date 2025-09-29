import React, { useState } from 'react';
import type { FeedbackData, ReviewStatus } from '../types.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';

interface FeedbackManagementRowProps {
    feedback: FeedbackData;
    onUpdateReview: (id: string, status: ReviewStatus, result: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
        case 'Pendiente':
            return 'bg-yellow-100 text-yellow-800';
        case 'En Revisión':
            return 'bg-blue-100 text-blue-800';
        case 'Revisado':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const FeedbackManagementRow: React.FC<FeedbackManagementRowProps> = ({ feedback, onUpdateReview, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(feedback.review_status);
    const [reviewResult, setReviewResult] = useState(feedback.review_result);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    
    const date = feedback.timestamp ? new Date(feedback.timestamp).toLocaleDateString('es-ES') : 'N/A';

    const handleSaveReview = async () => {
        if (!feedback.id) return;
        setIsSaving(true);
        await onUpdateReview(feedback.id, reviewStatus, reviewResult);
        setIsSaving(false);
    };

    const handleDelete = async () => {
        if (!feedback.id) return;
        // No es necesario cerrar el modal aquí, ya que el componente se desmontará si el borrado tiene éxito.
        await onDelete(feedback.id);
    };

    return (
        <>
            <tr className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <td className="py-3 px-4 text-sm text-gray-700">{date}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{feedback.escenario_keywords}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{feedback.tipo_feedback}</td>
                <td className="py-3 px-4 text-sm text-center text-amber-500 font-bold">{feedback.valoracion_deontologica || 'N/A'}</td>
                <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reviewStatus)}`}>
                        {reviewStatus}
                    </span>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-gray-50 border-b border-gray-200">
                    <td colSpan={5} className="p-4">
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold text-gray-800">Detalles del Feedback</h4>
                                <p className="text-sm text-gray-600 mt-1"><strong>Contacto:</strong> {feedback.nombre_evaluador || 'Anónimo'}</p>
                                <p className="text-sm text-gray-600"><strong>Descripción:</strong> {feedback.descripcion}</p>
                                {feedback.respuesta_chatbot && <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-100 rounded"><strong>Respuesta IA:</strong> <em>"{feedback.respuesta_chatbot}"</em></p>}
                            </div>
                            <div className="pt-3 border-t">
                                 <h4 className="font-semibold text-gray-800 mb-2">Gestionar Revisión</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                        <label htmlFor={`review-status-${feedback.id}`} className="block text-sm font-medium text-black">Estado</label>
                                        <select
                                            id={`review-status-${feedback.id}`}
                                            value={reviewStatus}
                                            onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm bg-white text-black focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="En Revisión">En Revisión</option>
                                            <option value="Revisado">Revisado</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor={`review-result-${feedback.id}`} className="block text-sm font-medium text-black">Resultado / Notas</label>
                                        <textarea
                                            id={`review-result-${feedback.id}`}
                                            rows={2}
                                            value={reviewResult}
                                            onChange={(e) => setReviewResult(e.target.value)}
                                            placeholder="Añadir notas sobre la revisión..."
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm bg-white text-black placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end items-center gap-3 mt-3">
                                    <button
                                        onClick={() => setIsConfirmingDelete(true)}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md"
                                    >
                                        Borrar Registro
                                    </button>
                                    <button 
                                        onClick={handleSaveReview}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400 disabled:cursor-wait"
                                    >
                                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
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