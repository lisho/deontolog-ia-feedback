import React from 'react';
import type { FeedbackData, FilterState } from '../types.ts';

interface FilterControlsProps {
  filters: FilterState;
  onFilterChange: (name: keyof FilterState, value: string | number) => void;
  onResetFilters: () => void;
  feedbackTypes: (FeedbackData['tipo_feedback'])[];
}

export const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange, onResetFilters, feedbackTypes }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    onFilterChange(e.target.name as keyof FilterState, e.target.value);
  };

  const commonInputClasses = "mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        {/* Filter by Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-600">Estado</label>
          <select id="status" name="status" value={filters.status} onChange={handleChange} className={commonInputClasses}>
            <option value="">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Revisión">En Revisión</option>
            <option value="Revisado">Revisado</option>
          </select>
        </div>
        
        {/* Filter by Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-600">Tipo</label>
          <select id="type" name="type" value={filters.type} onChange={handleChange} className={commonInputClasses}>
            <option value="">Todos</option>
            {feedbackTypes.map(type => type && <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        {/* Filter by Rating */}
        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-gray-600">Valoración (mín)</label>
          <select id="rating" name="rating" value={filters.rating} onChange={handleChange} className={commonInputClasses}>
            <option value="">Cualquiera</option>
            {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} ★ o más</option>)}
          </select>
        </div>

        {/* Filter by Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-600">Desde</label>
          <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleChange} className={commonInputClasses}/>
        </div>

        {/* Filter by End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-600">Hasta</label>
          <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleChange} className={commonInputClasses}/>
        </div>

        {/* Reset Button */}
        <div className="flex items-center">
            <button
                onClick={onResetFilters}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Limpiar
            </button>
        </div>
      </div>
    </div>
  );
};