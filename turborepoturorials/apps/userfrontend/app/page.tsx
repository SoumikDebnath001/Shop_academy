"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import { api } from '../services/api';

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type Product = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  stock: number;
  category: Category;
  images: { imageUrl: string }[];
  description: string;
  brand?: string;
  shortDescription?: string;
};

export default function Page() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastProductElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.getCategories();
        setCategories(res);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await api.getProducts({ 
          page: page, 
          limit: 12, 
          category: selectedCategory === 'all' ? undefined : selectedCategory 
        });
        
        // Ensure res has pagination structure based on Backend response
        const newProducts = Array.isArray(res) ? res : (res as any).data || [];
        
        setProducts(prev => {
          if (page === 1) return newProducts;
          return [...prev, ...newProducts];
        });
        
        if (newProducts.length < 12) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, selectedCategory]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPage(1); // Reset page to 1 when changing category
    setProducts([]); // Clear current products
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-full flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      <main className="flex-1 w-full bg-surface pt-6 pb-24 px-margin-mobile max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Collection</h1>
          <p className="text-gray-600">Discover quality sports gear from Obuya GrassRoots.</p>
        </div>

        {/* Categories Filter Row */}
        <div className="overflow-x-auto pb-4 mb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-3">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`whitespace-nowrap px-5 py-2 rounded-full font-medium transition-colors text-sm ${
                selectedCategory === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleCategoryChange(cat._id)}
                className={`whitespace-nowrap px-5 py-2 rounded-full font-medium transition-colors text-sm ${
                  selectedCategory === cat._id 
                    ? 'bg-primary text-white' 
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 && !loading ? (
          <div className="text-center py-20 text-gray-500">
            No products found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, index) => {
              if (products.length === index + 1) {
                return (
                  <div ref={lastProductElementRef} key={product._id}>
                    <ProductCard product={product} />
                  </div>
                );
              } else {
                return (
                  <div key={product._id}>
                    <ProductCard product={product} />
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

      </main>
    </div>
  );
}