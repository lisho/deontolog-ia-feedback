import React, { useState } from 'react';
import type { ReportData } from '../types.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';

interface ReportHistoryViewProps {
    reports: ReportData[];
    isLoading: boolean;
    onDeleteReport: (id: string) => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const createReportHtml = (report: ReportData): string => {
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${report.title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; background-color: #f9fafb; color: #1f2937; }
                .container { max-width: 1024px; margin: auto; padding: 2rem; }
                .card { background-color: white; border-radius: 0.75rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); padding: 1.5rem; border: 1px solid #e5e7eb; }
                h1 { font-size: 2.25rem; font-weight: bold; color: #1d4ed8; letter-spacing: -0.025em; }
                h2 { font-size: 1.5rem; font-weight: bold; color: #111827; border-bottom: 2px solid #93c5fd; padding-bottom: 0.5rem; margin-top: 2.5rem; margin-bottom: 1.5rem; }
                .prose { max-width: none; } .prose strong { color: #111827; } .prose p { margin-top: 0; margin-bottom: 1em; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; }
                th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
                th { background-color: #f3f4f6; font-weight: 600; color: #4b5563; }
                tbody tr:nth-child(even) { background-color: #f9fafb; }
            </style>
        </head>
        <body>
            <div class="container">
                <header class="text-center mb-10">
                    <h1>${report.title}</h1>
                    <p class="text-gray-500 mt-2">Generado el ${new Date(report.createdAt || 0).toLocaleString('es-ES')}</p>
                </header>
                <main>
                    <section class="mb-8">
                        <h2>Resumen Ejecutivo (IA)</h2>
                        <div class="card prose">${report.aiSummary}</div>
                    </section>
                    <section class="mb-8">
                        <h2>Infografía de Datos Clave</h2>
                        ${report.infographicHtml}
                    </section>
                    <section>
                        <h2>Datos Detallados</h2>
                        <div class="card overflow-x-auto"><table>${report.tableHtml}</table></div>
                    </section>
                </main>
                <footer class="text-center mt-10 text-sm text-gray-500"><p>&copy; ${new Date().getFullYear()} Colegio Oficial de Trabajo Social de León.</p></footer>
            </div>
        </body>
        </html>
    `;
};

const TAB_LABELS: Record<ReportData['tab'], string> = {
    general: 'Visión General',
    iteration: 'Incidencias',
    conversation: 'Conversación',
    corpus: 'Validación Corpus',
};

export const ReportHistoryView: React.FC<ReportHistoryViewProps> = ({ reports, isLoading, onDeleteReport, showToast }) => {
    const [reportToDelete, setReportToDelete] = useState<ReportData | null>(null);

    const handleViewReport = (report: ReportData) => {
        const html = createReportHtml(report);
        const newWindow = window.open();
        newWindow?.document.write(html);
        newWindow?.document.close();
    };

    const handleDeleteClick = (report: ReportData) => {
        setReportToDelete(report);
    };

    const confirmDelete = async () => {
        if (reportToDelete && reportToDelete.id) {
            try {
                await onDeleteReport(reportToDelete.id);
                showToast('Informe eliminado correctamente.');
            } catch (error) {
                showToast('Error al eliminar el informe.', 'error');
                console.error(error);
            } finally {
                setReportToDelete(null);
            }
        }
    };

    return (
        <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Historial de Informes Generados</h3>

            {isLoading ? (
                <div className="text-center text-gray-500 p-4">Cargando historial de informes...</div>
            ) : reports.length === 0 ? (
                <div className="text-center text-gray-500 p-4">No hay informes guardados en el historial. Genere uno desde la pestaña de Estadísticas.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white responsive-table">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha Creación</th>
                                <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Título del Informe</th>
                                <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoría</th>
                                <th className="py-2 px-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {reports.map(report => (
                                <tr key={report.id} className="hover:bg-gray-50">
                                    <td data-label="Fecha" className="py-3 px-4 text-sm">{new Date(report.createdAt || 0).toLocaleString('es-ES')}</td>
                                    <td data-label="Título" className="py-3 px-4 text-sm font-medium">{report.title}</td>
                                    <td data-label="Categoría" className="py-3 px-4 text-sm">{TAB_LABELS[report.tab]}</td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <button onClick={() => handleViewReport(report)} className="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800" aria-label="Ver informe">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.012 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                            </button>
                                            <button onClick={() => handleDeleteClick(report)} className="p-2 rounded-md text-red-500 hover:bg-red-100" aria-label="Eliminar informe">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ConfirmationModal
                isOpen={!!reportToDelete}
                onClose={() => setReportToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación de Informe"
                message={`¿Estás seguro de que quieres eliminar el informe "${reportToDelete?.title}"? Esta acción no se puede deshacer.`}
                confirmText="Sí, Eliminar"
            />
        </div>
    );
};