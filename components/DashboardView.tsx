import React, { useMemo, useState } from 'react';
import type { FeedbackData } from '../types.ts';
import { KpiCard } from './KpiCard.tsx';
import { FeedbackByTypeChart } from './charts/FeedbackByTypeChart.tsx';
import { FeedbackByStatusChart } from './charts/FeedbackByStatusChart.tsx';
import { ClarityUtilityChart } from './charts/ClarityUtilityChart.tsx';
import { RatingDistributionChart } from './charts/RatingDistributionChart.tsx';
import { GoogleGenAI, Type } from '@google/genai';


interface DashboardViewProps {
    feedbackList: FeedbackData[];
    apiKey: string;
}

type RatingKeys = 'valoracion_deontologica' | 'valoracion_pertinencia' | 'valoracion_calidad_interaccion';
type CorpusRatingKeys = 'corpus_c1_fuentes_pertinentes' | 'corpus_c2_estructura_exhaustiva' | 'corpus_c3_libre_info_no_autorizada' | 'corpus_c4_detalle_suficiente' | 'corpus_c5_core_fiable_legitimo';
type Tab = 'general' | 'conversation' | 'corpus';

interface AiSummary {
    themes: string[];
    sentiment: string;
    recommendations: string[];
    rawText: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ feedbackList, apiKey }) => {
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [aiSummaries, setAiSummaries] = useState<{ general: AiSummary | null; conversation: AiSummary | null; corpus: AiSummary | null }>({ general: null, conversation: null, corpus: null });
    const [isGeneratingSummary, setIsGeneratingSummary] = useState<Tab | null>(null);

    const {
        generalStats,
        conversationStats,
        corpusStats,
        iterationStats
    } = useMemo(() => {
        // Separate feedback lists by type
        const conversationFeedback = feedbackList.filter(fb => fb.tipo_feedback === 'Valorar Conversación');
        const corpusValidationFeedback = feedbackList.filter(fb => fb.tipo_feedback === 'Validación de Corpus');
        const iterationFeedback = feedbackList.filter(fb =>
            fb.tipo_feedback !== 'Valorar Conversación' &&
            fb.tipo_feedback !== 'Validación de Corpus' &&
            fb.tipo_feedback
        );

        // --- General Stats ---
        const feedbackByStatus = feedbackList.reduce((acc: Record<string, number>, fb) => {
            acc[fb.review_status] = (acc[fb.review_status] || 0) + 1;
            return acc;
        }, {});

        // --- Iteration Stats ---
        const iterationByType = iterationFeedback.reduce((acc: Record<string, number>, fb) => {
            const type = fb.tipo_feedback || 'Sin tipo';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        // --- Conversation Stats ---
        const getAvgRating = (list: FeedbackData[], fieldName: RatingKeys) => {
            const rated = list.filter(fb => typeof fb[fieldName] === 'number' && (fb[fieldName] as number) > 0);
            if (rated.length === 0) return 0;
            return rated.reduce((acc, fb) => acc + (fb[fieldName] as number), 0) / rated.length;
        };

        const clarityData = conversationFeedback.reduce((acc: Record<string, number>, fb) => {
            if (fb.claridad) acc[fb.claridad] = (acc[fb.claridad] || 0) + 1;
            return acc;
        }, {});

        const utilityData = conversationFeedback.reduce((acc: Record<string, number>, fb) => {
            if (fb.utilidad) acc[fb.utilidad] = (acc[fb.utilidad] || 0) + 1;
            return acc;
        }, {});
        
        const getRatingDistribution = (fieldName: RatingKeys) => {
            const distribution = conversationFeedback
                .filter(fb => typeof fb[fieldName] === 'number' && (fb[fieldName] as number) > 0)
                .reduce((acc: Record<number, number>, fb) => {
                    const rating = fb[fieldName] as number;
                    acc[rating] = (acc[rating] || 0) + 1;
                    return acc;
                }, {});
            return Array.from({ length: 5 }, (_, i) => 5 - i).map(rating => ({ rating: `${rating} ★`, count: distribution[rating] || 0 }));
        };

        // --- Corpus Stats ---
        const getCorpusAvgRating = (fieldName: CorpusRatingKeys) => {
            const rated = corpusValidationFeedback.filter(fb => typeof fb[fieldName] === 'number' && (fb[fieldName] as number) > 0);
            if (rated.length === 0) return 0;
            return rated.reduce((acc, fb) => acc + (fb[fieldName] as number), 0) / rated.length;
        };
        
        const allCorpusRatings = corpusValidationFeedback.flatMap(fb => [
            fb.corpus_c1_fuentes_pertinentes, fb.corpus_c2_estructura_exhaustiva, fb.corpus_c3_libre_info_no_autorizada,
            fb.corpus_c4_detalle_suficiente, fb.corpus_c5_core_fiable_legitimo
        ]).filter(r => typeof r === 'number' && r > 0) as number[];

        const overallCorpusAvg = allCorpusRatings.length > 0 ? allCorpusRatings.reduce((a, b) => a + b, 0) / allCorpusRatings.length : 0;

        return {
            generalStats: {
                total: feedbackList.length,
                byStatus: Object.entries(feedbackByStatus).map(([label, value]: [string, number]) => ({ label, value })),
            },
            iterationStats: {
                total: iterationFeedback.length,
                byType: Object.entries(iterationByType).map(([label, value]: [string, number]) => ({ label, value })).sort((a,b) => b.value - a.value),
            },
            conversationStats: {
                total: conversationFeedback.length,
                avgDeontological: getAvgRating(conversationFeedback, 'valoracion_deontologica'),
                avgPertinence: getAvgRating(conversationFeedback, 'valoracion_pertinencia'),
                avgInteractionQuality: getAvgRating(conversationFeedback, 'valoracion_calidad_interaccion'),
                clarity: Object.entries(clarityData).map(([label, value]: [string, number]) => ({ label, value })),
                utility: Object.entries(utilityData).map(([label, value]: [string, number]) => ({ label, value })),
                deontologicalRatingDist: getRatingDistribution('valoracion_deontologica'),
                pertinenceRatingDist: getRatingDistribution('valoracion_pertinencia'),
                interactionQualityRatingDist: getRatingDistribution('valoracion_calidad_interaccion'),
            },
            corpusStats: {
                total: corpusValidationFeedback.length,
                overallAvg: overallCorpusAvg,
                avgRatings: {
                    c1: getCorpusAvgRating('corpus_c1_fuentes_pertinentes'),
                    c2: getCorpusAvgRating('corpus_c2_estructura_exhaustiva'),
                    c3: getCorpusAvgRating('corpus_c3_libre_info_no_autorizada'),
                    c4: getCorpusAvgRating('corpus_c4_detalle_suficiente'),
                    c5: getCorpusAvgRating('corpus_c5_core_fiable_legitimo'),
                }
            }
        };
    }, [feedbackList]);

    const handleGenerateSummary = async (tab: Tab) => {
        if (!apiKey) {
            alert('Por favor, configure su API Key en los ajustes para usar esta función.');
            return;
        }
        setIsGeneratingSummary(tab);
        setAiSummaries(prev => ({ ...prev, [tab]: null }));

        try {
            const ai = new GoogleGenAI({ apiKey });

            let textData = '';
            let promptIntro = '';

            switch(tab) {
                case 'general':
                    textData = feedbackList.map(fb => `Tipo: ${fb.tipo_feedback}. Descripción: ${fb.descripcion || 'N/A'}. Comentarios: ${fb.comentarios_finales || 'N/A'}. Comentarios Corpus: ${fb.corpus_comentarios || 'N/A'}`).join('\n---\n');
                    promptIntro = 'Analiza el siguiente conjunto de feedback de todos los tipos para un chatbot de deontología en trabajo social.';
                    break;
                case 'conversation':
                     const conversationFeedback = feedbackList.filter(fb => fb.tipo_feedback === 'Valorar Conversación');
                    textData = conversationFeedback.map(fb => `Descripción: ${fb.descripcion || 'N/A'}. Comentarios: ${fb.comentarios_finales || 'N/A'}. Respuesta Chatbot: ${fb.respuesta_chatbot || 'N/A'}`).join('\n---\n');
                    promptIntro = 'Analiza los siguientes comentarios y descripciones de un conjunto de conversaciones con un chatbot de deontología en trabajo social.';
                    break;
                case 'corpus':
                     const corpusFeedback = feedbackList.filter(fb => fb.tipo_feedback === 'Validación de Corpus');
                    textData = corpusFeedback.map(fb => `Comentarios: ${fb.corpus_comentarios || 'N/A'}. Propuestas: ${fb.corpus_propuestas || 'N/A'}`).join('\n---\n');
                     promptIntro = 'Analiza los siguientes comentarios y propuestas de expertos que han validado el corpus de conocimiento de un chatbot de deontología en trabajo social.';
                    break;
            }

            if (!textData.trim()) {
                 setAiSummaries(prev => ({ ...prev, [tab]: { themes: [], sentiment: 'N/A', recommendations: [], rawText: 'No hay suficientes datos de texto para generar un resumen.' } }));
                 return;
            }

            const prompt = `
                ${promptIntro}
                Analiza el siguiente texto y extrae la información solicitada en el esquema JSON.
                Feedback a analizar:
                ${textData}
            `;
            
            const response = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            temasPrincipales: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Una lista de 3 a 5 temas o problemas clave recurrentes.' },
                            sentimientoGeneral: { type: Type.STRING, description: 'Una palabra que resuma el sentimiento predominante (ej: "Positivo", "Negativo", "Mixto", "Neutral").' },
                            recomendacionesClave: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Una lista de 1 a 3 acciones o puntos de atención concretos.' }
                        }
                    }
                }
            });

            const summaryJson = JSON.parse(response.text);
            const summaryObject: AiSummary = {
                themes: summaryJson.temasPrincipales || [],
                sentiment: summaryJson.sentimientoGeneral || 'No determinado',
                recommendations: summaryJson.recomendacionesClave || [],
                rawText: `**Temas Principales:**\n- ${summaryJson.temasPrincipales?.join('\n- ')}\n\n**Sentimiento General:**\n${summaryJson.sentimientoGeneral}\n\n**Recomendaciones Clave:**\n- ${summaryJson.recomendacionesClave?.join('\n- ')}`
            };
            setAiSummaries(prev => ({ ...prev, [tab]: summaryObject }));

        } catch (error) {
            console.error("Error generating summary:", error);
            setAiSummaries(prev => ({ ...prev, [tab]: { themes: [], sentiment: 'Error', recommendations: [], rawText: 'Error al generar el resumen. Revise la consola para más detalles.' } }));
        } finally {
            setIsGeneratingSummary(null);
        }
    };
    
    const handleGenerateHtmlReport = (tab: Tab) => {
        const getStyles = () => `<style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
            body { font-family: 'Poppins', sans-serif; margin: 0; background-color: #f0f4f8; color: #334155; }
            .container { max-width: 1200px; margin: 2rem auto; padding: 2rem; }
            .header { text-align: center; margin-bottom: 3rem; }
            .header h1 { font-size: 2.5rem; color: #1e3a8a; font-weight: 700; margin: 0; }
            .header p { font-size: 1.1rem; color: #475569; margin-top: 0.5rem; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
            .card { background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); padding: 1.5rem; transition: transform 0.2s; }
            .card:hover { transform: translateY(-5px); }
            .card h2 { font-size: 1.25rem; font-weight: 600; color: #1e3a8a; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem; }
            .kpi-card { text-align: center; }
            .kpi-card .value { font-size: 3rem; font-weight: 700; color: #1d4ed8; line-height: 1; }
            .kpi-card .label { font-size: 0.9rem; color: #64748b; margin-top: 0.5rem; }
            .bar-chart .bar-item { margin-bottom: 0.75rem; }
            .bar-chart .bar-label { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.25rem; }
            .bar-chart .bar-bg { background-color: #e2e8f0; border-radius: 8px; height: 12px; overflow: hidden; }
            .bar-chart .bar { height: 100%; border-radius: 8px; }
            .ai-summary { background-color: #eff6ff; border-left: 4px solid #3b82f6; }
            .ai-summary pre { white-space: pre-wrap; font-family: 'Poppins', sans-serif; font-size: 0.95rem; line-height: 1.6; color: #1e3a8a; }
            .summary-list { list-style-type: none; padding-left: 0; margin-top: 1rem; }
            .summary-list li { background-color: #f8fafc; border-left: 3px solid #60a5fa; padding: 0.5rem 0.75rem; margin-bottom: 0.5rem; border-radius: 4px; font-size: 0.9rem; }
            .icon { width: 24px; height: 24px; }
            .footer { text-align: center; margin-top: 3rem; font-size: 0.8rem; color: #94a3b8; }
        </style>`;

        const ICONS = {
            report: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-1.125 0-2.062.938-2.062 2.063v7.584c0 1.125.937 2.063 2.063 2.063h9.028c1.125 0 2.063-.938 2.063-2.063v-7.584a2.062 2.062 0 00-2.063-2.063H8.25z" /></svg>`,
            chart: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 14.25v-1.5c0-.621.504-1.125 1.125-1.125h13.5c.621 0 1.125.504 1.125 1.125v1.5m-15 0a2.25 2.25 0 002.25 2.25h12A2.25 2.25 0 0019.5 14.25m-15 0h15" /></svg>`,
            ai: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.31-2.31L12.75 18l1.178-.398a3.375 3.375 0 002.31-2.31L16.5 14.25l.398 1.178a3.375 3.375 0 002.31 2.31L20.25 18l-1.178.398a3.375 3.375 0 00-2.31 2.31z" /></svg>`,
            themes: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>`,
            recommendations: `<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>`,
        };

        const createBarChart = (items: { label: string, value: number, color: string }[]) => {
            const maxValue = Math.max(...items.map(i => i.value), 0);
            return items.map(item => `
                <div class="bar-item">
                    <div class="bar-label"><span>${item.label}</span><strong>${item.value}</strong></div>
                    <div class="bar-bg"><div class="bar" style="width: ${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%; background-color: ${item.color};"></div></div>
                </div>
            `).join('');
        };

        const createRatingChart = (items: { label: string, value: number }[], color: string) => {
             const maxValue = Math.max(...items.map(i => i.value), 0);
             return items.map(item => `
                <div class="bar-item">
                    <div class="bar-label"><span>${item.label}</span><strong>${item.value.toFixed(2)} / 5</strong></div>
                    <div class="bar-bg"><div class="bar" style="width: ${ (item.value / 5) * 100 }%; background-color: ${color};"></div></div>
                </div>
            `).join('');
        }

        let content = '';
        const summary = aiSummaries[tab];
        
        const getSentimentIcon = (sentiment: string) => {
            if (sentiment.toLowerCase().includes('positivo')) return '😊';
            if (sentiment.toLowerCase().includes('negativo')) return '😞';
            if (sentiment.toLowerCase().includes('mixto')) return '🤔';
            return '😐';
        }

        const summaryHtml = summary ? `
            ${summary.sentiment !== 'N/A' ? `
                <div class="card kpi-card">
                    <div class="value" style="font-size: 3.5rem;">${getSentimentIcon(summary.sentiment)}</div>
                    <div class="label">Sentimiento General: <strong>${summary.sentiment}</strong></div>
                </div>` : ''
            }
            ${summary.themes.length > 0 ? `
                <div class="card">
                    <h2>${ICONS.themes} Temas Principales</h2>
                    <ul class="summary-list">${summary.themes.map(t => `<li>${t}</li>`).join('')}</ul>
                </div>` : ''
            }
            ${summary.recommendations.length > 0 ? `
                <div class="card">
                    <h2>${ICONS.recommendations} Recomendaciones Clave</h2>
                    <ul class="summary-list">${summary.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
                </div>` : ''
            }
            <div class="card ai-summary" style="grid-column: 1 / -1;">
                <h2>${ICONS.ai} Resumen Cualitativo (Texto Completo)</h2>
                <pre>${summary.rawText.replace(/\*\*/g, '<strong>').replace(/\*\*/g, '</strong>')}</pre>
            </div>
        ` : '';

        switch(tab) {
            case 'general':
                content = `
                    <div class="header"><h1>Informe General de Feedback</h1><p>Una visión completa de todas las contribuciones recibidas.</p></div>
                    <div class="grid">
                        <div class="card kpi-card">
                            <div class="value">${generalStats.total}</div>
                            <div class="label">Total Feedbacks</div>
                        </div>
                        ${generalStats.byStatus.map(s => `<div class="card kpi-card"><div class="value">${s.value}</div><div class="label">${s.label}</div></div>`).join('')}
                        <div class="card">
                            <h2>${ICONS.chart} Feedback por Estado</h2>
                            <div class="bar-chart">${createBarChart(generalStats.byStatus.map(s => ({...s, color: {'Pendiente': '#f59e0b', 'En Revisión': '#3b82f6', 'Revisado': '#10b981'}[s.label] || '#64748b' })))}</div>
                        </div>
                        <div class="card">
                           <h2>${ICONS.chart} Feedback por Tipo de Iteración</h2>
                           <div class="bar-chart">${createBarChart(iterationStats.byType.map((s, i) => ({...s, color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][i % 4]})))}</div>
                        </div>
                        ${summaryHtml}
                    </div>
                `;
                break;
            case 'conversation':
                 const ratingColors = ['#F59E0B', '#8B5CF6', '#EC4899'];
                 content = `
                    <div class="header"><h1>Informe de Análisis de Conversaciones</h1><p>Métricas clave sobre la calidad y utilidad de las interacciones.</p></div>
                    <div class="grid">
                        <div class="card kpi-card"><div class="value">${conversationStats.avgDeontological.toFixed(2)} ★</div><div class="label">Val. Deontológica Media</div></div>
                        <div class="card kpi-card"><div class="value">${conversationStats.avgPertinence.toFixed(2)} ★</div><div class="label">Pertinencia Media</div></div>
                        <div class="card kpi-card"><div class="value">${conversationStats.avgInteractionQuality.toFixed(2)} ★</div><div class="label">Calidad Interacción Media</div></div>
                        <div class="card">
                            <h2>${ICONS.chart} Claridad y Utilidad</h2>
                            <div class="bar-chart">
                                ${createBarChart(conversationStats.clarity.map(c => ({...c, label: `Claridad: ${c.label}`, color: '#3b82f6'})))}
                                ${createBarChart(conversationStats.utility.map(u => ({...u, label: `Utilidad: ${u.label}`, color: '#10b981'})))}
                            </div>
                        </div>
                        <div class="card">
                            <h2>${ICONS.chart} Distribución: Deontología</h2>
                            <div class="bar-chart">${createBarChart(conversationStats.deontologicalRatingDist.map(d => ({label: d.rating, value: d.count, color: ratingColors[0]})))}</div>
                        </div>
                         <div class="card">
                            <h2>${ICONS.chart} Distribución: Pertinencia</h2>
                            <div class="bar-chart">${createBarChart(conversationStats.pertinenceRatingDist.map(d => ({label: d.rating, value: d.count, color: ratingColors[1]})))}</div>
                        </div>
                         <div class="card">
                            <h2>${ICONS.chart} Distribución: Calidad</h2>
                            <div class="bar-chart">${createBarChart(conversationStats.interactionQualityRatingDist.map(d => ({label: d.rating, value: d.count, color: ratingColors[2]})))}</div>
                        </div>
                        ${summaryHtml}
                    </div>
                 `;
                break;
            case 'corpus':
                const corpusRatingsForChart = [
                    { label: "C1: Fuentes Pertinentes", value: corpusStats.avgRatings.c1 },
                    { label: "C2: Estructura Exhaustiva", value: corpusStats.avgRatings.c2 },
                    { label: "C3: Info. No Autorizada", value: corpusStats.avgRatings.c3 },
                    { label: "C4: Detalle Suficiente", value: corpusStats.avgRatings.c4 },
                    { label: "C5: Core Fiable y Legítimo", value: corpusStats.avgRatings.c5 },
                ];
                content = `
                    <div class="header"><h1>Informe de Validación del Corpus Ético</h1><p>Evaluación de la base de conocimiento del chatbot por expertos.</p></div>
                    <div class="grid">
                        <div class="card kpi-card"><div class="value">${corpusStats.total}</div><div class="label">Cuestionarios Recibidos</div></div>
                        <div class="card kpi-card"><div class="value">${corpusStats.overallAvg.toFixed(2)}</div><div class="label">Valoración Media General</div></div>
                        <div class="card" style="grid-column: 1 / -1;">
                            <h2>${ICONS.chart} Valoraciones Medias por Criterio</h2>
                            <div class="bar-chart">${createRatingChart(corpusRatingsForChart, '#6d28d9')}</div>
                        </div>
                        ${summaryHtml}
                    </div>
                `;
                break;
        }

        const reportWindow = window.open('', '_blank');
        if(reportWindow) {
            reportWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Informe Deontolog-IA</title>
                        ${getStyles()}
                    </head>
                    <body>
                        <div class="container">
                            ${content}
                            <div class="footer">Generado el ${new Date().toLocaleString('es-ES')}</div>
                        </div>
                    </body>
                </html>`
            );
            reportWindow.document.close();
        }
    };
    
    const TabButton: React.FC<{ tabName: Tab; currentTab: Tab; onClick: (tab: Tab) => void; children: React.ReactNode }> = ({ tabName, currentTab, onClick, children }) => {
        const isActive = tabName === currentTab;
        return (
            <button
                onClick={() => onClick(tabName)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                role="tab"
                aria-selected={isActive}
            >
                {children}
            </button>
        );
    };

    const corpusRatingsForChart = [
        { label: "C1: Fuentes Pertinentes", value: corpusStats.avgRatings.c1 },
        { label: "C2: Estructura Exhaustiva", value: corpusStats.avgRatings.c2 },
        { label: "C3: Info. No Autorizada", value: corpusStats.avgRatings.c3 },
        { label: "C4: Detalle Suficiente", value: corpusStats.avgRatings.c4 },
        { label: "C5: Core Fiable y Legítimo", value: corpusStats.avgRatings.c5 },
    ];
    
    const AnalysisAndReportingSection: React.FC<{ tab: Tab }> = ({ tab }) => (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Análisis y Reportes Avanzados</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Summary Section */}
                <div>
                    <button
                        onClick={() => handleGenerateSummary(tab)}
                        disabled={isGeneratingSummary === tab || !apiKey}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-violet-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        title={!apiKey ? 'Configure la API Key en los ajustes para usar esta función' : 'Generar resumen cualitativo'}
                    >
                        {isGeneratingSummary === tab ? (
                             <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Generando...</span>
                            </>
                        ) : '✨ Generar Resumen Cualitativo con IA'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                        Analiza los comentarios de esta sección para extraer temas clave y el sentimiento general.
                    </p>
                    {aiSummaries[tab] && (
                        <div className="mt-4 p-4 bg-white border rounded-md text-sm text-gray-700 whitespace-pre-wrap font-mono">
                            {aiSummaries[tab]?.rawText}
                        </div>
                    )}
                </div>
                {/* HTML Report Section */}
                <div>
                     <button
                        onClick={() => handleGenerateHtmlReport(tab)}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        📄 Generar Informe HTML
                    </button>
                     <p className="text-xs text-gray-500 mt-2">
                        Crea un informe detallado de esta pestaña en un formato HTML para imprimir o guardar.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="mt-6 mb-6">
            <div className="border-b border-gray-200 mb-6">
                 <div className="flex space-x-2" role="tablist" aria-label="Pestañas de estadísticas">
                    <TabButton tabName="general" currentTab={activeTab} onClick={setActiveTab}>Visión General</TabButton>
                    <TabButton tabName="conversation" currentTab={activeTab} onClick={setActiveTab}>Análisis de Conversaciones</TabButton>
                    <TabButton tabName="corpus" currentTab={activeTab} onClick={setActiveTab}>Validación de Corpus</TabButton>
                </div>
            </div>

            <div id="tab-content">
                {activeTab === 'general' && (
                    <div role="tabpanel">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Visión General del Feedback</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <KpiCard title="Total Feedbacks" value={generalStats.total} description="Todos los tipos combinados." />
                             {generalStats.byStatus.map(s => <KpiCard key={s.label} title={s.label} value={s.value} description={`${generalStats.total > 0 ? ((s.value / generalStats.total) * 100).toFixed(0) : 0}% del total.`} />)}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <FeedbackByStatusChart data={generalStats.byStatus} />
                            <FeedbackByTypeChart data={iterationStats.byType} title="Feedback por Tipo de Iteración" />
                        </div>
                        <AnalysisAndReportingSection tab="general" />
                    </div>
                )}

                {activeTab === 'conversation' && (
                     <div role="tabpanel">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Análisis de Conversaciones ({conversationStats.total} en total)</h3>
                        {conversationStats.total > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <KpiCard title="Valoración Deontológica" value={`${conversationStats.avgDeontological.toFixed(2)} ★`} description="Promedio de estrellas." />
                                    <KpiCard title="Valoración Pertinencia" value={`${conversationStats.avgPertinence.toFixed(2)} ★`} description="Promedio de estrellas." />
                                    <KpiCard title="Calidad Interacción" value={`${conversationStats.avgInteractionQuality.toFixed(2)} ★`} description="Promedio de estrellas." />
                                </div>
                                <div className="grid grid-cols-1 gap-6 mt-4">
                                    <ClarityUtilityChart clarityData={conversationStats.clarity} utilityData={conversationStats.utility} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                    <RatingDistributionChart data={conversationStats.deontologicalRatingDist} title="Distribución: Deontología" color="#F59E0B" />
                                    <RatingDistributionChart data={conversationStats.pertinenceRatingDist} title="Distribución: Pertinencia" color="#8B5CF6" />
                                    <RatingDistributionChart data={conversationStats.interactionQualityRatingDist} title="Distribución: Calidad" color="#EC4899" />
                                </div>
                            </>
                        ) : (
                             <p className="text-center text-gray-500 p-8 bg-gray-50 rounded-lg">No hay datos de feedback de conversación para analizar.</p>
                        )}
                         <AnalysisAndReportingSection tab="conversation" />
                    </div>
                )}
                
                {activeTab === 'corpus' && (
                     <div role="tabpanel">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Resultados de Validación del Corpus</h3>
                        {corpusStats.total > 0 ? (
                             <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <KpiCard title="Cuestionarios Recibidos" value={corpusStats.total} description="Total de validaciones de corpus." />
                                    <KpiCard title="Valoración Media General" value={`${corpusStats.overallAvg.toFixed(2)} / 5`} description="Promedio de todas las preguntas." />
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Valoraciones Medias por Criterio</h4>
                                    <div className="space-y-3">
                                        {corpusRatingsForChart.map((item) => (
                                            <div key={item.label}>
                                                <div className="flex justify-between items-center text-sm mb-1">
                                                    <span className="font-medium text-gray-700">{item.label}</span>
                                                    <span className="font-semibold text-gray-800">{item.value.toFixed(2)} / 5</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(item.value / 5) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                             <p className="text-center text-gray-500 p-8 bg-gray-50 rounded-lg">No hay datos de validación de corpus para analizar.</p>
                        )}
                        <AnalysisAndReportingSection tab="corpus" />
                    </div>
                )}
            </div>
        </div>
    );
};