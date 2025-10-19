import React, { useMemo, useState } from 'react';
import type { FeedbackData } from '../types.ts';
import { KpiCard } from './KpiCard.tsx';
import { FeedbackByStatusChart } from './charts/FeedbackByStatusChart.tsx';
import { FeedbackByTypeChart } from './charts/FeedbackByTypeChart.tsx';
import { ClarityUtilityChart } from './charts/ClarityUtilityChart.tsx';
import { RatingDistributionChart } from './charts/RatingDistributionChart.tsx';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

interface DashboardViewProps {
    feedbackList: FeedbackData[];
    apiKey: string;
}

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

export const DashboardView: React.FC<DashboardViewProps> = ({ feedbackList, apiKey }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'iteration' | 'conversation' | 'corpus'>('general');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [summary, setSummary] = useState('');

    const { iterationFeedbacks, conversationFeedbacks, corpusFeedbacks } = useMemo(() => {
        const iterationTypes = ['Error o Fallo', 'Sugerencia de Mejora', 'Valoración Positiva / Uso Relevante', 'Inquietud Ética/Deontológica'];
        return {
            iterationFeedbacks: feedbackList.filter(f => iterationTypes.includes(f.tipo_feedback)),
            conversationFeedbacks: feedbackList.filter(f => f.tipo_feedback === 'Valorar Conversación'),
            corpusFeedbacks: feedbackList.filter(f => f.tipo_feedback === 'Validación de Corpus'),
        };
    }, [feedbackList]);
    
    const generateAiSummaryForReport = async (): Promise<string> => {
        if (!apiKey) return "API Key no configurada.";
        
        let dataForSummary = feedbackList;
        let promptContext = "un resumen general del feedback recibido";
        let statsContext = `
            - Total de Feedbacks: ${feedbackList.length}
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
            const prompt = `Eres un analista de datos experto en deontología del trabajo social. Genera un informe ejecutivo conciso sobre ${promptContext}. Identifica: 1. **Tendencias Clave:** Temas recurrentes. 2. **Puntos Fuertes:** Aspectos que funcionan bien. 3. **Áreas de Mejora Críticas:** Problemas prioritarios. 4. **Recomendaciones Estratégicas:** 2-3 acciones concretas. **Datos:**\n${statsContext}\n**Muestra:**\n${feedbackSample}\nGenera el informe ahora.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            return response.text.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        } catch (error) {
            console.error("Error generating summary:", error);
            return "Se produjo un error al generar el resumen.";
        }
    };
    
     const createReportHtml = (title: string, aiSummary: string, infographicHtml: string, tableHtml: string): string => {
        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { font-family: sans-serif; background-color: #f9fafb; color: #1f2937; }
                    .container { max-width: 1024px; margin: auto; padding: 2rem; }
                    .card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); padding: 1.5rem; border: 1px solid #e5e7eb; }
                    h1 { font-size: 2.25rem; font-weight: bold; color: #1d4ed8; }
                    h2 { font-size: 1.5rem; font-weight: bold; color: #111827; border-bottom: 2px solid #93c5fd; padding-bottom: 0.5rem; margin-top: 2rem; margin-bottom: 1rem; }
                    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
                    th { background-color: #f3f4f6; font-weight: 600; }
                    tbody tr:hover { background-color: #f9fafb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <header class="text-center mb-8">
                        <h1>${title}</h1>
                        <p class="text-gray-500">Generado el ${new Date().toLocaleDateString('es-ES')}</p>
                    </header>
                    <main>
                        <section class="mb-8">
                            <h2>Resumen Ejecutivo (IA)</h2>
                            <div class="card prose"><p>${aiSummary}</p></div>
                        </section>
                        <section class="mb-8">
                            <h2>Infografía de Datos Clave</h2>
                            <div class="card">${infographicHtml}</div>
                        </section>
                        <section>
                            <h2>Datos Detallados</h2>
                            <div class="card overflow-x-auto">
                                <table>${tableHtml}</table>
                            </div>
                        </section>
                    </main>
                    <footer class="text-center mt-8 text-sm text-gray-500">
                        <p>&copy; ${new Date().getFullYear()} Colegio Oficial de Trabajo Social de León.</p>
                    </footer>
                </div>
            </body>
            </html>
        `;
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        const aiSummary = await generateAiSummaryForReport();
        
        let title = "Informe General de Feedback";
        let infographic = "";
        let table = "";
        let data: FeedbackData[] = [];
        let headers: string[] = [];

        switch (activeTab) {
            case 'general':
                title = "Informe General de Feedback";
                data = feedbackList;
                headers = ['Fecha', 'Tipo', 'Escenario', 'Valoración', 'Estado'];
                infographic = `<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div class="p-4 bg-blue-50 rounded-lg"><div class="text-3xl font-bold text-blue-700">${feedbackList.length}</div><div class="text-sm text-blue-600">Total</div></div>
                    <div class="p-4 bg-indigo-50 rounded-lg"><div class="text-3xl font-bold text-indigo-700">${iterationFeedbacks.length}</div><div class="text-sm text-indigo-600">Iteraciones</div></div>
                    <div class="p-4 bg-green-50 rounded-lg"><div class="text-3xl font-bold text-green-700">${conversationFeedbacks.length}</div><div class="text-sm text-green-600">Conversaciones</div></div>
                    <div class="p-4 bg-purple-50 rounded-lg"><div class="text-3xl font-bold text-purple-700">${corpusFeedbacks.length}</div><div class="text-sm text-purple-600">Valid. Corpus</div></div>
                </div>`;
                table = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                         <tbody>${data.map(f => `<tr><td>${new Date(f.timestamp || 0).toLocaleDateString('es-ES')}</td><td>${f.tipo_feedback}</td><td>${f.escenario_keywords || 'N/A'}</td><td>${f.valoracion_deontologica || 'N/A'}</td><td>${f.review_status}</td></tr>`).join('')}</tbody>`;
                break;
            case 'iteration':
                title = "Informe de Análisis de Iteraciones";
                data = iterationFeedbacks;
                headers = ['Fecha', 'Tipo', 'Escenario', 'Descripción'];
                const iterationCounts = data.reduce((acc, f) => { acc[f.tipo_feedback] = (acc[f.tipo_feedback] || 0) + 1; return acc; }, {} as Record<string, number>);
                const maxVal = Math.max(...Object.values(iterationCounts));
                infographic = `<div class="space-y-3">${Object.entries(iterationCounts).map(([label, value]) => `
                    <div>
                        <div class="flex justify-between text-sm"><span class="font-medium">${label}</span><span>${value}</span></div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-1"><div class="bg-indigo-500 h-2.5 rounded-full" style="width: ${maxVal > 0 ? (value/maxVal)*100 : 0}%"></div></div>
                    </div>`).join('')}</div>`;
                table = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                         <tbody>${data.map(f => `<tr><td>${new Date(f.timestamp || 0).toLocaleDateString('es-ES')}</td><td>${f.tipo_feedback}</td><td>${f.escenario_keywords || 'N/A'}</td><td>${f.descripcion || 'N/A'}</td></tr>`).join('')}</tbody>`;
                break;
            case 'conversation':
                 title = "Informe de Análisis de Conversaciones";
                 data = conversationFeedbacks;
                 headers = ['Fecha', 'Escenario', 'Deontología ★', 'Pertinencia ★', 'Calidad ★'];
                 const avgDeon = data.length > 0 ? (data.reduce((a, b) => a + (b.valoracion_deontologica || 0), 0) / data.length).toFixed(1) : 'N/A';
                 infographic = `<div class="text-center"><div class="text-5xl font-bold text-green-700">${avgDeon}</div><div class="text-lg text-green-600">Valoración Deontológica Media</div></div>`;
                 table = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                          <tbody>${data.map(f => `<tr><td>${new Date(f.timestamp || 0).toLocaleDateString('es-ES')}</td><td>${f.escenario_keywords || 'N/A'}</td><td>${f.valoracion_deontologica || 'N/A'}</td><td>${f.valoracion_pertinencia || 'N/A'}</td><td>${f.valoracion_calidad_interaccion || 'N/A'}</td></tr>`).join('')}</tbody>`;
                 break;
            case 'corpus':
                title = "Informe de Validación de Corpus";
                data = corpusFeedbacks;
                headers = ['Fecha', 'C1 ★', 'C2 ★', 'C3 ★', 'C4 ★', 'C5 ★'];
                const corpusAvgs = [
                    { label: 'C1', value: data.length > 0 ? data.reduce((a, b) => a + (b.corpus_c1_fuentes_pertinentes || 0), 0) / data.length : 0 },
                    { label: 'C2', value: data.length > 0 ? data.reduce((a, b) => a + (b.corpus_c2_estructura_exhaustiva || 0), 0) / data.length : 0 },
                    { label: 'C3', value: data.length > 0 ? data.reduce((a, b) => a + (b.corpus_c3_libre_info_no_autorizada || 0), 0) / data.length : 0 },
                    { label: 'C4', value: data.length > 0 ? data.reduce((a, b) => a + (b.corpus_c4_detalle_suficiente || 0), 0) / data.length : 0 },
                    { label: 'C5', value: data.length > 0 ? data.reduce((a, b) => a + (b.corpus_c5_core_fiable_legitimo || 0), 0) / data.length : 0 },
                ];
                infographic = `<div class="space-y-3">${corpusAvgs.map(item => `
                    <div>
                        <div class="flex justify-between text-sm"><span class="font-medium">${item.label}</span><span>${item.value.toFixed(2)}/5</span></div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-1"><div class="bg-purple-500 h-2.5 rounded-full" style="width: ${(item.value / 5) * 100}%"></div></div>
                    </div>`).join('')}</div>`;
                table = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                         <tbody>${data.map(f => `<tr><td>${new Date(f.timestamp || 0).toLocaleDateString('es-ES')}</td><td>${f.corpus_c1_fuentes_pertinentes || 'N/A'}</td><td>${f.corpus_c2_estructura_exhaustiva || 'N/A'}</td><td>${f.corpus_c3_libre_info_no_autorizada || 'N/A'}</td><td>${f.corpus_c4_detalle_suficiente || 'N/A'}</td><td>${f.corpus_c5_core_fiable_legitimo || 'N/A'}</td></tr>`).join('')}</tbody>`;
                break;
        }

        const reportHtml = createReportHtml(title, aiSummary, infographic, table);
        const newWindow = window.open();
        newWindow?.document.write(reportHtml);
        newWindow?.document.close();
        
        setIsGeneratingReport(false);
    };

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setSummary('');
        const summaryText = await generateAiSummaryForReport();
        setSummary(summaryText.replace(/<br \/>/g, '\n'));
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
                title={!apiKey ? 'Configure la API Key para usar esta función' : 'Generar informe detallado'}
            >
                 {isGeneratingReport ? 'Generando...' : '📄 Generar Informe con Infografía'}
            </button>
        </div>
    );
    
    const renderGeneralView = () => {
        const stats = useMemo(() => {
            const statusCounts = feedbackList.reduce((acc, f) => { acc[f.review_status] = (acc[f.review_status] || 0) + 1; return acc; }, {} as Record<string, number>);
            const statusChartData = Object.entries(statusCounts).map(([label, value]) => ({ label, value }));
            const typeCounts = feedbackList.reduce((acc, f) => { if (f.tipo_feedback) acc[f.tipo_feedback] = (acc[f.tipo_feedback] || 0) + 1; return acc; }, {} as Record<string, number>);
            const typeChartData = Object.entries(typeCounts).map(([label, value]) => ({ label, value }));
            return { statusChartData, typeChartData };
        }, [feedbackList]);
        
        return (
            <div>
                 <ActionsBar />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard title="Total de Feedbacks" value={feedbackList.length} description="Registros que coinciden con los filtros" />
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
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{summary}</div>
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