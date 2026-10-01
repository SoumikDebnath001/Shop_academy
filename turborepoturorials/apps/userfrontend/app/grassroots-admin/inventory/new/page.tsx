"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../services/api';
import { adminPath } from '../../../../services/adminRoutes';

export default function NewProduct() {
  const router = useRouter();
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    isActive: true,
  });
  
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getCategories();
        setCategories(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, category: data[0]._id }));
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('stock', formData.stock || '0');
      data.append('category', formData.category);
      data.append('isActive', formData.isActive ? 'true' : 'false');
      
      // Auto generate slug
      data.append('slug', formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));

      if (imageFiles) {
        for (let i = 0; i < imageFiles.length; i++) {
          data.append('images', imageFiles[i]);
        }
      }

      await api.createProduct(data);
      router.push(adminPath('/inventory'));
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative w-full pb-20 px-4 md:px-8">
      <div className="py-6 border-b border-surface-container-highest mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Add New Product</h1>
        <p className="text-sm text-on-surface-variant mt-1">Create a new item in your inventory.</p>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container">
        
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm text-on-surface">Product Name</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required
            className="w-full bg-surface-container-low text-on-surface px-4 py-2 rounded-lg border border-surface-container-highest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="e.g. Ceramic Vase"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm text-on-surface">Description</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            required
            rows={4}
            className="w-full bg-surface-container-low text-on-surface px-4 py-2 rounded-lg border border-surface-container-highest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Detailed description of the item..."
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm text-on-surface">Price ($)</label>
            <input 
              type="number" 
              name="price" 
              value={formData.price} 
              onChange={handleChange} 
              required
              min="0"
              step="0.01"
              className="w-full bg-surface-container-low text-on-surface px-4 py-2 rounded-lg border border-surface-container-highest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="0.00"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm text-on-surface">Initial Stock</label>
            <input 
              type="number" 
              name="stock" 
              value={formData.stock} 
              onChange={handleChange} 
              min="0"
              className="w-full bg-surface-container-low text-on-surface px-4 py-2 rounded-lg border border-surface-container-highest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm text-on-surface">Category</label>
          <select 
            name="category" 
            value={formData.category} 
            onChange={handleChange} 
            required
            className="w-full bg-surface-container-low text-on-surface px-4 py-2 rounded-lg border border-surface-container-highest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm text-on-surface">Product Images</label>
          <input 
            type="file" 
            multiple 
            accept="image/*"
            onChange={handleFileChange} 
            className="w-full bg-surface-container-low text-on-surface px-4 py-2 rounded-lg border border-surface-container-highest file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary hover:file:text-on-primary"
          />
          <p className="text-xs text-on-surface-variant">You can select multiple images.</p>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <input 
            type="checkbox" 
            name="isActive" 
            id="isActive"
            checked={formData.isActive} 
            onChange={handleChange} 
            className="w-5 h-5 rounded border-surface-container-highest text-primary focus:ring-primary accent-primary"
          />
          <label htmlFor="isActive" className="font-semibold text-sm text-on-surface">Active (visible in store)</label>
        </div>

        <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-surface-container-highest">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="px-6 py-2 rounded-lg font-medium text-on-surface hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-on-primary px-6 py-2 rounded-lg font-medium shadow-sm hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>

      </form>
    </div>
  );
}