import React, { useState, useEffect } from 'react';
import type { FeedbackData, ReviewStatus } from '../types.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';
import { GoogleGenAI } from '@google/genai';

interface FeedbackManagementRowProps {
    feedback: FeedbackData;
    onUpdateReview: (id: string, status: ReviewStatus, result: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
    apiKey: string;
}

const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
        case 'Pendiente':
            return 'bg-yellow-100 text-yellow-800';
        case 'En Revisión':
            return 'bg-blue-100 text-blue-800';
        case 'Revisado':
            return 'bg-green-100 text-green-800';
        case 'Cerrado':
            return 'bg-gray-200 text-gray-700';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const FeedbackManagementRow: React.FC<FeedbackManagementRowProps> = ({ feedback, onUpdateReview, onDelete, isSelected, onToggleSelect, showToast, apiKey }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(feedback.review_status);
    const [reviewResult, setReviewResult] = useState(feedback.review_result);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    
    // Sincroniza el estado interno cuando las props cambian desde el padre
    useEffect(() => {
        setReviewStatus(feedback.review_status);
        setReviewResult(feedback.review_result);
    }, [feedback.review_status, feedback.review_result]);

    const date = feedback.timestamp ? new Date(feedback.timestamp).toLocaleDateString('es-ES') : 'N/A';
    
    const isCorpusValidation = feedback.tipo_feedback === 'Validación de Corpus';

    const avgCorpusRating = isCorpusValidation
    ? (
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
    ) / 11
    : null;


    const handleGenerateSummary = async () => {
        if (!apiKey) {
            showToast('Por favor, configure su API Key en los ajustes.', 'error');
            return;
        }
        setIsGeneratingSummary(true);
        try {
            const ai = new GoogleGenAI({ apiKey });
            
            const prompt = `
                Eres un analista experto en feedback para un chatbot de deontología en trabajo social.
                Analiza el siguiente feedback y genera un resumen conciso y bien estructurado para el equipo de revisión.
                El resumen debe tener 3 partes claras con títulos en negrita:
                1.  **Problema Principal:** Describe el núcleo del feedback (error, sugerencia, inquietud, o los puntos clave de la validación del corpus).
                2.  **Sentimiento del Usuario:** Infiere si el sentimiento es positivo, negativo o neutral, basándote en el texto y las valoraciones.
                3.  **Acción Sugerida:** Propón un siguiente paso concreto para el equipo (ej: "investigar bug", "considerar para futura mejora", "archivar como positivo", "escalar a comité de ética", "analizar sugerencias para el corpus").

                Aquí están los datos del feedback:
                - **Tipo de Feedback:** ${feedback.tipo_feedback}
                ${isCorpusValidation ? `
                - **C1 - Fuentes Pertinentes:** ${feedback.corpus_c1_fuentes_pertinentes}/5
                - **C2 - Estructura Exhaustiva:** ${feedback.corpus_c2_estructura_exhaustiva}/5
                - **C3 - Libre Info No Autorizada:** ${feedback.corpus_c3_libre_info_no_autorizada}/5
                - **C4 - Detalle Suficiente:** ${feedback.corpus_c4_detalle_suficiente}/5
                - **C5 - Core Fiable y Legítimo:** ${feedback.corpus_c5_core_fiable_legitimo}/5
                - **C6 - Cobertura Temática:** ${feedback.corpus_c6_cobertura_tematica}/5
                - **C7 - Actualización y Vigencia:** ${feedback.corpus_c7_actualizacion_vigencia}/5
                - **C8 - Precisión y Rigor:** ${feedback.corpus_c8_precision_rigor}/5
                - **C9 - Representatividad y Diversidad:** ${feedback.corpus_c9_representatividad_diversidad}/5
                - **C10 - Redacción y Claridad:** ${feedback.corpus_c10_redaccion_claridad}/5
                - **C11 - Referenciación y Trazabilidad:** ${feedback.corpus_c11_referenciacion_trazabilidad}/5
                - **Comentarios sobre el Corpus:** ${feedback.corpus_comentarios || 'No proporcionados'}
                - **Propuestas de Documentación:** ${feedback.corpus_propuestas || 'No proporcionadas'}
                ` : `
                - **Escenario:** ${feedback.escenario_keywords}
                - **Descripción del Usuario:** ${feedback.descripcion}
                - **Respuesta del Chatbot (si aplica):** ${feedback.respuesta_chatbot || 'No proporcionada'}
                - **Comentarios Finales:** ${feedback.comentarios_finales || 'No proporcionados'}
                ${feedback.tipo_feedback === 'Valorar Conversación' ? `
                - **Claridad:** ${feedback.claridad}
                - **Utilidad:** ${feedback.utilidad}
                - **Valoración Deontológica:** ${feedback.valoracion_deontologica}/5
                - **Valoración Pertinencia:** ${feedback.valoracion_pertinencia}/5
                - **Valoración Calidad Interacción:** ${feedback.valoracion_calidad_interaccion}/5
                - **Coherencia Conversación:** ${feedback.coherencia_interacciones}/5
                - **Facilidad Avance:** ${feedback.facilidad_avance_resolucion}/5
                - **Número Interacciones:** ${feedback.numero_interacciones > 0 ? feedback.numero_interacciones : 'No proporcionado'}
                - **Aplicabilidad Experta:** ${feedback.utilidad_experto_aplicabilidad || 'No proporcionado'}
                - **Justificación Experta:** ${feedback.utilidad_experto_justificacion || 'No proporcionada'}
                - **Impacto en Decisión:** ${feedback.impacto_resolucion_dilemas}/5
                ` : ''}
                `}
                Genera el resumen ahora.
            `;
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
    
            let summary = response.text;
            // Clean the summary text to remove markdown code fences
            summary = summary.replace(/^```(html)?\s*/, '').replace(/```\s*$/, '');
            setReviewResult(summary.trim());
            showToast('Resumen generado con éxito.');
    
        } catch (error) {
            console.error("Error generating summary:", error);
            showToast('Error al generar el resumen.', 'error');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleSaveReview = async () => {
        if (!feedback.id) return;
        setIsSaving(true);
        try {
            await onUpdateReview(feedback.id, reviewStatus, reviewResult);
            showToast('Revisión actualizada con éxito.');
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
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevents row from expanding/collapsing
        if (feedback.id) {
            onToggleSelect(feedback.id);
        }
    };

    return (
        <>
            <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                <td className="py-3 px-4 checkbox-cell" onClick={handleCheckboxClick}>
                     <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        checked={isSelected}
                        readOnly // The click is handled by the parent td
                        aria-label={`Seleccionar feedback de ${feedback.escenario_keywords}`}
                    />
                </td>
                <td data-label="Fecha" className="py-3 px-4 text-sm text-gray-700 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>{date}</td>
                <td data-label="Escenario" className="py-3 px-4 text-sm text-gray-700 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>{feedback.escenario_keywords || 'N/A'}</td>
                <td data-label="Tipo" className="py-3 px-4 text-sm text-gray-700 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>{feedback.tipo_feedback}</td>
                <td data-label="Valoración" className="py-3 px-4 text-sm text-amber-500 font-bold cursor-pointer text-right lg:text-center" onClick={() => setIsExpanded(!isExpanded)}>
                    {isCorpusValidation ? (avgCorpusRating ? avgCorpusRating.toFixed(1) : 'N/A') : (feedback.valoracion_deontologica || 'N/A')}
                </td>
                <td data-label="Estado" className="py-3 px-4 text-sm cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reviewStatus)}`}>
                        {reviewStatus}
                    </span>
                </td>
            </tr>
            {isExpanded && (
                <tr className={`${isSelected ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <td colSpan={6} className="p-4 expand-details">
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold text-gray-800">Detalles del Feedback</h4>
                                <p className="text-sm text-gray-600 mt-1"><strong>Contacto:</strong> {feedback.nombre_evaluador || 'Anónimo'}</p>
                                {feedback.tipo_feedback === 'Valorar Conversación' && (
                                     <div className="text-sm text-gray-600 mt-1 space-y-1">
                                        <p>
                                            <strong>Valoraciones:</strong> Deontológica: {feedback.valoracion_deontologica || 'N/A'} ★ | Pertinencia: {feedback.valoracion_pertinencia || 'N/A'} ★ | Calidad: {feedback.valoracion_calidad_interaccion || 'N/A'} ★ | Impacto: {feedback.impacto_resolucion_dilemas || 'N/A'} ★
                                        </p>
                                        <p>
                                            <strong>Más Valoraciones:</strong> Coherencia: {feedback.coherencia_interacciones || 'N/A'} ★ | Facilidad Avance: {feedback.facilidad_avance_resolucion || 'N/A'} ★ | Nº Interacciones: {feedback.numero_interacciones > 0 ? feedback.numero_interacciones : 'N/A'}
                                        </p>
                                     </div>
                                )}
                                {feedback.descripcion && <p className="text-sm text-gray-600"><strong>Descripción:</strong> {feedback.descripcion}</p>}
                                {feedback.respuesta_chatbot && <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-100 rounded"><strong>Respuesta IA:</strong> <em>"{feedback.respuesta_chatbot}"</em></p>}
                                {feedback.utilidad_experto_aplicabilidad && (
                                    <div className="text-sm text-gray-600 mt-2 p-2 bg-indigo-50 rounded border border-indigo-100">
                                        <p><strong>Feedback Experto:</strong> {feedback.utilidad_experto_aplicabilidad}</p>
                                        {feedback.utilidad_experto_justificacion && <p className="mt-1"><em>"{feedback.utilidad_experto_justificacion}"</em></p>}
                                    </div>
                                )}
                                {isCorpusValidation && (
                                    <div className="mt-2 pt-2 border-t">
                                        <h5 className="font-semibold text-gray-700">Resultados Validación Corpus:</h5>
                                        <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                                            {feedback.corpus_c1_fuentes_pertinentes && <li>C1 - Fuentes Pertinentes: <strong>{feedback.corpus_c1_fuentes_pertinentes}/5</strong></li>}
                                            {feedback.corpus_c2_estructura_exhaustiva && <li>C2 - Estructura Exhaustiva: <strong>{feedback.corpus_c2_estructura_exhaustiva}/5</strong></li>}
                                            {feedback.corpus_c3_libre_info_no_autorizada && <li>C3 - Libre Info. No Autorizada: <strong>{feedback.corpus_c3_libre_info_no_autorizada}/5</strong></li>}
                                            {feedback.corpus_c4_detalle_suficiente && <li>C4 - Detalle Suficiente: <strong>{feedback.corpus_c4_detalle_suficiente}/5</strong></li>}
                                            {feedback.corpus_c5_core_fiable_legitimo && <li>C5 - Core Fiable y Legítimo: <strong>{feedback.corpus_c5_core_fiable_legitimo}/5</strong></li>}
                                            {feedback.corpus_c6_cobertura_tematica && <li>C6 - Cobertura Temática: <strong>{feedback.corpus_c6_cobertura_tematica}/5</strong></li>}
                                            {feedback.corpus_c7_actualizacion_vigencia && <li>C7 - Actualización y Vigencia: <strong>{feedback.corpus_c7_actualizacion_vigencia}/5</strong></li>}
                                            {feedback.corpus_c8_precision_rigor && <li>C8 - Precisión y Rigor: <strong>{feedback.corpus_c8_precision_rigor}/5</strong></li>}
                                            {feedback.corpus_c9_representatividad_diversidad && <li>C9 - Representatividad y Diversidad: <strong>{feedback.corpus_c9_representatividad_diversidad}/5</strong></li>}
                                            {feedback.corpus_c10_redaccion_claridad && <li>C10 - Redacción y Claridad: <strong>{feedback.corpus_c10_redaccion_claridad}/5</strong></li>}
                                            {feedback.corpus_c11_referenciacion_trazabilidad && <li>C11 - Referenciación y Trazabilidad: <strong>{feedback.corpus_c11_referenciacion_trazabilidad}/5</strong></li>}
                                        </ul>
                                        {feedback.corpus_comentarios && <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-100 rounded"><strong>Comentarios Corpus:</strong> <em>"{feedback.corpus_comentarios}"</em></p>}
                                        {feedback.corpus_propuestas && <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-100 rounded"><strong>Propuestas Documentación:</strong> <em>"{feedback.corpus_propuestas}"</em></p>}
                                    </div>
                                )}
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
                                            <option value="Cerrado">Cerrado</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <div className="flex justify-between items-center mb-1">
                                            <label htmlFor={`review-result-${feedback.id}`} className="block text-sm font-medium text-black">Resultado / Notas</label>
                                            <button 
                                                type="button" 
                                                onClick={handleGenerateSummary} 
                                                disabled={isGeneratingSummary || !apiKey}
                                                className="px-3 py-1 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-md disabled:bg-violet-400 disabled:cursor-not-allowed flex items-center gap-1"
                                                title={!apiKey ? 'Configure la API Key en los ajustes para usar esta función' : 'Generar resumen con IA'}
                                            >
                                                {isGeneratingSummary ? (
                                                    <>
                                                        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span>Generando...</span>
                                                    </>
                                                ) : (
                                                    '✨ Generar Resumen IA'
                                                )}
                                            </button>
                                        </div>
                                        <textarea
                                            id={`review-result-${feedback.id}`}
                                            rows={4}
                                            value={reviewResult}
                                            onChange={(e) => setReviewResult(e.target.value)}
                                            placeholder="Añadir notas sobre la revisión o generar un resumen con IA..."
                                            className="block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm bg-white text-black placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
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