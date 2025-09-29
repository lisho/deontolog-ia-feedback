import React from 'react';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange }) => {
    const handlePrevious = () => {
        onPageChange(Math.max(1, currentPage - 1));
    };

    const handleNext = () => {
        onPageChange(Math.min(totalPages, currentPage + 1));
    };

    return (
        <div className="flex justify-between items-center mt-6" aria-label="Paginación">
            <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Ir a la página anterior"
            >
                Anterior
            </button>
            <span className="text-sm text-gray-600" aria-live="polite">
                Página {currentPage} de {totalPages}
            </span>
            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Ir a la página siguiente"
            >
                Siguiente
            </button>
        </div>
    );
};