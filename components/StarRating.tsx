
import React, { useState } from 'react';

interface StarRatingProps {
    value: number;
    onChange: (value: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({ value, onChange }) => {
    const [hoverValue, setHoverValue] = useState(0);

    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <label
                    key={star}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverValue(star)}
                    onMouseLeave={() => setHoverValue(0)}
                    onClick={() => onChange(star)}
                >
                    <input
                        type="radio"
                        name="valoracion_deontologica"
                        value={star}
                        checked={value === star}
                        className="hidden"
                        readOnly
                    />
                    <span
                        className={`text-4xl transition-colors ${
                            (hoverValue || value) >= star ? 'text-amber-400' : 'text-gray-300'
                        }`}
                        title={`${star} ${star > 1 ? 'estrellas' : 'estrella'}`}
                    >
                        ★
                    </span>
                </label>
            ))}
             {value > 0 && <span className="ml-3 text-sm font-semibold text-gray-600">({value}/5)</span>}
        </div>
    );
};
