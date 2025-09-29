
import React, { useState, useCallback } from 'react';
import type { FeedbackData } from '../types.ts';
import { StarRating } from './StarRating.tsx';

const getInitialState = (): FeedbackData => {
    const now = new Date();
    // Adjust for timezone offset to get local time in YYYY-MM-DDTHH:mm format
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);

    return {
        nombre_evaluador: '',
        fecha_hora: localISOTime,
        dispositivo: '',
        escenario_keywords: '',
        tipo_feedback: '',
        descripcion: '',
        respuesta_chatbot: '',
        claridad: '',
        utilidad: '',
        valoracion_deontologica: 0,
        comentarios_finales: '',
        review_status: 'Pendiente',
        review_result: '',
    };
};

interface FeedbackFormProps {
    onSubmit: (data: FeedbackData) => Promise<void>;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit }) => {
    const [formData, setFormData] = useState<FeedbackData>(getInitialState());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleRatingChange = useCallback((value: number) => {
        setFormData(prev => ({ ...prev, valoracion_deontologica: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setShowSuccessMessage(false);
        try {
            await onSubmit(formData);
            
            // Se restablecen los campos del formulario a su estado inicial.
            setFormData(getInitialState());
            
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 5000); // Hide after 5 seconds
        } catch (error) {
            console.error("Submission failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isConversationValuation = formData.tipo_feedback === 'Valorar Conversación';

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {showSuccessMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-sm" role="alert">
                    <p className="font-bold">¡Feedback Enviado!</p>
                    <p>Gracias por tu contribución. Tu opinión es muy valiosa para nosotros.</p>
                </div>
            )}
            <style>{`
                input[type="datetime-local"].date-input-fix {
                    color: black;
                }
                .date-input-fix::-webkit-calendar-picker-indicator {
                    display: block;
                    opacity: 1;
                    filter: brightness(0);
                    cursor: pointer;
                }
            `}</style>
            <fieldset className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <legend className="text-lg font-semibold text-blue-700 px-2">A. Identificación del Uso</legend>

                <label htmlFor="nombre_evaluador" className="block text-sm font-medium text-black mt-2">Nombre o Contacto (Opcional):</label>
                <input type="text" id="nombre_evaluador" name="nombre_evaluador" value={formData.nombre_evaluador} onChange={handleChange} placeholder="Nombre, email o alias" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 text-black"/>
                <p className="text-xs text-gray-500 mb-4">Solo se usará si se requiere contactarle para ampliar la información.</p>

                <label htmlFor="fecha_hora" className="block text-sm font-medium text-black mt-2">Fecha y Hora del Uso/Incidente:</label>
                <input type="datetime-local" id="fecha_hora" name="fecha_hora" value={formData.fecha_hora} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black date-input-fix" required/>

                <label htmlFor="dispositivo" className="block text-sm font-medium text-black mt-4">Tipo de Dispositivo Utilizado:</label>
                <select id="dispositivo" name="dispositivo" value={formData.dispositivo} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black" required>
                    <option value="" disabled>Seleccione...</option>
                    <option value="Movil">Móvil</option>
                    <option value="Tableta">Tableta</option>
                    <option value="Ordenador">Ordenador</option>
                </select>

                <label htmlFor="escenario_keywords" className="block text-sm font-medium text-black mt-4">Escenario/Dilema planteado (Palabras clave):</label>
                <input type="text" id="escenario_keywords" name="escenario_keywords" value={formData.escenario_keywords} onChange={handleChange} placeholder="Ej: Confidencialidad en menores" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 text-black" required/>
            </fieldset>

            <fieldset className="p-4 border border-gray-200 rounded-lg">
                <legend className="text-lg font-semibold text-gray-800 px-2">B. Tipo de Feedback (Marque una)</legend>
                <div className="mt-2 space-y-2">
                    {[
                        { id: 'error', value: 'Error o Fallo', label: '1. Reporte de Error o Fallo (Bug)' },
                        { id: 'mejora', value: 'Sugerencia de Mejora', label: '2. Sugerencia de Mejora' },
                        { id: 'positivo', value: 'Valoración Positiva / Uso Relevante', label: '3. Valoración Positiva / Uso Relevante' },
                        { id: 'etica', value: 'Inquietud Ética/Deontológica', label: '4. Inquietud Ética/Deontológica' },
                        { id: 'valorar', value: 'Valorar Conversación', label: '5. Valorar Conversación Completa' },
                    ].map(option => (
                        <div key={option.id} className="flex items-center">
                            <input type="radio" id={option.id} name="tipo_feedback" value={option.value} checked={formData.tipo_feedback === option.value} onChange={handleChange} className="text-blue-600 focus:ring-blue-500" required/>
                            <label htmlFor={option.id} className="ml-3 text-sm font-medium text-black">{option.label}</label>
                        </div>
                    ))}
                </div>
            </fieldset>

            <fieldset className="p-4 border border-gray-200 rounded-lg">
                <legend className="text-lg font-semibold text-gray-800 px-2">C. Descripción Detallada</legend>
                <label htmlFor="descripcion" className="block text-sm font-medium text-black mt-2">Detalle (Error, Sugerencia o Aspecto Útil):</label>
                <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} rows={4} placeholder="Describa brevemente el problema encontrado o el aspecto relevante." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 text-black" required></textarea>
                <label htmlFor="respuesta_chatbot" className="block text-sm font-medium text-black mt-4">Copia aquí la respuesta del chatbot (opcional):</label>
                <textarea id="respuesta_chatbot" name="respuesta_chatbot" value={formData.respuesta_chatbot} onChange={handleChange} rows={3} placeholder="Pegue la respuesta de la IA para facilitar la revisión deontológica." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 text-black"></textarea>
            </fieldset>
            
            {isConversationValuation && (
                <fieldset className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 transition-all duration-300">
                    <legend className="text-lg font-semibold text-yellow-700 px-2">D. Evaluación Específica</legend>
                    <div className="mt-2">
                        <label className="block text-sm font-medium text-black">1. Claridad de la Respuesta: ¿Fue fácil de entender?</label>
                        <input type="radio" id="clara_si" name="claridad" value="Sí" checked={formData.claridad === 'Sí'} onChange={handleChange} required={isConversationValuation}/><label htmlFor="clara_si" className="ml-1 mr-4 text-black">Sí</label>
                        <input type="radio" id="clara_no" name="claridad" value="No" checked={formData.claridad === 'No'} onChange={handleChange} required={isConversationValuation}/><label htmlFor="clara_no" className="ml-1 text-black">No</label>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-black">2. Utilidad para la Práctica: ¿Te ayudaría a resolver el dilema?</label>
                        <input type="radio" id="util_si" name="utilidad" value="Sí" checked={formData.utilidad === 'Sí'} onChange={handleChange} required={isConversationValuation}/><label htmlFor="util_si" className="ml-1 mr-4 text-black">Sí</label>
                        <input type="radio" id="util_no" name="utilidad" value="No" checked={formData.utilidad === 'No'} onChange={handleChange} required={isConversationValuation}/><label htmlFor="util_no" className="ml-1 mr-4 text-black">No</label>
                        <input type="radio" id="util_seguro" name="utilidad" value="No Estoy Seguro" checked={formData.utilidad === 'No Estoy Seguro'} onChange={handleChange} required={isConversationValuation}/><label htmlFor="util_seguro" className="ml-1 text-black">No estoy seguro</label>
                    </div>
                    
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-black">3. Valoración Deontológica (0 a 5 estrellas):</label>
                        <StarRating value={formData.valoracion_deontologica} onChange={handleRatingChange} />
                    </div>
                </fieldset>
            )}

            <fieldset className="p-4 border border-gray-200 rounded-lg">
                <legend className="text-lg font-semibold text-gray-800 px-2">E. Comentarios Finales (Opcional)</legend>
                <label htmlFor="comentarios_finales" className="block text-sm font-medium text-black mt-2">¿Algún comentario adicional sobre la experiencia general?</label>
                <textarea id="comentarios_finales" name="comentarios_finales" value={formData.comentarios_finales} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"></textarea>
            </fieldset>

            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold text-white py-3 rounded-lg transition duration-150 disabled:bg-blue-400 disabled:cursor-wait">
                {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </button>
            <p className="text-xs text-center text-gray-500 mt-4">Los datos se almacenarán para su análisis y la mejora continua del chatbot.</p>
        </form>
    );
};