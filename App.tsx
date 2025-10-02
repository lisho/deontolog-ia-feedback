import React, { useState, useMemo, useCallback } from 'react';
import { FeedbackForm } from './components/FeedbackForm.tsx';
import { FeedbackResults } from './components/FeedbackResults.tsx';
import { FeedbackManagement } from './components/FeedbackManagement.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { useDatabase } from './hooks/useDatabase.ts';
import type { FeedbackData, FilterState } from './types.ts';
import { FilterControls } from './components/FilterControls.tsx';
import { GlobalSearchBar } from './components/GlobalSearchBar.tsx';
import { ToastNotification } from './components/ToastNotification.tsx';

interface ToastState {
    show: boolean;
    message: string;
    type: 'success' | 'error';
}

// Componente para la vista de solo envío de feedback
const SubmitOnlyView = () => {
    const { addFeedback } = useDatabase();

    const handleFormSubmit = async (data: FeedbackData) => {
        await addFeedback(data);
        // La alerta ha sido reemplazada por un mensaje en la interfaz dentro de FeedbackForm.
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <header className="bg-white shadow-md">
                <nav className="container mx-auto px-6 py-3">
                    <h1 className="text-2xl font-bold text-blue-600">Deontolog-IA Formulario de Feedback</h1>
                </nav>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Enviar Feedback</h2>
                    <p className="text-gray-600 mb-6">Utilice este formulario para reportar errores, sugerir mejoras o compartir cualquier inquietud sobre las respuestas del chatbot.</p>
                    <FeedbackForm onSubmit={handleFormSubmit} />
                </div>
            </main>
            <footer className="text-center py-4 text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Colegio Oficial de Trabajo Social de León. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

// Componente para la vista completa con todas las funcionalidades
const FullAppView = () => {
    const { feedbackList, isLoading, addFeedback, updateFeedbackReview, deleteFeedback, bulkUpdateFeedbackStatus, bulkDeleteFeedback } = useDatabase();
    const [view, setView] = useState<'form' | 'results' | 'management' | 'dashboard'>('form');
    const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    }, []);

    // --- Lógica de Filtrado y Búsqueda ---
    const initialFilterState: FilterState = {
        status: '',
        type: '',
        rating: '',
        startDate: '',
        endDate: '',
    };

    const [filters, setFilters] = useState<FilterState>(initialFilterState);
    const [searchTerm, setSearchTerm] = useState('');

    const handleFilterChange = useCallback((name: keyof FilterState, value: string | number) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    const handleResetFilters = useCallback(() => {
        setFilters(initialFilterState);
    }, [initialFilterState]);
    
    const uniqueFeedbackTypes = useMemo(() => {
        const types = new Set(feedbackList.map(item => item.tipo_feedback));
        return Array.from(types).filter(Boolean) as (FeedbackData['tipo_feedback'])[];
    }, [feedbackList]);

    const filteredFeedback = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        return feedbackList.filter(item => {
            // Standard filters
            if (filters.status && item.review_status !== filters.status) return false;
            if (filters.type && item.tipo_feedback !== filters.type) return false;
            if (filters.rating && (item.valoracion_deontologica || 0) < Number(filters.rating)) return false;
            
            const itemDate = item.timestamp ? new Date(item.timestamp) : null;
            if (itemDate) {
                if (filters.startDate) {
                    const startDate = new Date(filters.startDate);
                    startDate.setUTCHours(0, 0, 0, 0);
                    if (itemDate < startDate) return false;
                }
                if (filters.endDate) {
                    const endDate = new Date(filters.endDate);
                    endDate.setUTCHours(23, 59, 59, 999);
                    if (itemDate > endDate) return false;
                }
            }

            // Global search filter
            if (lowercasedSearchTerm) {
                const inScenario = (item.escenario_keywords || '').toLowerCase().includes(lowercasedSearchTerm);
                const inDescription = (item.descripcion || '').toLowerCase().includes(lowercasedSearchTerm);
                const inResult = (item.review_result || '').toLowerCase().includes(lowercasedSearchTerm);
                if (!inScenario && !inDescription && !inResult) {
                    return false;
                }
            }
            
            return true;
        });
    }, [feedbackList, filters, searchTerm]);
    // --- Fin Lógica de Filtrado y Búsqueda ---

    const handleFormSubmit = async (data: FeedbackData) => {
        await addFeedback(data);
        setView('results');
    };
    
    const renderView = () => {
        switch (view) {
            case 'form':
                return <FeedbackForm onSubmit={handleFormSubmit} />;
            case 'results':
                return <FeedbackResults feedbackList={filteredFeedback} isLoading={isLoading} onUpdateReview={updateFeedbackReview} onDelete={deleteFeedback} showToast={showToast} />;
            case 'management':
                 return <FeedbackManagement 
                    feedbackList={filteredFeedback} 
                    isLoading={isLoading} 
                    onUpdateReview={updateFeedbackReview} 
                    onDelete={deleteFeedback} 
                    onBulkUpdateStatus={bulkUpdateFeedbackStatus}
                    onBulkDelete={bulkDeleteFeedback}
                    showToast={showToast} 
                />;
            case 'dashboard':
                return <DashboardView feedbackList={filteredFeedback} />;
            default:
                return <FeedbackForm onSubmit={handleFormSubmit} />;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <header className="bg-white shadow-md">
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600"> Deontolog-IA - Plataforma de Feedback</h1>
                    <div>
                        <button onClick={() => setView('form')} className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'form' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                            Enviar Feedback
                        </button>
                        <button onClick={() => setView('results')} className={`ml-4 px-4 py-2 rounded-md text-sm font-medium ${view === 'results' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                            Ver Resultados
                        </button>
                        <button onClick={() => setView('management')} className={`ml-4 px-4 py-2 rounded-md text-sm font-medium ${view === 'management' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                            Gestionar
                        </button>
                        <button onClick={() => setView('dashboard')} className={`ml-4 px-4 py-2 rounded-md text-sm font-medium ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                            Estadísticas
                        </button>
                    </div>
                </nav>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <div className={`mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg transition-all duration-300 ${view !== 'form' ? 'max-w-7xl' : 'max-w-4xl'}`}>
                    {(view === 'results' || view === 'management') && (
                        <GlobalSearchBar 
                            searchTerm={searchTerm} 
                            onSearchChange={handleSearchChange} 
                        />
                    )}
                    {(view === 'results' || view === 'management' || view === 'dashboard') && (
                        <FilterControls
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onResetFilters={handleResetFilters}
                            feedbackTypes={uniqueFeedbackTypes}
                        />
                    )}
                    {renderView()}
                </div>
            </main>
            <footer className="text-center py-4 text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Colegio Oficial de Trabajo Social de León. Todos los derechos reservados.</p>
            </footer>
            {toast.show && (
                <ToastNotification
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

function App() {
    const [isSubmitOnly] = useState(() => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('mode') === 'submit';
        } catch (e) {
            return false;
        }
    });

    if (isSubmitOnly) {
        return <SubmitOnlyView />;
    }

    return <FullAppView />;
}

export default App;