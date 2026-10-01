"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from './ToastProvider';
import { api } from '../services/api';
import { useAuth } from './AuthProvider';

type ProductCardProps = {
  product: any;
  mini?: boolean; // For the "2-Column Mini Gifts" layout
};

export default function ProductCard({ product, mini = false }: ProductCardProps) {
  const { triggerToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0].imageUrl 
    : 'https://placehold.co/400x500/eee/ccc';

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    if (!isWishlisted) {
      triggerToast('Saved to your Wishlist');
    }
  };

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      triggerToast('Please log in to add items to your bag');
      return;
    }
    try {
      await api.addToCart(product._id, 1);
      triggerToast(`Added ${product.name} to Bag`);
    } catch (err) {
      console.error(err);
      triggerToast(`Failed to add ${product.name}`);
    }
  };

  if (mini) {
    return (
      <Link href={`/product/${product._id}`}>
        <div className="gift-item bg-surface-container-lowest rounded-xl p-space-xs shadow-sm flex flex-col justify-between h-full group">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-surface-container-high mb-space-xs">
            <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={imageUrl} alt={product.name}/>
            <span className="absolute top-2 left-2 bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-[10px] font-bold px-1.5 py-0.5 rounded">
              Mini Gift
            </span>
          </div>
          <div>
            <h4 className="font-title-md text-body-md text-on-surface line-clamp-1">{product.name}</h4>
            <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5 line-clamp-2">{product.shortDescription || product.brand}</p>
          </div>
          <div className="pt-space-xs flex items-center justify-between mt-space-2xs">
            <span className="font-title-md text-title-md text-primary">${product.price}</span>
            <button aria-label="Add gift" className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm hover:bg-primary-container" onClick={addToCart}>
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        </div>
      </Link>
    );
  }

  // Standard Product Card
  return (
    <Link href={`/product/${product._id}`}>
      <div className="product-item flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group h-full">
        <div className="relative aspect-[4/5] bg-surface-container-high overflow-hidden">
          <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={imageUrl} alt={product.name}/>
          <div className="absolute top-2 left-2">
            <span className="bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-label-sm text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm">
              GrassRoots
            </span>
          </div>
          <button 
            className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-lowest/80 backdrop-blur-sm flex items-center justify-center transition-colors ${isWishlisted ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`} 
            onClick={toggleWishlist}
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          </button>
        </div>
        <div className="p-space-xs flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-[14px] text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">{(Math.random() * (5 - 4.2) + 4.2).toFixed(1)}</span>
              <span className="font-label-sm text-[11px] text-on-surface-variant">({Math.floor(Math.random() * 50) + 10})</span>
            </div>
            <h3 className="font-title-md text-body-md text-on-surface line-clamp-1 leading-snug">{product.name}</h3>
            <p className="font-label-sm text-[11px] text-secondary mt-0.5">{product.brand || 'Obuya GrassRoots'}</p>
          </div>
          <div className="pt-space-xs flex items-center justify-between mt-space-2xs">
            <span className="font-title-md text-title-md text-primary">${product.price}</span>
            <button aria-label="Add to bag" className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm hover:bg-primary-container transition-transform active:scale-95" onClick={addToCart}>
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
