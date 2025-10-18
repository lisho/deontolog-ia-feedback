import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { FeedbackData } from '../types.ts';
import { StarRating } from './StarRating.tsx';
import { FeedbackConfirmationModal } from './FeedbackConfirmationModal.tsx';

interface CorpusValidationFormProps {
    onSubmit: (data: FeedbackData) => Promise<void>;
    onBack: () => void;
    onOpenInstructions: () => void;
}

const getInitialState = (): FeedbackData => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);

    return {
        nombre_evaluador: '',
        fecha_hora: localISOTime,
        dispositivo: '',
        tipo_feedback: 'Validación de Corpus',
        corpus_c1_fuentes_pertinentes: 0,
        corpus_c2_estructura_exhaustiva: 0,
        corpus_c3_libre_info_no_autorizada: 0,
        corpus_c4_detalle_suficiente: 0,
        corpus_c5_core_fiable_legitimo: 0,
        corpus_comentarios: '',
        corpus_propuestas: '',
        review_status: 'Pendiente',
        review_result: '',
    };
};

const runValidation = (data: FeedbackData): Partial<Record<keyof FeedbackData, string>> => {
    const newErrors: Partial<Record<keyof FeedbackData, string>> = {};
    if (!data.dispositivo) newErrors.dispositivo = 'Debe seleccionar un dispositivo.';
    if (!data.corpus_c1_fuentes_pertinentes) newErrors.corpus_c1_fuentes_pertinentes = 'La valoración es requerida.';
    if (!data.corpus_c2_estructura_exhaustiva) newErrors.corpus_c2_estructura_exhaustiva = 'La valoración es requerida.';
    if (!data.corpus_c3_libre_info_no_autorizada) newErrors.corpus_c3_libre_info_no_autorizada = 'La valoración es requerida.';
    if (!data.corpus_c4_detalle_suficiente) newErrors.corpus_c4_detalle_suficiente = 'La valoración es requerida.';
    if (!data.corpus_c5_core_fiable_legitimo) newErrors.corpus_c5_core_fiable_legitimo = 'La valoración es requerida.';
    return newErrors;
};


const questions: { key: keyof FeedbackData, text: string, description: string }[] = [
    { key: 'corpus_c1_fuentes_pertinentes', text: 'C1. La selección de fuentes éticas complementarias (además del Código Deontológico) es pertinente y refuerza la autoridad del conocimiento de la IA.', description: 'Evalúe si las fuentes adicionales (guías, informes, etc.) son relevantes y de alta calidad para complementar el código principal.' },
    { key: 'corpus_c2_estructura_exhaustiva', text: 'C2. La estructuración y optimización de la base de conocimiento ética es exhaustiva y abarca todos los principios deontológicos relevantes.', description: 'Considere si la organización del contenido cubre adecuadamente todos los artículos y aspectos del código deontológico.' },
    { key: 'corpus_c3_libre_info_no_autorizada', text: 'C3. La base de conocimiento está libre de información no autorizada o no validada por expertos del sector.', description: 'Verifique que el corpus se basa exclusivamente en la documentación aprobada, sin incluir opiniones o fuentes externas no validadas.' },
    { key: 'corpus_c4_detalle_suficiente', text: 'C4. El corpus ético es suficientemente detallado para facilitar la resolución de dilemas éticos complejos.', description: 'Juzgue si la profundidad del contenido es adecuada para que la IA pueda ofrecer respuestas matizadas y bien fundamentadas.' },
    { key: 'corpus_c5_core_fiable_legitimo', text: 'C5. Considero que el "core ético validado" sobre el que se alimenta la IA es formalmente fiable y legítimo.', description: 'Valore su confianza general en la base documental como pilar para el comportamiento ético de la IA.' },
];

