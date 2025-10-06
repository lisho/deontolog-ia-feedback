import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { FeedbackData } from '../types.ts';
import { StarRating } from './StarRating.tsx';
import { FeedbackConfirmationModal } from './FeedbackConfirmationModal.tsx';

interface FeedbackFormProps {
    onSubmit: (data: FeedbackData) => Promise<void>;
    formType: 'iteration' | 'conversation';
    onBack: () => void;
}

const getInitialState = (formType: 'iteration' | 'conversation'): FeedbackData => {
    const now = new Date();
    // Adjust for timezone offset to get local time in YYYY-MM-DDTHH:mm format
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);

    return {
        nombre_evaluador: '',
        fecha_hora: localISOTime,
        dispositivo: '',
        escenario_keywords: '',
        tipo_feedback: formType === 'conversation' ? 'Valorar Conversación' : '',
        descripcion: '',
        respuesta_chatbot: '',
        claridad: '',
        utilidad: '',
        valoracion_deontologica: 0,
        valoracion_pertinencia: 0,
        valoracion_calidad_interaccion: 0,
        comentarios_finales: '',
        review_status: 'Pendiente',
        review_result: '',
    };
};

const CheckmarkIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg className={`h-5 w-5 text-green-500 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const runValidation = (data: FeedbackData, formType: 'iteration' | 'conversation'): Partial<Record<keyof FeedbackData, string>> => {
    const newErrors: Partial<Record<keyof FeedbackData, string>> = {};

    if (!data.dispositivo) {
        newErrors.dispositivo = 'Debe seleccionar un dispositivo.';
    }
    if (!data.escenario_keywords.trim()) {
        newErrors.escenario_keywords = 'Debe rellenar las palabras clave del escenario.';
    }
    
    if (formType === 'iteration') {
        if (!data.tipo_feedback) {
            newErrors.tipo_feedback = 'Debe seleccionar un tipo de feedback.';
        }
        if (!data.descripcion.trim()) {
            newErrors.descripcion = 'La descripción detallada es obligatoria.';
        }
    }

    if (formType === 'conversation') {
        if (!data.claridad) {
            newErrors.claridad = 'Debe seleccionar si la respuesta fue clara.';
        }
        if (!data.utilidad) {
            newErrors.utilidad = 'Debe seleccionar la utilidad de la respuesta.';
        }
    }

    return newErrors;
};


export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, formType, onBack }) => {
    const [formData, setFormData] = useState<FeedbackData>(getInitialState(formType));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FeedbackData, string>>>({});
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof FeedbackData, boolean>>>({});
    const [validFields, setValidFields] = useState<Partial<Record<keyof FeedbackData, boolean>>>({});
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const validationErrors = runValidation(formData, formType);
        const newValidFields: Partial<Record<keyof FeedbackData, boolean>> = {};

        const fieldsToValidate: (keyof FeedbackData)[] = [
            'dispositivo', 'escenario_keywords', 'tipo_feedback', 'descripcion', 'claridad', 'utilidad'
        ];

        fieldsToValidate.forEach(fieldName => {
            if (touchedFields[fieldName] && !!formData[fieldName] && !validationErrors[fieldName]) {
                newValidFields[fieldName] = true;
            } else {
                 newValidFields[fieldName] = false;
            }
        });
        setValidFields(newValidFields);
    }, [formData, touchedFields, formType]);


    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
         if (!touchedFields[name as keyof FeedbackData]) {
            setTouchedFields(prev => ({ ...prev, [name]: true }));
        }
        if (errors[name as keyof FeedbackData]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof FeedbackData];
                return newErrors;
            });
        }
    }, [errors, touchedFields]);
    
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name } = e.target;
        setTouchedFields(prev => ({ ...prev, [name]: true }));
    }, []);

    const handleRatingChange = useCallback((name: keyof FeedbackData, value: number) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const validateForm = () => {
        const newErrors = runValidation(formData, formType);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (validateForm()) {
            setIsConfirmModalOpen(true);
        } else {
             const allTouched = {
                dispositivo: true,
                escenario_keywords: true,
             };
             if (formType === 'iteration') {
                allTouched['tipo_feedback'] = true;
                allTouched['descripcion'] = true;
             }
             if (formType === 'conversation') {
                 allTouched['claridad'] = true;
                 allTouched['utilidad'] = true;
             }
            setTouchedFields(allTouched);
        }
    };

    const handleConfirmSubmit = async () => {
        setIsConfirmModalOpen(false);
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            setShowSuccessMessage(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error("Submission failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isConversationValuation = formType === 'conversation';

    if (showSuccessMessage) {
        return (
            <div className="text-center p-8">
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-6 rounded-md shadow-sm mb-8" role="alert">
                    <p className="font-bold text-lg">¡Feedback Enviado!</p>
                    <p>Gracias por tu contribución. Tu opinión es muy valiosa para nosotros.</p>
                </div>
                <button 
                    onClick={onBack} 
                    className="w-full max-w-xs flex justify-center items-center bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold text-white py-3 rounded-lg transition duration-150 mx-auto"
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }


    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                 <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {isConversationValuation ? 'Feedback de Conversación Completa' : 'Feedback de Iteración Concreta'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isConversationValuation
                                ? 'Evalúe la calidad general de una interacción completa, incluyendo claridad, utilidad y aspectos deontológicos.'
                                : 'Reporte un error, sugiera una mejora o valore un aspecto específico de una respuesta del chatbot.'
                            }
                        </p>
                    </div>
                    <button type="button" onClick={onBack} className="text-sm text-blue-600 hover:underline font-medium flex-shrink-0 mt-1">
                        &larr; Volver al inicio
                    </button>
                </div>
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
                    <input ref={nameInputRef} type="text" id="nombre_evaluador" name="nombre_evaluador" value={formData.nombre_evaluador} onChange={handleChange} onBlur={handleBlur} placeholder="Nombre, email o alias" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 text-black"/>
                    <p className="text-xs text-gray-500 mb-4">Solo se usará si se requiere contactarle para ampliar la información.</p>

                    <label htmlFor="fecha_hora" className="block text-sm font-medium text-black mt-2">Fecha y Hora del Uso/Incidente:</label>
                    <input type="datetime-local" id="fecha_hora" name="fecha_hora" value={formData.fecha_hora} onChange={handleChange} onBlur={handleBlur} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black date-input-fix" required/>

                    <label htmlFor="dispositivo" className="block text-sm font-medium text-black mt-4">Tipo de Dispositivo Utilizado:</label>
                    <div className="relative">
                        <select id="dispositivo" name="dispositivo" value={formData.dispositivo} onChange={handleChange} onBlur={handleBlur} className={`mt-1 block w-full rounded-md shadow-sm p-2 pr-10 focus:ring-blue-500 focus:border-blue-500 bg-white text-black ${errors.dispositivo ? 'border-red-500' : 'border-gray-300'}`} required>
                            <option value="" disabled>Seleccione...</option>
                            <option value="Movil">Móvil</option>
                            <option value="Tableta">Tableta</option>
                            <option value="Ordenador">Ordenador</option>
                        </select>
                        {validFields.dispositivo && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <CheckmarkIcon />
                            </div>
                        )}
                    </div>
                    {errors.dispositivo && <p className="text-red-500 text-xs mt-1">{errors.dispositivo}</p>}

                    <label htmlFor="escenario_keywords" className="block text-sm font-medium text-black mt-4">Escenario/Dilema planteado (Palabras clave):</label>
                    <div className="relative">
                        <input type="text" id="escenario_keywords" name="escenario_keywords" value={formData.escenario_keywords} onChange={handleChange} onBlur={handleBlur} placeholder="Ej: Confidencialidad en menores" className={`mt-1 block w-full rounded-md shadow-sm p-2 pr-10 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 text-black ${errors.escenario_keywords ? 'border-red-500' : 'border-gray-300'}`} required/>
                         {validFields.escenario_keywords && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <CheckmarkIcon />
                            </div>
                        )}
                    </div>
                    {errors.escenario_keywords && <p className="text-red-500 text-xs mt-1">{errors.escenario_keywords}</p>}
                </fieldset>

                {formType === 'iteration' && (
                    <>
                        <fieldset className="p-4 border border-gray-200 rounded-lg">
                            <legend className="text-lg font-semibold text-gray-800 px-2 flex items-center gap-2">
                                B. Tipo de Feedback (Marque una)
                                {validFields.tipo_feedback && <CheckmarkIcon />}
                            </legend>
                            <div className="mt-2 space-y-2">
                                {[
                                    { id: 'error', value: 'Error o Fallo', label: '1. Reporte de Error o Fallo (Bug)' },
                                    { id: 'mejora', value: 'Sugerencia de Mejora', label: '2. Sugerencia de Mejora' },
                                    { id: 'positivo', value: 'Valoración Positiva / Uso Relevante', label: '3. Valoración Positiva / Uso Relevante' },
                                    { id: 'etica', value: 'Inquietud Ética/Deontológica', label: '4. Inquietud Ética/Deontológica' },
                                ].map(option => (
                                    <div key={option.id} className="flex items-center">
                                        <input type="radio" id={option.id} name="tipo_feedback" value={option.value} checked={formData.tipo_feedback === option.value} onChange={handleChange} onBlur={handleBlur} className="text-blue-600 focus:ring-blue-500" required/>
                                        <label htmlFor={option.id} className="ml-3 text-sm font-medium text-black">{option.label}</label>
                                    </div>
                                ))}
                            </div>
                            {errors.tipo_feedback && <p className="text-red-500 text-xs mt-2">{errors.tipo_feedback}</p>}
                        </fieldset>

                        <fieldset className="p-4 border border-gray-200 rounded-lg">
                            <legend className="text-lg font-semibold text-gray-800 px-2">C. Descripción Detallada</legend>
                            <label htmlFor="descripcion" className="block text-sm font-medium text-black mt-2">Detalle (Error, Sugerencia o Aspecto Útil):</label>
                            <div className="relative">
                                <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} onBlur={handleBlur} rows={4} placeholder="Describa brevemente el problema encontrado o el aspecto relevante." className={`mt-1 block w-full rounded-md shadow-sm p-2 pr-10 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 text-black ${errors.descripcion ? 'border-red-500' : 'border-gray-300'}`} required></textarea>
                                {validFields.descripcion && (
                                    <div className="absolute top-0 right-0 pt-3 pr-3 flex items-center pointer-events-none">
                                        <CheckmarkIcon />
                                    </div>
                                )}
                            </div>
                            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
                            <label htmlFor="respuesta_chatbot" className="block text-sm font-medium text-black mt-4">Copia aquí la respuesta del chatbot (opcional):</label>
                            <textarea id="respuesta_chatbot" name="respuesta_chatbot" value={formData.respuesta_chatbot} onChange={handleChange} onBlur={handleBlur} rows={3} placeholder="Pegue la respuesta de la IA para facilitar la revisión deontológica." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 text-black"></textarea>
                        </fieldset>
                    </>
                )}
                
                {isConversationValuation && (
                    <fieldset className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 transition-all duration-300">
                        <legend className="text-lg font-semibold text-yellow-700 px-2">D. Evaluación Específica</legend>
                        <div className="mt-2">
                             <label className="block text-sm font-medium text-black flex items-center gap-2">
                                1. Claridad de la Respuesta: ¿Fue fácil de entender?
                                {validFields.claridad && <CheckmarkIcon />}
                            </label>
                            <div className="mt-1">
                                <input type="radio" id="clara_si" name="claridad" value="Sí" checked={formData.claridad === 'Sí'} onChange={handleChange} onBlur={handleBlur} required={isConversationValuation}/><label htmlFor="clara_si" className="ml-1 mr-4 text-black">Sí</label>
                                <input type="radio" id="clara_no" name="claridad" value="No" checked={formData.claridad === 'No'} onChange={handleChange} onBlur={handleBlur} required={isConversationValuation}/><label htmlFor="clara_no" className="ml-1 text-black">No</label>
                            </div>
                            {errors.claridad && <p className="text-red-500 text-xs mt-1">{errors.claridad}</p>}
                        </div>

                        <div className="mt-4">
                             <label className="block text-sm font-medium text-black flex items-center gap-2">
                                2. Utilidad para la Práctica: ¿Te ayudaría a resolver el dilema?
                                {validFields.utilidad && <CheckmarkIcon />}
                            </label>
                            <div className="mt-1">
                                <input type="radio" id="util_si" name="utilidad" value="Sí" checked={formData.utilidad === 'Sí'} onChange={handleChange} onBlur={handleBlur} required={isConversationValuation}/><label htmlFor="util_si" className="ml-1 mr-4 text-black">Sí</label>
                                <input type="radio" id="util_no" name="utilidad" value="No" checked={formData.utilidad === 'No'} onChange={handleChange} onBlur={handleBlur} required={isConversationValuation}/><label htmlFor="util_no" className="ml-1 mr-4 text-black">No</label>
                                <input type="radio" id="util_seguro" name="utilidad" value="No Estoy Seguro" checked={formData.utilidad === 'No Estoy Seguro'} onChange={handleChange} onBlur={handleBlur} required={isConversationValuation}/><label htmlFor="util_seguro" className="ml-1 text-black">No estoy seguro</label>
                            </div>
                             {errors.utilidad && <p className="text-red-500 text-xs mt-1">{errors.utilidad}</p>}
                        </div>
                        
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-black">3. Valoración Deontológica (0 a 5 estrellas):</label>
                            <StarRating value={formData.valoracion_deontologica} onChange={(value) => handleRatingChange('valoracion_deontologica', value)} />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-black">4. Pertinencia de las Respuestas (0 a 5 estrellas):</label>
                            <StarRating value={formData.valoracion_pertinencia} onChange={(value) => handleRatingChange('valoracion_pertinencia', value)} />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-black">5. Calidad General de la Interacción (0 a 5 estrellas):</label>
                            <StarRating value={formData.valoracion_calidad_interaccion} onChange={(value) => handleRatingChange('valoracion_calidad_interaccion', value)} />
                        </div>
                    </fieldset>
                )}

                <fieldset className="p-4 border border-gray-200 rounded-lg">
                    <legend className="text-lg font-semibold text-gray-800 px-2">E. Comentarios Finales (Opcional)</legend>
                    <label htmlFor="comentarios_finales" className="block text-sm font-medium text-black mt-2">¿Algún comentario adicional sobre la experiencia general?</label>
                    <textarea id="comentarios_finales" name="comentarios_finales" value={formData.comentarios_finales} onChange={handleChange} onBlur={handleBlur} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"></textarea>
                </fieldset>

                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold text-white py-3 rounded-lg transition duration-150 disabled:bg-blue-400 disabled:cursor-wait">
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Enviando...</span>
                        </>
                    ) : (
                        'Enviar Feedback'
                    )}
                </button>
                <p className="text-xs text-center text-gray-500 mt-4">Los datos se almacenarán para su análisis y la mejora continua del chatbot.</p>
            </form>

            <FeedbackConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSubmit}
                feedbackData={formData}
            />
        </>
    );
};