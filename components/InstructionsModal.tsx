import React from 'react';

type InstructionsType = 'iteration' | 'conversation' | 'corpus_validation' | 'all' | null;

interface InstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    instructionsFor: InstructionsType;
}

const IterationInstructions = () => (
    <div>
        <h3 className="font-bold text-blue-700">Feedback de Iteración Concreta</h3>
        <p>
            Utilice esta opción cuando quiera informar sobre un aspecto específico de una única respuesta del chatbot. Es ideal para:
        </p>
        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Reportar un <strong>error factual o técnico</strong> (un "bug").</li>
            <li>Sugerir una <strong>mejora en la redacción</strong> o el enfoque de una respuesta.</li>
            <li>Destacar una <strong>respuesta particularmente buena</strong> y útil.</li>
            <li>Plantear una <strong>inquietud ética o deontológica</strong> sobre una afirmación concreta.</li>
        </ul>
   </div>
);

const ConversationInstructions = () => (
    <div>
        <h3 className="font-bold text-green-700">Feedback de Conversación Completa</h3>
        <p>
            Seleccione esta opción después de haber mantenido una conversación más extensa con el chatbot para evaluar la interacción en su conjunto. Esta opción le permitirá valorar:
        </p>
         <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li><strong>Calidad de la Respuesta:</strong> Evalúe la claridad, utilidad práctica y alineación con el código deontológico.</li>
            <li><strong>Fluidez de la Conversación:</strong> Valore la coherencia de las interacciones, la facilidad para guiar al bot y el número de mensajes necesarios para resolver la consulta.</li>
            <li><strong>Visión Experta:</strong> Aporte su visión sobre la aplicabilidad real de las respuestas y su impacto potencial en la toma de decisiones profesionales.</li>
            <li><strong>Calidad General:</strong> Una valoración global sobre la experiencia, pertinencia y calidad de la interacción.</li>
        </ul>
   </div>
);

const CorpusValidationInstructions = () => (
    <div>
        <h3 className="font-bold text-purple-700">Cuestionario de Validación del Corpus Ético</h3>
        <p>
            Este cuestionario está diseñado para que expertos evalúen la calidad y adecuación de la base de conocimiento fundamental del chatbot. Se enfoca en:
        </p>
         <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li><strong>Fuentes y Trazabilidad:</strong> La pertinencia de las fuentes y si están bien referenciadas para su verificación.</li>
            <li><strong>Contenido y Precisión:</strong> Si la información es fiable, actual, precisa y libre de errores conceptuales.</li>
            <li><strong>Estructura y Cobertura:</strong> Si se cubren todos los temas relevantes con suficiente detalle y una estructura exhaustiva.</li>
            <li><strong>Diversidad y Representatividad:</strong> Si el corpus incluye diferentes perspectivas y estilos relevantes.</li>
            <li><strong>Claridad y Preparación para IA:</strong> Si los textos son comprensibles y están bien preparados para ser usados por la IA.</li>
            <li><strong>Fiabilidad General:</strong> Su confianza en el "core ético" como pilar para el comportamiento de la IA.</li>
        </ul>
   </div>
);


export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose, instructionsFor }) => {
    if (!isOpen) return null;

    const titleMap: Record<string, string> = {
        iteration: 'Feedback de Iteración Concreta',
        conversation: 'Feedback de Conversación Completa',
        corpus_validation: 'Validación del Corpus Ético',
        all: 'Instrucciones para el Feedback'
    };
    
    const renderContent = () => {
        switch (instructionsFor) {
            case 'iteration':
                return <IterationInstructions />;
            case 'conversation':
                return <ConversationInstructions />;
            case 'corpus_validation':
                return <CorpusValidationInstructions />;
            case 'all':
            default:
                return (
                    <div className="space-y-6">
                        <IterationInstructions />
                        <ConversationInstructions />
                        <CorpusValidationInstructions />
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="instructions-modal-title" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h2 id="instructions-modal-title" className="text-xl font-bold text-gray-900">{titleMap[instructionsFor || 'all']}</h2>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4 text-gray-700">
                   {renderContent()}
                </div>

                <div className="mt-auto p-6 bg-gray-50 border-t rounded-b-lg flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};