export const CorpusValidationForm: React.FC<CorpusValidationFormProps> = ({ onSubmit, onBack, onOpenInstructions }) => {
    const [formData, setFormData] = useState<FeedbackData>(getInitialState());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof FeedbackData, string>>>({});
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        nameInputRef.current?.focus();
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FeedbackData]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof FeedbackData];
                return newErrors;
            });
        }
    }, [errors]);

    const handleRatingChange = useCallback((name: keyof FeedbackData, value: number) => {
        setFormData(prev => ({ ...prev, [name]: value }));
         if (errors[name as keyof FeedbackData]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof FeedbackData];
                return newErrors;
            });
        }
    }, [errors]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newErrors = runValidation(formData);
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setIsConfirmModalOpen(true);
        } else {
            const firstErrorField = Object.keys(newErrors)[0];
            if (firstErrorField) {
                const elementToFocus = e.currentTarget.querySelector<HTMLElement>(`[name="${firstErrorField}"]`);
                if (elementToFocus) {
                    elementToFocus.focus();
                    elementToFocus.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
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

    if (showSuccessMessage) {
        return (
            <div className="text-center p-8">
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-6 rounded-md shadow-sm mb-8" role="alert">
                    <p className="font-bold text-lg">¡Cuestionario Enviado!</p>
                    <p>Gracias por su valiosa contribución a la validación del corpus ético.</p>
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
                        <h2 className="text-xl font-bold text-gray-800">Cuestionario de Validación del Corpus Ético</h2>
                        <p className="text-sm text-gray-500 mt-1">Evalúe el contenido de la base de conocimiento del chatbot.</p>
                    </div>
                     <div className="flex flex-col items-end gap-2 flex-shrink-0 mt-1">
                        <button type="button" onClick={onBack} className="text-sm text-blue-600 hover:underline font-medium">
                            &larr; Volver al inicio
                        </button>
                        <button type="button" onClick={onOpenInstructions} className="text-sm text-gray-500 hover:underline font-medium flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Ver Instrucciones
                        </button>
                    </div>
                </div>
                
                 <fieldset className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <legend className="text-lg font-semibold text-blue-700 px-2">A. Identificación del Evaluador</legend>
                    <p className="text-sm text-gray-600 mt-2 px-2 mb-4">Información básica para contextualizar su evaluación profesional.</p>
                    <label htmlFor="nombre_evaluador" className="block text-sm font-medium text-black mt-2">Nombre o Contacto (Opcional):</label>
                    <input ref={nameInputRef} type="text" id="nombre_evaluador" name="nombre_evaluador" value={formData.nombre_evaluador} onChange={handleChange} placeholder="Nombre, email o alias" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 text-black"/>
                    <p className="text-xs text-gray-500 mb-4">Solo se usará si se requiere contactarle para ampliar la información.</p>

                    <label htmlFor="fecha_hora" className="block text-sm font-medium text-black mt-2">Fecha y Hora:</label>
                    <input type="datetime-local" id="fecha_hora" name="fecha_hora" value={formData.fecha_hora} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black" required/>

                    <label htmlFor="dispositivo" className="block text-sm font-medium text-black mt-4">Tipo de Dispositivo Utilizado:</label>
                    <select id="dispositivo" name="dispositivo" value={formData.dispositivo} onChange={handleChange} className={`mt-1 block w-full rounded-md shadow-sm p-2 pr-10 focus:ring-blue-500 focus:border-blue-500 bg-white text-black ${errors.dispositivo ? 'border-red-500' : 'border-gray-300'}`} required>
                        <option value="" disabled>Seleccione...</option>
                        <option value="Movil">Móvil</option>
                        <option value="Tableta">Tableta</option>
                        <option value="Ordenador">Ordenador</option>
                    </select>
                    {errors.dispositivo && <p className="text-red-500 text-xs mt-1">{errors.dispositivo}</p>}
                </fieldset>

                <fieldset className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                     <legend className="text-lg font-semibold text-purple-700 px-2">B. Cuestionario de Validación</legend>
                     <p className="text-sm text-gray-600 mt-2 px-2 mb-3">Valore de 0 a 5 estrellas cada uno de los siguientes criterios sobre la base de conocimiento de la IA.</p>
                     <div className="space-y-6 mt-4">
                        {questions.map(({ key, text, description }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-black">{text}</label>
                                <p className="text-xs text-gray-500 mt-1">{description}</p>
                                <div className="mt-2">
                                    <StarRating
                                        name={key as string}
                                        value={formData[key] as number}
                                        onChange={(value) => handleRatingChange(key, value)}
                                    />
                                </div>
                                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
                            </div>
                        ))}
                     </div>
                </fieldset>

                 <fieldset className="p-4 border border-gray-200 rounded-lg">
                    <legend className="text-lg font-semibold text-gray-800 px-2">C. Comentarios y Propuestas</legend>
                    <p className="text-sm text-gray-600 mt-2 px-2 mb-3">Aporte su visión experta para enriquecer o corregir el corpus documental.</p>
                    <label htmlFor="corpus_comentarios" className="block text-sm font-medium text-black mt-2">Comentarios sobre el Corpus Ético (Opcional):</label>
                    <p className="text-xs text-gray-500 mb-1">Señale posibles carencias o áreas que necesitan mayor profundidad.</p>
                    <textarea id="corpus_comentarios" name="corpus_comentarios" value={formData.corpus_comentarios} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"></textarea>
                    
                    <label htmlFor="corpus_propuestas" className="block text-sm font-medium text-black mt-4">Otra documentación propuesta (Opcional):</label>
                    <p className="text-xs text-gray-500 mb-1">Indique Título y autor de otra documentación que considere relevante.</p>
                    <textarea id="corpus_propuestas" name="corpus_propuestas" value={formData.corpus_propuestas} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-black"></textarea>
                </fieldset>


                <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold text-white py-3 rounded-lg transition duration-150 disabled:bg-blue-400 disabled:cursor-wait">
                    {isSubmitting ? 'Enviando...' : 'Enviar Cuestionario'}
                </button>
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