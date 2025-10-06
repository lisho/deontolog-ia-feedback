import React, { useState, useMemo, useCallback } from 'react';
import { FeedbackForm } from './components/FeedbackForm.tsx';
import { FeedbackResults } from './components/FeedbackResults.tsx';
import { FeedbackManagement } from './components/FeedbackManagement.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { useDatabase } from './hooks/useDatabase.ts';
import type { FeedbackData, FilterState, ReviewStatus } from './types.ts';
import { FilterControls } from './components/FilterControls.tsx';
import { GlobalSearchBar } from './components/GlobalSearchBar.tsx';
import { ToastNotification } from './components/ToastNotification.tsx';
import { WelcomeView } from './components/WelcomeView.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { InstructionsModal } from './components/InstructionsModal.tsx';


interface ToastState {
    show: boolean;
    message: string;
    type: 'success' | 'error';
}

// Component for the full administrative view
const FullAppView = ({ onLogout }: { onLogout: () => void }) => {
    const { feedbackList, isLoading, addFeedback, updateFeedbackReview, deleteFeedback, bulkUpdateFeedbackStatus, bulkDeleteFeedback } = useDatabase();
    const [view, setView] = useState<'results' | 'management' | 'dashboard'>('results');
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
    
    const renderView = () => {
        switch (view) {
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
                return <FeedbackResults feedbackList={filteredFeedback} isLoading={isLoading} onUpdateReview={updateFeedbackReview} onDelete={deleteFeedback} showToast={showToast} />;
        }
    };

    return (
        <>
            <header className="bg-white shadow-md">
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600"> Deontolog-IA - Panel de Administración</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setView('results')} className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'results' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                            Ver Resultados
                        </button>
                        <button onClick={() => setView('management')} className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'management' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                            Gestionar
                        </button>
                        <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                            Estadísticas
                        </button>
                         <button onClick={onLogout} className="px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-100 border border-red-200">
                            Salir
                        </button>
                    </div>
                </nav>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <div className="mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg transition-all duration-300 max-w-7xl">
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
            {toast.show && (
                <ToastNotification
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </>
    );
};

function App() {
    const [appState, setAppState] = useState<'welcome' | 'iteration_form' | 'conversation_form' | 'admin'>('welcome');
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
    const { addFeedback } = useDatabase();

    const handleLogin = (user: string, pass: string): boolean => {
        if (user === 'admin' && pass === 'admin') {
            setIsLoginOpen(false);
            setAppState('admin');
            return true;
        }
        return false;
    };
    
    const handleLogout = () => {
        setAppState('welcome');
    };

    const handleFormSubmit = async (data: FeedbackData) => {
        await addFeedback(data);
    };

    const handleGoToWelcome = () => {
        setAppState('welcome');
    };

    const renderMainContent = () => {
        switch(appState) {
            case 'admin':
                return <FullAppView onLogout={handleLogout} />;
            
            case 'iteration_form':
            case 'conversation_form':
                return (
                     <main className="container mx-auto p-4 md:p-8">
                        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg">
                            <FeedbackForm 
                                onSubmit={handleFormSubmit} 
                                formType={appState === 'iteration_form' ? 'iteration' : 'conversation'}
                                onBack={handleGoToWelcome} 
                            />
                        </div>
                    </main>
                );

            case 'welcome':
            default:
                 return (
                     <main className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-100px)]">
                        <WelcomeView 
                            onNavigate={(formType) => setAppState(formType === 'iteration' ? 'iteration_form' : 'conversation_form')}
                            onOpenLogin={() => setIsLoginOpen(true)}
                            onOpenInstructions={() => setIsInstructionsOpen(true)}
                        />
                    </main>
                );
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            {renderMainContent()}
            <footer className="text-center py-4 text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Colegio Oficial de Trabajo Social de León. Todos los derechos reservados.</p>
            </footer>
            <LoginModal 
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onLogin={handleLogin}
            />
            <InstructionsModal
                isOpen={isInstructionsOpen}
                onClose={() => setIsInstructionsOpen(false)}
            />
        </div>
    );
}


export default App;