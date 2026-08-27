import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { Category } from '../types';

export interface CategoryCardProps {
  category: Category;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, className = '' }) => {
  const { name, slug, image, productCount } = category;

  const fallbackImg =
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80';

  return (
    <Link
      to={`/shop?category=${slug}`}
      className={`group relative overflow-hidden rounded-2xl bg-gray-900 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${className}`}
    >
      {/* Background Image */}
      <div className="aspect-[4/3] w-full overflow-hidden">
        <img
          src={image || fallbackImg}
          alt={name}
          className="h-full w-full object-cover object-center opacity-80 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-75"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
        {productCount !== undefined && (
          <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary-400">
            {productCount} Products
          </span>
        )}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-primary-300 transition-colors">
            {name}
          </h3>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-primary-600">
            <FiArrowRight className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
