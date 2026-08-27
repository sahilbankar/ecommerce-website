import React from 'react';
import { MOCK_CATEGORIES } from '../constants/dummyData';
import CategoryCard from '../components/CategoryCard';
import Breadcrumb from '../components/Breadcrumb';

export const CategoriesPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Breadcrumb items={[{ label: 'Categories', href: '/categories' }]} />

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Product Categories
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Explore products organized by collection hierarchies.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_CATEGORIES.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;
