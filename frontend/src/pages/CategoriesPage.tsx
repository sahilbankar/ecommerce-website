import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import CategoryCard from '../components/CategoryCard';
import Breadcrumb from '../components/Breadcrumb';
import { categoryService } from '../services';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService
      .getCategories()
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          if (a.image && !b.image) return -1;
          if (!a.image && b.image) return 1;
          return 0;
        });
        setCategories(sorted);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

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
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800 aspect-[4/3] w-full"
              />
            ))
          : categories.map((category) => (
              <CategoryCard key={category.id || category._id} category={category} />
            ))}
      </div>
    </div>
  );
};

export default CategoriesPage;
