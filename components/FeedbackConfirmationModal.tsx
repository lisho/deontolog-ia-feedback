import React from 'react';
import type { FeedbackData } from '../types.ts';

interface FeedbackConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    feedbackData: FeedbackData;
}

const DataRow: React.FC<{ label: string; value: string | number | undefined | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-words">{value}</dd>
        </div>
    );
};

export const FeedbackConfirmationModal: React.FC<FeedbackConfirmationModalProps> = ({ isOpen, onClose, onConfirm, feedbackData }) => {
    if (!isOpen) return null;
    
    const isConversationValuation = feedbackData.tipo_feedback === 'Valorar Conversación';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h2 id="modal-title" className="text-xl font-bold text-gray-900">Confirmar Envío de Feedback</h2>
                    <p className="mt-1 text-sm text-gray-600">Por favor, revisa los datos que vas a enviar.</p>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <dl className="divide-y divide-gray-200">
                        <DataRow label="Dispositivo" value={feedbackData.dispositivo} />
                        <DataRow label="Escenario" value={feedbackData.escenario_keywords} />
                        <DataRow label="Tipo de Feedback" value={feedbackData.tipo_feedback} />
                        <DataRow label="Descripción Detallada" value={feedbackData.descripcion} />
                        <DataRow label="Respuesta del Chatbot" value={feedbackData.respuesta_chatbot} />
                        
                        {isConversationValuation && (
                            <>
                                <DataRow label="Claridad" value={feedbackData.claridad} />
                                <DataRow label="Utilidad" value={feedbackData.utilidad} />
                                <DataRow label="Valoración Deontológica" value={feedbackData.valoracion_deontologica > 0 ? `${feedbackData.valoracion_deontologica} ★` : null} />
                                <DataRow label="Pertinencia Respuestas" value={feedbackData.valoracion_pertinencia > 0 ? `${feedbackData.valoracion_pertinencia} ★` : null} />
                                <DataRow label="Calidad Interacción" value={feedbackData.valoracion_calidad_interaccion > 0 ? `${feedbackData.valoracion_calidad_interaccion} ★` : null} />
                            </>
                        )}

                        <DataRow label="Comentarios Finales" value={feedbackData.comentarios_finales} />
                    </dl>
                </div>

                <div className="mt-auto p-6 bg-gray-50 border-t rounded-b-lg flex justify-end gap-4">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Corregir
                    </button>
                    <button onClick={onConfirm} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Confirmar Envío
                    </button>
                </div>
            </div>
        </div>
    );
};