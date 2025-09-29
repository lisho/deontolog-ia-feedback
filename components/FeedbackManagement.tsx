import React, { useState, useEffect } from 'react';
import type { FeedbackData, ReviewStatus } from '../types.ts';
import { FeedbackManagementRow } from './FeedbackManagementRow.tsx';
import { PaginationControls } from './PaginationControls.tsx';

interface FeedbackManagementProps {
    feedbackList: FeedbackData[];
    isLoading: boolean;
    onUpdateReview: (id: string, status: ReviewStatus, result: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 10;

export const FeedbackManagement: React.FC<FeedbackManagementProps> = ({ feedbackList, isLoading, onUpdateReview }) => {
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [feedbackList]);
    
    const totalPages = Math.ceil(feedbackList.length / ITEMS_PER_PAGE);
    const paginatedFeedback = feedbackList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="mt-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Gestión de Feedback</h3>
            {isLoading ? (
                <div className="text-center text-gray-500 p-4">Cargando datos...</div>
            ) : feedbackList.length === 0 ? (
                <div className="text-center text-gray-500 p-4">Aún no hay feedback registrado.</div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Escenario</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                                    <th className="py-2 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Valoración</th>
                                    <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {paginatedFeedback.map((feedback) => (
                                    <FeedbackManagementRow key={feedback.id} feedback={feedback} onUpdateReview={onUpdateReview} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </>
            )}
        </div>
    );
};