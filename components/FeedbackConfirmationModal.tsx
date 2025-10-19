import React from 'react';
import type { FeedbackData } from '../types.ts';

interface FeedbackConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    feedbackData: FeedbackData;
}

const DataRow: React.FC<{ label: string; value: string | number | undefined | null }> = ({ label, value }) => {
    if (value === null || value === undefined || value === '' || value === 0) return null;
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
    const isCorpusValidation = feedbackData.tipo_feedback === 'Validación de Corpus';

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
                        <DataRow label="Tipo de Feedback" value={feedbackData.tipo_feedback} />
                        
                        {!isCorpusValidation && <DataRow label="Escenario" value={feedbackData.escenario_keywords} />}

                        <DataRow label="Descripción Detallada" value={feedbackData.descripcion} />
                        <DataRow label="Respuesta del Chatbot" value={feedbackData.respuesta_chatbot} />
                        
                        {isConversationValuation && (
                            <>
                                <DataRow label="Claridad" value={feedbackData.claridad} />
                                <DataRow label="Utilidad" value={feedbackData.utilidad} />
                                <DataRow label="Coherencia Interacciones" value={`${feedbackData.coherencia_interacciones} ★`} />
                                <DataRow label="Facilidad de Avance" value={`${feedbackData.facilidad_avance_resolucion} ★`} />
                                <DataRow label="Nº de Interacciones" value={feedbackData.numero_interacciones} />
                                <DataRow label="Valoración Deontológica" value={`${feedbackData.valoracion_deontologica} ★`} />
                                <DataRow label="Pertinencia Respuestas" value={`${feedbackData.valoracion_pertinencia} ★`} />
                                <DataRow label="Calidad Interacción" value={`${feedbackData.valoracion_calidad_interaccion} ★`} />
                                <DataRow label="Aplicabilidad Experta" value={feedbackData.utilidad_experto_aplicabilidad} />
                                <DataRow label="Justificación Experta" value={feedbackData.utilidad_experto_justificacion} />
                                <DataRow label="Impacto en Decisión" value={`${feedbackData.impacto_resolucion_dilemas} ★`} />
                            </>
                        )}

                        {isCorpusValidation && (
                             <>
                                <DataRow label="C1: Pertinencia Fuentes" value={`${feedbackData.corpus_c1_fuentes_pertinentes}/5`} />
                                <DataRow label="C2: Estructura Exhaustiva" value={`${feedbackData.corpus_c2_estructura_exhaustiva}/5`} />
                                <DataRow label="C3: Libre Info. No Autorizada" value={`${feedbackData.corpus_c3_libre_info_no_autorizada}/5`} />
                                <DataRow label="C4: Detalle Suficiente" value={`${feedbackData.corpus_c4_detalle_suficiente}/5`} />
                                <DataRow label="C5: Core Fiable y Legítimo" value={`${feedbackData.corpus_c5_core_fiable_legitimo}/5`} />
                                <DataRow label="C6: Cobertura Temática" value={`${feedbackData.corpus_c6_cobertura_tematica}/5`} />
                                <DataRow label="C7: Actualización y Vigencia" value={`${feedbackData.corpus_c7_actualizacion_vigencia}/5`} />
                                <DataRow label="C8: Precisión y Rigor" value={`${feedbackData.corpus_c8_precision_rigor}/5`} />
                                <DataRow label="C9: Representatividad y Diversidad" value={`${feedbackData.corpus_c9_representatividad_diversidad}/5`} />
                                <DataRow label="C10: Redacción y Claridad" value={`${feedbackData.corpus_c10_redaccion_claridad}/5`} />
                                <DataRow label="C11: Referenciación y Trazabilidad" value={`${feedbackData.corpus_c11_referenciacion_trazabilidad}/5`} />
                                <DataRow label="Comentarios sobre Corpus" value={feedbackData.corpus_comentarios} />
                                <DataRow label="Propuestas Documentación" value={feedbackData.corpus_propuestas} />
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