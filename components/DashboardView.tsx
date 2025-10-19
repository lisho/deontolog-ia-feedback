import React, { useMemo, useState } from 'react';
import type { FeedbackData, ReportData } from '../types.ts';
import { KpiCard } from './KpiCard.tsx';
import { FeedbackByStatusChart } from './charts/FeedbackByStatusChart.tsx';
import { FeedbackByTypeChart } from './charts/FeedbackByTypeChart.tsx';
import { ClarityUtilityChart } from './charts/ClarityUtilityChart.tsx';
import { RatingDistributionChart } from './charts/RatingDistributionChart.tsx';
import { GoogleGenAI } from '@google/genai';

interface DashboardViewProps {
    feedbackList: FeedbackData[];
    apiKey: string;
    addReport: (report: Omit<ReportData, 'id' | 'createdAt'>) => Promise<void>;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

// --- Report Generation Helper Functions ---

const generateKpiCardsHtml = (kpis: { title: string, value: string | number }[]) => {
    return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        ${kpis.map(kpi => `
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div class="text-3xl font-bold text-blue-700">${kpi.value}</div>
                <div class="text-sm text-gray-600">${kpi.title}</div>
            </div>
        `).join('')}
    </div>
    `;
};

const generateHorizontalBarChartHtml = (title: string, data: { label: string, value: number }[], color: string) => {
    if (!data || data.length === 0) return `<div><h4 class="text-lg font-semibold text-gray-800 mb-2">${title}</h4><p class="text-sm text-gray-500">No hay datos.</p></div>`;
    const maxValue = Math.max(...data.map(item => item.value), 1); // Avoid division by zero
    const barsHtml = data.map(item => `
        <div class="mb-3">
            <div class="flex justify-between items-center text-sm mb-1">
                <span class="font-medium text-gray-700">${item.label}</span>
                <span class="font-semibold text-gray-800">${item.value}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class="h-2.5 rounded-full" style="width: ${(item.value / maxValue) * 100}%; background-color: ${color};"></div>
            </div>
        </div>
    `).join('');
    return `<div class="p-4 border border-gray-200 rounded-lg bg-white"><h4 class="text-lg font-semibold text-gray-800 mb-4">${title}</h4>${barsHtml}</div>`;
};

const generateDonutChartHtml = (title: string, data: { label: string, value: number, color: string }[]) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (total === 0) return `<div><h4 class="text-lg font-semibold text-gray-800 mb-2">${title}</h4><p class="text-sm text-gray-500">No hay datos.</p></div>`;

    const circumference = 2 * Math.PI * 40;
    let offset = 0;
    const segments = data.map(item => {
        const percent = item.value / total;
        const dasharray = `${percent * circumference} ${circumference}`;
        const strokeOffset = -offset;
        offset += percent * circumference;
        return `<circle cx="50" cy="50" r="40" fill="transparent" stroke="${item.color}" stroke-width="20" stroke-dasharray="${dasharray}" stroke-dashoffset="${strokeOffset}" />`;
    }).join('');

    const legend = data.map(item => `
        <li class="flex items-center justify-between">
            <div class="flex items-center"><span class="w-3 h-3 rounded-full mr-2" style="background-color: ${item.color};"></span><span>${item.label}</span></div>
            <strong>${item.value}</strong>
        </li>
    `).join('');

    return `
    <div class="p-4 border border-gray-200 rounded-lg bg-white h-full flex flex-col">
        <h4 class="text-lg font-semibold text-gray-800 mb-4">${title}</h4>
        <div class="relative w-40 h-40 mx-auto my-4">
            <svg class="w-full h-full" viewBox="0 0 100 100"><g transform="rotate(-90, 50, 50)">${segments}</g></svg>
            <div class="absolute inset-0 flex items-center justify-center"><span class="text-2xl font-bold text-gray-800">${total}</span></div>
        </div>
        <div class="mt-auto"><ul class="text-sm text-gray-600 space-y-1">${legend}</ul></div>
    </div>`;
};

const createReportHtml = (title: string, aiSummary: string, infographicHtml: string, tableHtml: string, createdAt: string): string => {
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
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
                    <h1>${title}</h1>
                    <p class="text-gray-500 mt-2">Generado el ${new Date(createdAt).toLocaleString('es-ES')}</p>
                </header>
                <main>
                    <section class="mb-8">
                        <h2>Resumen Ejecutivo (IA)</h2>
                        <div class="card prose">${aiSummary}</div>
                    </section>
                    <section class="mb-8">
                        <h2>Infografía de Datos Clave</h2>
                        ${infographicHtml}
                    </section>
                    <section>
                        <h2>Datos Detallados</h2>
                        <div class="card overflow-x-auto"><table>${tableHtml}</table></div>
                    </section>
                </main>
                <footer class="text-center mt-10 text-sm text-gray-500"><p>&copy; ${new Date().getFullYear()} Colegio Oficial de Trabajo Social de León.</p></footer>
            </div>
        </body>
        </html>
    `;
};


const CorpusAverageChart: React.FC<{ data: { label: string, value: number }[], title: string }> = ({ data, title }) => {
    const maxValue = 5; // Max rating is 5
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            <div className="space-y-3">
                {data.map((item) => (
                    <div key={item.label}>
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-medium text-gray-700">{item.label}</span>
                            <span className="font-semibold text-gray-800">{item.value.toFixed(2)} / 5</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="h-2.5 rounded-full bg-purple-500"
                                style={{
                                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ feedbackList, apiKey, addReport, showToast }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'iteration' | 'conversation' | 'corpus'>('general');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [summary, setSummary] = useState('');

    // Filter out 'Cerrado' feedback for all statistics and reports
    const activeFeedbackList = useMemo(() => 
        feedbackList.filter(f => f.review_status !== 'Cerrado'),
        [feedbackList]
    );

    const { iterationFeedbacks, conversationFeedbacks, corpusFeedbacks } = useMemo(() => {
        const iterationTypes = ['Error o Fallo', 'Sugerencia de Mejora', 'Valoración Positiva / Uso Relevante', 'Inquietud Ética/Deontológica'];
        return {
            iterationFeedbacks: activeFeedbackList.filter(f => iterationTypes.includes(f.tipo_feedback)),
            conversationFeedbacks: activeFeedbackList.filter(f => f.tipo_feedback === 'Valorar Conversación'),
            corpusFeedbacks: activeFeedbackList.filter(f => f.tipo_feedback === 'Validación de Corpus'),
        };
    }, [activeFeedbackList]);
    
    const generateAiSummaryForReport = async (): Promise<string> => {
        if (!apiKey) return "API Key no configurada.";
        
        let dataForSummary = activeFeedbackList;
        let promptContext = "un resumen general del feedback activo (excluyendo los cerrados)";
        let statsContext = `
            - Total de Feedbacks Activos: ${activeFeedbackList.length}
            - Feedbacks de Iteración: ${iterationFeedbacks.length}
            - Feedbacks de Conversación: ${conversationFeedbacks.length}
            - Feedbacks de Validación de Corpus: ${corpusFeedbacks.length}
        `;

        switch(activeTab) {
            case 'iteration':
                if (iterationFeedbacks.length === 0) return "No hay datos de iteración para analizar.";
                dataForSummary = iterationFeedbacks;
                promptContext = "un análisis del feedback sobre iteraciones concretas (errores, sugerencias, etc.)";
                statsContext = `- Total de Feedbacks de Iteración: ${iterationFeedbacks.length}`;
                break;
            case 'conversation':
                 if (conversationFeedbacks.length === 0) return "No hay datos de conversación para analizar.";
                dataForSummary = conversationFeedbacks;
                promptContext = "un análisis de las valoraciones de conversaciones completas";
                statsContext = `- Total de Feedbacks de Conversación: ${conversationFeedbacks.length}`;
                break;
            case 'corpus':
                 if (corpusFeedbacks.length === 0) return "No hay datos de validación de corpus para analizar.";
                dataForSummary = corpusFeedbacks;
                promptContext = "un análisis de los cuestionarios de validación del corpus ético";
                statsContext = `- Total de Validaciones de Corpus: ${corpusFeedbacks.length}`;
                break;
        }

        try {
            const ai = new GoogleGenAI({ apiKey });
            const feedbackSample = dataForSummary.slice(0, 20).map(f => `- Tipo: ${f.tipo_feedback}, Escenario/Contexto: ${f.escenario_keywords || 'N/A'}, Descripción: ${f.descripcion || f.corpus_comentarios || 'N/A'}, Valoración: ${f.valoracion_deontologica || 'N/A'}`).join('\n');
            const currentDate = new Date().toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

            const prompt = `
                Eres un analista de datos experto en deontología del trabajo social. 
                Genera un informe ejecutivo conciso en HTML (usa párrafos <p>, negritas <strong> y listas <ul><li>).
                
                **Fecha del Informe:** ${currentDate}.
                
                El informe debe analizar ${promptContext}. Identifica los siguientes puntos clave:
                1.  **Tendencias Clave:** Temas recurrentes, problemas o éxitos más comunes.
                2.  **Puntos Fuertes:** Aspectos que funcionan bien y reciben valoraciones positivas.
                3.  **Áreas de Mejora Críticas:** Problemas prioritarios que requieren atención inmediata.
                4.  **Recomendaciones Estratégicas:** Sugiere 2-3 acciones concretas y priorizadas para el equipo de desarrollo/revisión.

                **Datos de Contexto:**
                ${statsContext}

                **Muestra de Feedback para Análisis:**
                ${feedbackSample}
                
                Genera el informe ahora, asegurándote de incluir la fecha indicada.
            `;

            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            
            let summaryText = response.text;
            // Clean the summary text to remove markdown code fences
            summaryText = summaryText.replace(/^```(html)?\s*/, '').replace(/```\s*$/, '');
            
            return summaryText.trim();
        } catch (error) {
            console.error("Error generating summary:", error);
            return "<p>Se produjo un error al generar el resumen.</p>";
        }
    };
    
    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        const aiSummary = await generateAiSummaryForReport();
        
        let title = "Informe General de Feedback";
        let infographicHtml = "";
        let tableHtml = "";
        let data: FeedbackData[] = [];
        let headers: string[] = [];

        switch (activeTab) {
            case 'general':
                title = "Informe General de Feedback (Activos)";
                data = activeFeedbackList;
                headers = ['Fecha', 'Tipo', 'Escenario', 'Valoración', 'Estado'];
                const kpis = [
                    { title: 'Total Activos', value: activeFeedbackList.length },
                    { title: 'Iteraciones', value: iterationFeedbacks.length },
                    { title: 'Conversaciones', value: conversationFeedbacks.length },
                    { title: 'Valid. Corpus', value: corpusFeedbacks.length },
                ];
                const statusCounts = activeFeedbackList.reduce((acc, f) => { acc[f.review_status] = (acc[f.review_status] || 0) + 1; return acc; }, {} as Record<string, number>);
                const statusChartData = [
                    { label: 'Pendiente', value: statusCounts['Pendiente'] || 0, color: '#F59E0B' },
                    { label: 'En Revisión', value: statusCounts['En Revisión'] || 0, color: '#3B82F6' },
                    { label: 'Revisado', value: statusCounts['Revisado'] || 0, color: '#10B981' },
                ];
                const typeCounts = activeFeedbackList.reduce((acc, f) => { if (f.tipo_feedback) acc[f.tipo_feedback] = (acc[f.tipo_feedback] || 0) + 1; return acc; }, {} as Record<string, number>);
                const typeChartData = Object.entries(typeCounts).map(([label, value]) => ({ label, value }));
                infographicHtml = `
                    <div class="card mb-6">${generateKpiCardsHtml(kpis)}</div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${generateDonutChartHtml("Feedback por Estado", statusChartData)}
                        ${generateHorizontalBarChartHtml("Feedback por Tipo", typeChartData, '#8B5CF6')}
                    </div>`;
                tableHtml = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                         <tbody>${data.map(f => `<tr><td>${new Date(f.timestamp || 0).toLocaleDateString('es-ES')}</td><td>${f.tipo_feedback}</td><td>${f.escenario_keywords || 'N/A'}</td><td>${f.valoracion_deontologica || 'N/A'}</td><td>${f.review_status}</td></tr>`).join('')}</tbody>`;
                break;
            case 'iteration':
                title = "Informe de Análisis de Iteraciones";
                data = iterationFeedbacks;
                headers = ['Fecha', 'Tipo', 'Escenario', 'Descripción'];
                const iterationCounts = data.reduce((acc, f) => { acc[f.tipo_feedback] = (acc[f.tipo_feedback] || 0) + 1; return acc; }, {} as Record<string, number>);
                const iterationChartData = Object.entries(iterationCounts).map(([label, value]) => ({label, value}));
                infographicHtml = `<div class="card">${generateHorizontalBarChartHtml("Desglose por Tipo de Iteración", iterationChartData, '#3B82F6')}</div>`;
                tableHtml = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                         <tbody>${data.map(f => `<tr><td>${new Date(f.timestamp || 0).toLocaleDateString('es-ES')}</td><td>${f.tipo_feedback}</td><td>${f.escenario_keywords || 'N/A'}</td><td>${f.descripcion || 'N/A'}</td></tr>`).join('')}</tbody>`;
                break;
            case 'conversation':
                 title = "Informe de Análisis de Conversaciones";
                 data = conversationFeedbacks;
                 headers = ['Fecha', 'Escenario', 'Deontología ★', 'Pertinencia ★', 'Calidad ★'];
                 const ratingDistribution = (field: keyof FeedbackData) => {
                     const counts: Record<string, number> = { '1 ★': 0, '2 ★': 0, '3 ★': 0, '4 ★': 0, '5 ★': 0 };
                     data.forEach(f => { const rating = f[field] as number; if (rating >= 1 && rating <= 5) counts[`${rating} ★`] = (counts[`${rating} ★`] || 0) + 1; });
                     return Object.entries(counts).map(([label, value]) => ({ label, value }));
                 };
                 infographicHtml = `<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${generateHorizontalBarChartHtml("Val. Deontológica", ratingDistribution('valoracion_deontologica'), '#8B5CF6')}
                    ${generateHorizontalBarChartHtml("Val. Pertinencia", ratingDistribution('valoracion_pertinencia'), '#EC4899')}
                    ${generateHorizontalBarChartHtml("Val. Calidad", ratingDistribution('valoracion_calidad_interaccion'), '#F59E0B')}
                 </div>`;
                 tableHtml = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                          <tbody>${data.map(f => `<tr><td>${new Date(f.timestamp || 0).toLocaleDateString('es-ES')}</td><td>${f.escenario_keywords || 'N/A'}</td><td>${f.valoracion_deontologica || 'N/A'}</td><td>${f.valoracion_pertinencia || 'N/A'}</td><td>${f.valoracion_calidad_interaccion || 'N/A'}</td></tr>`).join('')}</tbody>`;
                 break;
            case 'corpus':
                title = "Informe de Validación de Corpus";
                data = corpusFeedbacks;
                headers = ['Fecha', 'C1 ★', 'C2 ★', 'C3 ★', 'C4 ★', 'C5 ★'];
                const calculateAverage = (key: keyof FeedbackData) => data.length > 0 ? data.reduce((acc, f) => acc + ((f[key] as number) || 0), 0) / data.length : 0;
                const corpusChartData = [
                    { label: 'C1: Fuentes Pertinentes', value: calculateAverage('corpus_c1_fuentes_pertinentes')},
                    { label: 'C2: Estructura Exhaustiva', value: calculateAverage('corpus_c2_estructura_exhaustiva')},
                    { label: 'C3: Libre Info. No Autorizada', value: calculateAverage('corpus_c3_libre_info_no_autorizada')},
                    { label: 'C4: Detalle Suficiente', value: calculateAverage('corpus_c4_detalle_suficiente')},
                    { label: 'C5: Core Fiable y Legítimo', value: calculateAverage('corpus_c5_core_fiable_legitimo')},
                ];
                infographicHtml = `<div class="card">${generateHorizontalBarChartHtml("Valoración Media por Criterio", corpusChartData.map(d => ({...d, value: parseFloat(d.value.toFixed(2))})), '#6366F1')}</div>`;
                tableHtml = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                         <tbody>${data.map(f => `<tr><td>${new Date(f.timestamp || 0).toLocaleDateString('es-ES')}</td><td>${f.corpus_c1_fuentes_pertinentes || 'N/A'}</td><td>${f.corpus_c2_estructura_exhaustiva || 'N/A'}</td><td>${f.corpus_c3_libre_info_no_autorizada || 'N/A'}</td><td>${f.corpus_c4_detalle_suficiente || 'N/A'}</td><td>${f.corpus_c5_core_fiable_legitimo || 'N/A'}</td></tr>`).join('')}</tbody>`;
                break;
        }
        
        const reportCreatedAt = new Date().toISOString();
        const reportData: Omit<ReportData, 'id' | 'createdAt'> = {
            title,
            tab: activeTab,
            aiSummary,
            infographicHtml,
            tableHtml,
        };

        try {
            await addReport(reportData);
            showToast('Informe generado y guardado en el historial.', 'success');
            
            const fullReportHtml = createReportHtml(title, aiSummary, infographicHtml, tableHtml, reportCreatedAt);
            const newWindow = window.open();
            newWindow?.document.write(fullReportHtml);
            newWindow?.document.close();
        } catch (error) {
            console.error("Failed to save or generate report:", error);
            showToast('Error al guardar el informe.', 'error');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setSummary('');
        const summaryText = await generateAiSummaryForReport();
        setSummary(summaryText); // Store as HTML
        setIsGeneratingSummary(false);
    };
    
    const ActionsBar = () => (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 my-4">
             <button 
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary || !apiKey}
                className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-md disabled:bg-violet-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                title={!apiKey ? 'Configure la API Key para usar esta función' : 'Generar resumen con IA'}
            >
                 {isGeneratingSummary ? 'Generando...' : '✨ Generar Resumen (IA)'}
            </button>
            <button 
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || !apiKey}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                title={!apiKey ? 'Configure la API Key para usar esta función' : 'Generar y guardar informe detallado'}
            >
                 {isGeneratingReport ? 'Generando...' : '📄 Generar y Guardar Informe'}
            </button>
        </div>
    );
    
    const renderGeneralView = () => {
        const stats = useMemo(() => {
            const statusCounts = activeFeedbackList.reduce((acc, f) => { acc[f.review_status] = (acc[f.review_status] || 0) + 1; return acc; }, {} as Record<string, number>);
            const statusChartData = Object.entries(statusCounts).map(([label, value]) => ({ label, value }));
            const typeCounts = activeFeedbackList.reduce((acc, f) => { if (f.tipo_feedback) acc[f.tipo_feedback] = (acc[f.tipo_feedback] || 0) + 1; return acc; }, {} as Record<string, number>);
            const typeChartData = Object.entries(typeCounts).map(([label, value]) => ({ label, value }));
            return { statusChartData, typeChartData };
        }, [activeFeedbackList]);
        
        return (
            <div>
                 <ActionsBar />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard title="Total de Feedbacks (Activos)" value={activeFeedbackList.length} description="Registros que coinciden con los filtros (excl. cerrados)" />
                    <KpiCard title="Total Iteraciones" value={iterationFeedbacks.length} description="Errores, sugerencias, etc." />
                    <KpiCard title="Total Conversaciones" value={conversationFeedbacks.length} description="Evaluaciones completas" />
                    <KpiCard title="Total Valid. Corpus" value={corpusFeedbacks.length} description="Cuestionarios de expertos" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                     <FeedbackByStatusChart data={stats.statusChartData} />
                     <FeedbackByTypeChart data={stats.typeChartData} title="Feedback por Tipo (Global)" />
                </div>
            </div>
        );
    };

    const renderIterationView = () => {
        const stats = useMemo(() => {
            const typeCounts = iterationFeedbacks.reduce((acc, f) => { if (f.tipo_feedback) acc[f.tipo_feedback] = (acc[f.tipo_feedback] || 0) + 1; return acc; }, {} as Record<string, number>);
            const typeChartData = Object.entries(typeCounts).map(([label, value]) => ({ label, value }));
            return { typeChartData };
        }, [iterationFeedbacks]);
        
        return (
            <div>
                <ActionsBar />
                {iterationFeedbacks.length === 0 ? <div className="text-center text-gray-500 p-4">No hay datos de feedback de iteración.</div> :
                (<>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KpiCard title="Total Feedbacks de Iteración" value={iterationFeedbacks.length} description="Análisis de respuestas específicas" />
                     </div>
                     <div className="grid grid-cols-1 gap-6 mt-6">
                         <FeedbackByTypeChart data={stats.typeChartData} title="Desglose por Tipo de Iteración"/>
                     </div>
                </>)}
            </div>
        );
    };
    
    const renderConversationView = () => {
        const stats = useMemo(() => {
            const totalRatings = conversationFeedbacks.reduce((acc, f) => acc + (f.valoracion_deontologica || 0), 0);
            const avgRating = conversationFeedbacks.length > 0 ? (totalRatings / conversationFeedbacks.length).toFixed(1) : 'N/A';
            const clarityCounts = conversationFeedbacks.reduce((acc, f) => { if (f.claridad) acc[f.claridad] = (acc[f.claridad] || 0) + 1; return acc; }, {} as Record<string, number>);
            const clarityChartData = Object.entries(clarityCounts).map(([label, value]) => ({ label, value }));
            const utilityCounts = conversationFeedbacks.reduce((acc, f) => { if (f.utilidad) acc[f.utilidad] = (acc[f.utilidad] || 0) + 1; return acc; }, {} as Record<string, number>);
            const utilityChartData = Object.entries(utilityCounts).map(([label, value]) => ({ label, value }));
            const ratingDistribution = (field: keyof FeedbackData) => {
                 const counts: Record<string, number> = { '1 ★': 0, '2 ★': 0, '3 ★': 0, '4 ★': 0, '5 ★': 0 };
                 conversationFeedbacks.forEach(f => {
                    const rating = f[field] as number;
                    if (rating >= 1 && rating <= 5) counts[`${rating} ★`] = (counts[`${rating} ★`] || 0) + 1;
                 });
                 return Object.entries(counts).map(([rating, count]) => ({ rating, count }));
            };
            return { avgRating, clarityChartData, utilityChartData, deontologicalData: ratingDistribution('valoracion_deontologica'), pertinenceData: ratingDistribution('valoracion_pertinencia'), qualityData: ratingDistribution('valoracion_calidad_interaccion') };
        }, [conversationFeedbacks]);
        
        return (
             <div>
                <ActionsBar />
                {conversationFeedbacks.length === 0 ? <div className="text-center text-gray-500 p-4">No hay datos de feedback de conversación.</div> :
                (<>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KpiCard title="Total Evaluaciones" value={conversationFeedbacks.length} description="Análisis de interacciones completas" />
                        <KpiCard title="Val. Deontológica Media" value={stats.avgRating} description="Promedio sobre 5 estrellas" />
                    </div>
                    <div className="mt-6">
                        <ClarityUtilityChart clarityData={stats.clarityChartData} utilityData={stats.utilityChartData} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <RatingDistributionChart data={stats.deontologicalData} title="Distribución Val. Deontológica" color="#8B5CF6" />
                        <RatingDistributionChart data={stats.pertinenceData} title="Distribución Val. Pertinencia" color="#EC4899" />
                        <RatingDistributionChart data={stats.qualityData} title="Distribución Val. Calidad Interacción" color="#F59E0B" />
                    </div>
                </>)}
            </div>
        );
    };

    const renderCorpusView = () => {
         const stats = useMemo(() => {
            const calculateAverage = (key: keyof FeedbackData) => corpusFeedbacks.length > 0 ? corpusFeedbacks.reduce((acc, f) => acc + ((f[key] as number) || 0), 0) / corpusFeedbacks.length : 0;
            const averageChartData = [
                { label: 'C1: Fuentes Pertinentes', value: calculateAverage('corpus_c1_fuentes_pertinentes')},
                { label: 'C2: Estructura Exhaustiva', value: calculateAverage('corpus_c2_estructura_exhaustiva')},
                { label: 'C3: Libre Info. No Autorizada', value: calculateAverage('corpus_c3_libre_info_no_autorizada')},
                { label: 'C4: Detalle Suficiente', value: calculateAverage('corpus_c4_detalle_suficiente')},
                { label: 'C5: Core Fiable y Legítimo', value: calculateAverage('corpus_c5_core_fiable_legitimo')},
            ];
            const globalAverage = averageChartData.length > 0 ? (averageChartData.reduce((acc, item) => acc + item.value, 0) / averageChartData.length).toFixed(2) : 'N/A';
            return { averageChartData, globalAverage };
        }, [corpusFeedbacks]);

        return (
            <div>
                <ActionsBar />
                {corpusFeedbacks.length === 0 ? <div className="text-center text-gray-500 p-4">No hay datos de validación de corpus.</div> :
                (<>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KpiCard title="Total Validaciones de Corpus" value={corpusFeedbacks.length} description="Cuestionarios de expertos" />
                        <KpiCard title="Valoración Media Global" value={stats.globalAverage} description="Promedio sobre 5 estrellas" />
                    </div>
                    <div className="grid grid-cols-1 gap-6 mt-6">
                        <CorpusAverageChart data={stats.averageChartData} title="Valoración Media por Criterio"/>
                    </div>
                </>)}
            </div>
        );
    };

    const TabButton: React.FC<{ tabName: typeof activeTab, label: string }> = ({ tabName, label }) => {
        const isActive = activeTab === tabName;
        return (
            <button
                onClick={() => { setSummary(''); setActiveTab(tabName); }}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-current={isActive ? 'page' : undefined}
            >
                {label}
            </button>
        );
    };
    
    return (
        <div className="mt-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-2 mb-4">
                <h3 className="text-xl font-bold text-gray-800">Estadísticas de Feedback</h3>
            </div>

            {summary && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Resumen Ejecutivo (IA) - {
                        { 'general': 'Visión General', 'iteration': 'Análisis de Iteraciones', 'conversation': 'Análisis de Conversación', 'corpus': 'Validación de Corpus' }[activeTab]
                    }</h4>
                    <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: summary }}></div>
                </div>
            )}
            
            <div className="border-b border-gray-200 mb-2">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <TabButton tabName="general" label="Visión General" />
                    <TabButton tabName="iteration" label="Análisis de Iteraciones" />
                    <TabButton tabName="conversation" label="Análisis de Conversación" />
                    <TabButton tabName="corpus" label="Validación de Corpus" />
                </nav>
            </div>
            
             <div className="pt-4">
                {activeTab === 'general' && renderGeneralView()}
                {activeTab === 'iteration' && renderIterationView()}
                {activeTab === 'conversation' && renderConversationView()}
                {activeTab === 'corpus' && renderCorpusView()}
            </div>
        </div>
    );
};