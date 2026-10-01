"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageLoader } from '@/components/Loader';
import { api } from '@/services/api';
import { useAuth } from '@/components/AuthProvider';
import { useParams, useRouter } from 'next/navigation';

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.getProductById(id as string);
        setProduct(res);
      } catch (e) {
        console.error("Failed to load product", e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const addToCart = async () => {
    if (!isAuthenticated) {
      alert('Please log in to add items to your bag');
      router.push('/auth');
      return;
    }
    try {
      await api.addToCart(product._id, quantity);
      alert('Added to cart!');
      router.push('/cart');
    } catch (e) {
      console.error(e);
      alert('Failed to add to cart');
    }
  };

  if (loading) {
    return <PageLoader label="Loading product" />;
  }

  if (!product) {
    return <div className="p-8 text-center">Product not found</div>;
  }

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-full flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 px-margin-mobile flex items-center justify-between">
          <button onClick={() => router.back()} aria-label="Go back" className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high/60 transition-colors focus:outline-none -ml-2">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="flex items-center gap-space-xs">
            <Link href="/cart" aria-label="Cart" className="relative w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high/60 transition-colors focus:outline-none">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full bg-surface pt-16 pb-0">
        {/* Product Imagery */}
        <div className="relative w-full aspect-square bg-surface-container-high">
          <img className="w-full h-full object-cover" src={product.images && product.images.length > 0 ? product.images[0].imageUrl : 'https://placehold.co/800x800/eee/ccc'} alt={product.name} />
        </div>
        
        {/* Product Info Sheet */}
        <div className="bg-surface px-margin-mobile pt-space-xl pb-space-lg -mt-4 relative rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col space-y-space-md">
            <div>
              <p className="font-label-sm text-label-sm text-secondary tracking-wide uppercase mb-1">{product.brand || 'Obuya One'}</p>
              <h1 className="font-headline-md text-headline-md text-on-surface leading-tight mb-2">{product.name}</h1>
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-headline-sm text-primary">${product.price}</span>
              </div>
            </div>

            <div className="h-px w-full bg-outline-variant/30 my-2" />

            <div>
              <h2 className="font-title-md text-title-md text-on-surface mb-2">Description</h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {product.description}
              </p>
            </div>
            
            <div className="h-px w-full bg-outline-variant/30 my-2" />

            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="font-title-md text-title-md text-on-surface">Quantity</span>
              <div className="flex items-center bg-surface-container-high rounded-full overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors" disabled={quantity <= 1}>
                  <span className="material-symbols-outlined text-[18px]">remove</span>
                </button>
                <span className="w-8 text-center font-title-md text-title-md text-on-surface">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))} className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Action Bar */}
      <div className="w-full bg-surface pb-32 pt-6">
        <div className="max-w-[500px] mx-auto px-margin-mobile flex items-center gap-space-sm">
          <button className="flex-1 bg-primary text-on-primary h-14 rounded-full font-title-md text-title-md shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2" onClick={addToCart}>
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            <span>Add to Bag • ${(product.price * quantity).toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}