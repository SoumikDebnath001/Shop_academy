import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { formatMoney, useCurrencySettings } from '../../../services/currency';

type Category = {
  _id: string;
  name: string;
};

type Product = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  stock: number;
  category: Category;
  type?: string;
  images: { imageUrl: string }[];
  description: string;
};

export default function ProductsSection() {
  useCurrencySettings(); // re-render when Settings > Currency changes
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [actualPrice, setActualPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('Craft');
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        api.getProducts({}),
        api.getCategories()
      ]);
      // Assuming getProducts returns { data: [...], ... } or just array based on api wrapper
      setProducts(productsRes.data || productsRes);
      setCategories(categoriesRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setActualPrice('');
    setSellingPrice('');
    setDiscountPercentage('');
    setStock('');
    setCategory(categories.length > 0 ? categories[0]._id : '');
    setType('Craft');
    setImages([]);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (product: Product) => {
    setName(product.name);
    setSlug(product.slug);
    setDescription(product.description || '');
    setActualPrice(product.price.toString());
    
    const sp = product.salePrice !== undefined ? product.salePrice : product.price;
    setSellingPrice(sp.toString());
    
    if (product.price > 0 && sp < product.price) {
      setDiscountPercentage(((product.price - sp) / product.price * 100).toFixed(2));
    } else {
      setDiscountPercentage('');
    }

    setStock(product.stock.toString());
    setCategory(product.category ? product.category._id : (categories.length > 0 ? categories[0]._id : ''));
    setType(product.type || 'Craft');
    setImages([]);
    setEditingId(product._id);
    setIsFormOpen(true);
  };

  const handleActualPriceChange = (val: string) => {
    setActualPrice(val);
    const ap = parseFloat(val);
    const dp = parseFloat(discountPercentage);
    if (!isNaN(ap) && !isNaN(dp)) {
      setSellingPrice((ap - (ap * dp / 100)).toFixed(2));
    }
  };

  const handleDiscountChange = (val: string) => {
    setDiscountPercentage(val);
    const ap = parseFloat(actualPrice);
    const dp = parseFloat(val);
    if (!isNaN(ap) && !isNaN(dp)) {
      setSellingPrice((ap - (ap * dp / 100)).toFixed(2));
    }
  };

  const handleSellingPriceChange = (val: string) => {
    setSellingPrice(val);
    const ap = parseFloat(actualPrice);
    const sp = parseFloat(val);
    if (!isNaN(ap) && !isNaN(sp) && ap > 0) {
      setDiscountPercentage(((ap - sp) / ap * 100).toFixed(2));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('slug', slug);
      formData.append('description', description);
      formData.append('price', actualPrice);
      if (sellingPrice) {
        formData.append('salePrice', sellingPrice);
      }
      formData.append('stock', stock);
      formData.append('category', category);
      formData.append('type', type);
      if (images.length > 0) {
        images.forEach(img => formData.append('images', img));
      }

      if (editingId) {
        await api.updateProduct(editingId, formData);
      } else {
        await api.createProduct(formData);
      }
      
      resetForm();
      fetchData();
      alert('Product saved and image uploaded successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Loading products...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Products ({products.length})</h2>
        <button
          onClick={() => {
            if (!isFormOpen) resetForm();
            setIsFormOpen(!isFormOpen);
          }}
          className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-md transition-colors"
        >
          {isFormOpen ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-3 rounded">{error}</div>}

      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-4">{editingId ? 'Edit Product' : 'Create New Product'}</h3>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buying Price (KSh)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={actualPrice}
                  onChange={(e) => handleActualPriceChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountPercentage}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                  placeholder="e.g. 10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KSh)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => handleSellingPriceChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 bg-green-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                <select
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white"
                >
                  <option value="Craft">Craft</option>
                  <option value="Gift">Gift</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Images (Max 2)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      const filesArray = Array.from(e.target.files).slice(0, 2);
                      setImages(filesArray);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md p-1 bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">Select up to 2 images.</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                required
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
                rows={3}
              />
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-primary hover:bg-primary-container text-white px-6 py-2 rounded-md font-medium flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  editingId ? 'Update Product' : 'Save Product'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-medium text-gray-600 text-sm">Product</th>
                <th className="p-4 font-medium text-gray-600 text-sm">Category</th>
                <th className="p-4 font-medium text-gray-600 text-sm">Buying Price</th>
                <th className="p-4 font-medium text-gray-600 text-sm">Selling Price</th>
                <th className="p-4 font-medium text-gray-600 text-sm">Stock</th>
                <th className="p-4 font-medium text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">No products found.</td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {prod.images && prod.images.length > 0 ? (
                          <img src={prod.images[0].imageUrl} alt={prod.name} className="w-12 h-12 object-cover rounded border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 border border-gray-200">
                            <span className="material-symbols-outlined text-xl">image</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{prod.name}</div>
                          <div className="text-xs text-gray-500">{prod.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700">{prod.category?.name || 'Uncategorized'}</td>
                    <td className="p-4 font-medium text-gray-900">{formatMoney(prod.price)}</td>
                    <td className="p-4 font-medium text-gray-900">
                      {formatMoney(prod.salePrice !== undefined ? prod.salePrice : prod.price)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${prod.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEdit(prod)} className="text-primary hover:text-primary-container mr-3 text-sm font-medium">Edit</button>
                      <button onClick={() => handleDelete(prod._id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
