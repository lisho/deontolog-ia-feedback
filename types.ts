export type ReviewStatus = 'Pendiente' | 'En Revisión' | 'Revisado';

export interface FeedbackData {
  id?: string;
  nombre_evaluador: string;
  fecha_hora: string;
  dispositivo: 'Movil' | 'Tableta' | 'Ordenador' | '';
  escenario_keywords: string;
  tipo_feedback: 'Error o Fallo' | 'Sugerencia de Mejora' | 'Valoración Positiva / Uso Relevante' | 'Inquietud Ética/Deontológica' | 'Valorar Conversación' | '';
  descripcion: string;
  respuesta_chatbot: string;
  claridad: 'Sí' | 'No' | '';
  utilidad: 'Sí' | 'No' | 'No Estoy Seguro' | '';
  valoracion_deontologica: number;
  comentarios_finales: string;
  timestamp?: Date;
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