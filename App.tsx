import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { CorpusValidationForm } from './components/CorpusValidationForm.tsx';
import { ApiKeyModal } from './components/ApiKeyModal.tsx';


interface ToastState {
    show: boolean;
    message: string;
    type: 'success' | 'error';
}

type InstructionsType = 'iteration' | 'conversation' | 'corpus_validation' | 'all';

// Component for the full administrative view
const FullAppView = ({ onLogout }: { onLogout: () => void }) => {
    const { feedbackList, isLoading, addFeedback, updateFeedbackReview, deleteFeedback, bulkUpdateFeedbackStatus, bulkDeleteFeedback } = useDatabase();
    const [view, setView] = useState<'results' | 'management' | 'dashboard'>('results');
    const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);
    const [apiKey, setApiKey] = useState<string>('');
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    const handleSaveApiKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem('gemini_api_key', key);
        showToast('API Key guardada correctamente.');
        setIsApiKeyModalOpen(false);
    };

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
                    apiKey={apiKey}
                />;
            case 'dashboard':
                return <DashboardView feedbackList={filteredFeedback} apiKey={apiKey} />;
            default:
                return <FeedbackResults feedbackList={filteredFeedback} isLoading={isLoading} onUpdateReview={updateFeedbackReview} onDelete={deleteFeedback} showToast={showToast} />;
        }
    };

    return (
        <>
            <header className="bg-white shadow-md">
                <nav className="container mx-auto px-6 py-3 flex justify-between items-center relative">
                    <h1 className="text-xl md:text-2xl font-bold text-blue-600"> Deontolog-IA - Administración</h1>
                     <div className="md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-600 hover:bg-gray-200" aria-label="Abrir menú">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>
                    </div>
                    <div className={`
                        absolute md:static top-full left-0 right-0 z-20
                        bg-white md:bg-transparent shadow-md md:shadow-none
                        ${isMenuOpen ? 'block' : 'hidden'} md:flex 
                    `}>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 p-4 md:p-0">
                            <button onClick={() => { setView('results'); setIsMenuOpen(false); }} className={`px-4 py-2 rounded-md text-sm font-medium w-full text-left md:text-center ${view === 'results' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                                Ver Resultados
                            </button>
                            <button onClick={() => { setView('management'); setIsMenuOpen(false); }} className={`px-4 py-2 rounded-md text-sm font-medium w-full text-left md:text-center ${view === 'management' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                                Gestionar
                            </button>
                            <button onClick={() => { setView('dashboard'); setIsMenuOpen(false); }} className={`px-4 py-2 rounded-md text-sm font-medium w-full text-left md:text-center ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                                Estadísticas
                            </button>
                             <button onClick={() => setIsApiKeyModalOpen(true)} className="p-2 rounded-full text-gray-600 hover:bg-gray-200" aria-label="Configurar API Key">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                </svg>
                            </button>
                             <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-100 border border-red-200 w-full text-left md:text-center">
                                Salir
                            </button>
                        </div>
                    </div>
                </nav>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <div className="mx-auto bg-white p-4 md:p-8 rounded-xl shadow-lg transition-all duration-300 max-w-7xl">
                    {(view === 'results' || view === 'management' || view === 'dashboard') && (
                        <div className="border-b border-gray-200">
                            <button
                                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                                className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-700 hover:text-blue-600 focus:outline-none py-4"
                                aria-expanded={isFiltersVisible}
                                aria-controls="filter-section"
                            >
                                <span>Filtros y Búsqueda</span>
                                <svg
                                    className={`h-5 w-5 transform transition-transform duration-200 ${isFiltersVisible ? 'rotate-180' : ''}`}
                                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div id="filter-section" className={`transition-all duration-500 ease-in-out overflow-hidden ${isFiltersVisible ? 'max-h-[500px] pt-4 pb-6' : 'max-h-0'}`}>
                                {(view === 'results' || view === 'management') && (
                                    <GlobalSearchBar 
                                        searchTerm={searchTerm} 
                                        onSearchChange={handleSearchChange} 
                                    />
                                )}
                                <FilterControls
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    onResetFilters={handleResetFilters}
                                    feedbackTypes={uniqueFeedbackTypes}
                                />
                            </div>
                        </div>
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
             <ApiKeyModal
                isOpen={isApiKeyModalOpen}
                onClose={() => setIsApiKeyModalOpen(false)}
                onSave={handleSaveApiKey}
                currentApiKey={apiKey}
            />
        </>
    );
};

const ADMIN_SESSION_KEY = 'adminSession';
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

function App() {
    const [appState, setAppState] = useState<'welcome' | 'iteration_form' | 'conversation_form' | 'corpus_validation_form' | 'admin'>('welcome');
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [instructionsFor, setInstructionsFor] = useState<InstructionsType | null>(null);
    const { addFeedback } = useDatabase();

    // Check for an active session on initial load
    useEffect(() => {
        const sessionData = localStorage.getItem(ADMIN_SESSION_KEY);
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                if (session.expiresAt && new Date().getTime() < session.expiresAt) {
                    setAppState('admin'); // Restore session
                } else {
                    localStorage.removeItem(ADMIN_SESSION_KEY); // Clean up expired session
                }
            } catch (error) {
                console.error("Failed to parse session data:", error);
                localStorage.removeItem(ADMIN_SESSION_KEY);
            }
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    const handleLogin = (user: string, pass: string): boolean => {
        if (user === 'admin' && pass === 'admin') {
            const expirationTime = new Date().getTime() + SESSION_DURATION_MS;
            const session = { expiresAt: expirationTime };
            localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
            
            setIsLoginOpen(false);
            setAppState('admin');
            return true;
        }
        return false;
    };
    
    const handleLogout = () => {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        setAppState('welcome');
    };

    const handleFormSubmit = async (data: FeedbackData) => {
        await addFeedback(data);
    };

    const handleGoToWelcome = () => {
        setAppState('welcome');
    };

    const handleOpenInstructions = (type: InstructionsType) => {
        setInstructionsFor(type);
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
                                onOpenInstructions={handleOpenInstructions}
                            />
                        </div>
                    </main>
                );
            
            case 'corpus_validation_form':
                return (
                    <main className="container mx-auto p-4 md:p-8">
                        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg">
                            <CorpusValidationForm
                                onSubmit={handleFormSubmit}
                                onBack={handleGoToWelcome}
                                onOpenInstructions={() => handleOpenInstructions('corpus_validation')}
                            />
                        </div>
                    </main>
                );

            case 'welcome':
            default:
                 return (
                     <main className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-100px)]">
                        <WelcomeView 
                            onNavigate={(formType) => {
                                if (formType === 'iteration') setAppState('iteration_form');
                                else if (formType === 'conversation') setAppState('conversation_form');
                                else setAppState('corpus_validation_form');
                            }}
                            onOpenLogin={() => setIsLoginOpen(true)}
                            onOpenInstructions={() => handleOpenInstructions('all')}
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
                isOpen={instructionsFor !== null}
                instructionsFor={instructionsFor}
                onClose={() => setInstructionsFor(null)}
            />
        </div>
    );
}


export default App;