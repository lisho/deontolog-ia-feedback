import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
    currentApiKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        if (isOpen) {
            setApiKey(currentApiKey);
        }
    }, [isOpen, currentApiKey]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(apiKey);
    };

    const getMaskedKey = (key: string) => {
        if (!key) return 'No configurada';
        if (key.length <= 8) return '****';
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="api-key-modal-title" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <h2 id="api-key-modal-title" className="text-lg font-bold text-gray-900 mb-2">Configurar API Key de Gemini</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Tu API Key se guardará en el almacenamiento local de tu navegador.
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                        <strong>Clave Actual:</strong> <span className="font-mono bg-gray-100 p-1 rounded">{getMaskedKey(currentApiKey)}</span>
                    </p>
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">Nueva API Key:</label>
                        <input
                            type="password"
                            id="apiKey"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Introduce tu API Key aquí"
                            required
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                            Guardar Clave
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
