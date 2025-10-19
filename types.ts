export type ReviewStatus = 'Pendiente' | 'En Revisión' | 'Revisado' | 'Cerrado';

export interface FeedbackData {
  id?: string;
  nombre_evaluador: string;
  fecha_hora: string;
  dispositivo: 'Movil' | 'Tableta' | 'Ordenador' | '';
  
  // Existing fields - now optional
  escenario_keywords?: string;
  tipo_feedback: 'Error o Fallo' | 'Sugerencia de Mejora' | 'Valoración Positiva / Uso Relevante' | 'Inquietud Ética/Deontológica' | 'Valorar Conversación' | 'Validación de Corpus' | '';
  descripcion?: string;
  respuesta_chatbot?: string;
  claridad?: 'Sí' | 'No' | '';
  utilidad?: 'Sí' | 'No' | 'No Estoy Seguro' | '';
  valoracion_deontologica?: number;
  valoracion_pertinencia?: number;
  valoracion_calidad_interaccion?: number;
  comentarios_finales?: string;
  
  // New fields for Conversation Feedback
  utilidad_experto_aplicabilidad?: 'Sí' | 'No' | 'Depende' | '';
  utilidad_experto_justificacion?: string;
  impacto_resolucion_dilemas?: number;
  coherencia_interacciones?: number;
  numero_interacciones?: number;
  facilidad_avance_resolucion?: number;


  // New fields for Corpus Validation
  corpus_c1_fuentes_pertinentes?: number;
  corpus_c2_estructura_exhaustiva?: number;
  corpus_c3_libre_info_no_autorizada?: number;
  corpus_c4_detalle_suficiente?: number;
  corpus_c5_core_fiable_legitimo?: number;
  corpus_c6_cobertura_tematica?: number;
  corpus_c7_actualizacion_vigencia?: number;
  corpus_c8_precision_rigor?: number;
  corpus_c9_representatividad_diversidad?: number;
  corpus_c10_redaccion_claridad?: number;
  corpus_c11_referenciacion_trazabilidad?: number;
  corpus_comentarios?: string;
  corpus_propuestas?: string;

  timestamp?: string;
  review_status: ReviewStatus;
  review_result: string;
}

export interface ReportData {
  id?: string;
  title: string;
  tab: 'general' | 'iteration' | 'conversation' | 'corpus';
  aiSummary: string;
  infographicHtml: string;
  tableHtml: string;
  createdAt?: string; // Stored as ISO string on the client
}


export interface FilterState {
  status: ReviewStatus | '';
  type: FeedbackData['tipo_feedback'] | '';
  rating: number | '';
  startDate: string;
  endDate: string;
}