export type ReviewStatus = 'Pendiente' | 'En Revisión' | 'Revisado';

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

  // New fields for Corpus Validation
  corpus_c1_fuentes_pertinentes?: number;
  corpus_c2_estructura_exhaustiva?: number;
  corpus_c3_libre_info_no_autorizada?: number;
  corpus_c4_detalle_suficiente?: number;
  corpus_c5_core_fiable_legitimo?: number;
  corpus_comentarios?: string;
  corpus_propuestas?: string;

  timestamp?: string;
  review_status: ReviewStatus;
  review_result: string;
}

export interface FilterState {
  status: ReviewStatus | '';
  type: FeedbackData['tipo_feedback'] | '';
  rating: number | '';
  startDate: string;
  endDate: string;
}