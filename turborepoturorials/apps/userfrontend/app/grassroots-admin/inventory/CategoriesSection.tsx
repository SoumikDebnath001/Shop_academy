import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

type Category = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
};

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (category: Category) => {
    setName(category.name);
    setSlug(category.slug);
    setEditingId(category._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.deleteCategory(id);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    try {
      const formData = new FormData();
      formData.append('isActive', (!cat.isActive).toString());
      await api.updateCategory(cat._id, formData);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('slug', slug);

      if (editingId) {
        await api.updateCategory(editingId, formData);
      } else {
        await api.createCategory(formData);
      }
      
      resetForm();
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Loading categories...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Categories</h2>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-md transition-colors"
        >
          {isFormOpen ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-3 rounded">{error}</div>}

      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-4">{editingId ? 'Edit Category' : 'Create New Category'}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="bg-primary hover:bg-primary-container text-white px-6 py-2 rounded-md font-medium"
              >
                {editingId ? 'Update Category' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-medium text-gray-600 text-sm">Name</th>
              <th className="p-4 font-medium text-gray-600 text-sm">Status</th>
              <th className="p-4 font-medium text-gray-600 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">No categories found.</td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{cat.name}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleToggleStatus(cat)}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${cat.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEdit(cat)} className="text-primary hover:text-primary-container mr-3 text-sm font-medium">Edit</button>
                    <button onClick={() => handleDelete(cat._id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
