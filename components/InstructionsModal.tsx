import React from 'react';

interface InstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="instructions-modal-title" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h2 id="instructions-modal-title" className="text-xl font-bold text-gray-900">Instrucciones para el Feedback</h2>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4 text-gray-700">
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
                   <div>
                        <h3 className="font-bold text-green-700">Feedback de Conversación Completa</h3>
                        <p>
                            Seleccione esta opción después de haber mantenido una conversación más extensa con el chatbot para evaluar la interacción en su conjunto. Esta opción le permitirá valorar:
                        </p>
                         <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>La <strong>claridad general</strong> y la facilidad para entender las respuestas.</li>
                            <li>La <strong>utilidad práctica</strong> de la conversación para resolver su dilema.</li>
                            <li>Una <strong>valoración global</strong> (de 1 a 5 estrellas) de la calidad deontológica, la pertinencia y la interacción general.</li>
                        </ul>
                   </div>
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
