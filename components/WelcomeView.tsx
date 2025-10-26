import React from 'react';

interface WelcomeViewProps {
    onNavigate: (view: 'iteration' | 'conversation' | 'corpus_validation') => void;
    onOpenLogin: () => void;
    onOpenInstructions: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onNavigate, onOpenLogin, onOpenInstructions }) => {
    return (
        <div className="text-center bg-white p-8 md:p-12 rounded-xl shadow-lg w-full max-w-3xl">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Plataforma de Feedback Deontolog-IA</h1>
            <p className="text-gray-600 mb-8">Su opinión es clave para construir una IA más ética y eficaz.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={() => onNavigate('iteration')}
                    className="p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg text-left transition-all duration-300 transform hover:scale-105"
                    aria-label="Proporcionar feedback sobre una incidencia"
                >
                    <h2 className="text-xl font-bold text-blue-800">Feedback de Incidencias</h2>
                    <p className="mt-2 text-gray-700">Reporte un error, sugiera una mejora o valore un aspecto específico de una respuesta del chatbot.</p>
                </button>
                <button
                    onClick={() => onNavigate('conversation')}
                    className="p-6 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg text-left transition-all duration-300 transform hover:scale-105"
                    aria-label="Proporcionar feedback sobre una conversación completa"
                >
                    <h2 className="text-xl font-bold text-green-800">Feedback de Conversación Completa</h2>
                    <p className="mt-2 text-gray-700">Evalúe la calidad general de una interacción completa, incluyendo claridad, utilidad y aspectos deontológicos.</p>
                </button>
            </div>
            
            <div className="mt-6">
                 <button
                    onClick={() => onNavigate('corpus_validation')}
                    className="p-6 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-lg text-left transition-all duration-300 transform hover:scale-105 w-full"
                    aria-label="Proporcionar feedback sobre el corpus de conocimiento"
                >
                    <h2 className="text-xl font-bold text-purple-800">Cuestionario de Validación del Corpus Ético</h2>
                    <p className="mt-2 text-gray-700">Evalúe la base de conocimiento con la que la IA ha sido entrenada (curación, estructuración y optimización).</p>
                </button>
            </div>

            <div className="mt-10 flex justify-center items-center gap-6 text-sm">
                <button onClick={onOpenInstructions} className="text-blue-600 hover:underline font-medium">
                    Ver Instrucciones
                </button>
                <span className="text-gray-300">|</span>
                <button onClick={onOpenLogin} className="text-gray-600 hover:underline font-medium">
                    Acceso Admin
                </button>
            </div>
        </div>
    );
};