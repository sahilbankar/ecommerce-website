import React, { useState } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export interface RatingProps {
  value: number; // 0 to 5
  max?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  reviewCount?: number;
  onChange?: (rating: number) => void;
  className?: string;
}

export const RatingComponent: React.FC<RatingProps> = ({
  value,
  max = 5,
  readOnly = true,
  size = 'md',
  showNumber = false,
  reviewCount,
  onChange,
  className = '',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  const activeRating = hoverValue !== null ? hoverValue : value;

  const renderStar = (index: number) => {
    const starNumber = index + 1;

    if (!readOnly) {
      return (
        <button
          key={index}
          type="button"
          onClick={() => onChange && onChange(starNumber)}
          onMouseEnter={() => setHoverValue(starNumber)}
          onMouseLeave={() => setHoverValue(null)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          {activeRating >= starNumber ? (
            <FaStar className={`${starSizes[size]} text-amber-400`} />
          ) : (
            <FaRegStar className={`${starSizes[size]} text-gray-300 dark:text-gray-600`} />
          )}
        </button>
      );
    }

    if (activeRating >= starNumber) {
      return <FaStar key={index} className={`${starSizes[size]} text-amber-400`} />;
    } else if (activeRating >= starNumber - 0.5) {
      return <FaStarHalfAlt key={index} className={`${starSizes[size]} text-amber-400`} />;
    } else {
      return <FaRegStar key={index} className={`${starSizes[size]} text-gray-300 dark:text-gray-600`} />;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => renderStar(i))}
      </div>
      {showNumber && (
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-0.5">
          {value.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
          ({reviewCount})
        </span>
      )}
    </div>
  );
};

export default RatingComponent;
