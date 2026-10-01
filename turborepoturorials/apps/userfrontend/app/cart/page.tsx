"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';
import { useAuth } from '../../components/AuthProvider';

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated: isLoggedIn, isLoading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  const fetchCartAndAddresses = async () => {
    try {
      if (!isLoggedIn) {
        setCart({ items: [], totalPrice: 0 });
        return;
      }
      
      const [cartRes, addrRes] = await Promise.all([
        api.getCart(),
        api.getAddresses()
      ]);
      
      setCart(cartRes);
      
      const userAddresses = Array.isArray(addrRes) ? addrRes : [];
      setAddresses(userAddresses);
      
      // Auto-select default address or first address
      if (userAddresses.length > 0) {
        const defaultAddr = userAddresses.find(a => a.isDefault);
        setSelectedAddressId(defaultAddr ? defaultAddr._id : userAddresses[0]._id);
      }
    } catch (e) {
      console.error("Failed to load cart or addresses", e);
      if (!cart) setCart({ items: [], totalPrice: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchCartAndAddresses();
  }, [authLoading, isLoggedIn]);

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await api.updateCartItem(itemId, newQuantity);
      fetchCartAndAddresses();
    } catch (e) {
      console.error(e);
      alert('Failed to update quantity');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await api.removeFromCart(itemId);
      fetchCartAndAddresses();
    } catch (e) {
      console.error(e);
      alert('Failed to remove item');
    }
  };

  const placeOrder = async () => {
    if (addresses.length === 0) {
      alert('Please add a shipping address before placing an order.');
      // Optionally redirect to profile or show a modal here
      return;
    }
    if (!selectedAddressId) {
      alert('Please select a shipping address.');
      return;
    }

    try {
      await api.placeOrder({ paymentMethod: 'cod', addressId: selectedAddressId });
      alert('Order placed successfully!');
      setCart(null);
    } catch (e) {
      console.error(e);
      alert('Failed to place order');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading cart...</div>;
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((acc: number, item: any) => acc + (item.product?.price || 0) * item.quantity, 0);

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-full flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      
      <main className="flex-1 w-full bg-surface pt-20 pb-48 px-margin-mobile">
        <div className="flex items-center justify-between mb-space-md">
          <h1 className="font-headline-sm text-headline-sm text-on-surface">Your Bag</h1>
          <span className="font-title-md text-title-md text-secondary">{items.length} items</span>
        </div>
        {items.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-space-sm">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant">shopping_bag</span>
            <p className="font-title-md text-title-md text-on-surface">
              {isLoggedIn ? 'Your cart is empty.' : 'Sign in to view your bag'}
            </p>
            {!isLoggedIn && (
              <Link href="/auth" className="mt-2 bg-primary text-on-primary px-6 py-2.5 rounded-full font-title-md text-title-md hover:bg-primary-container transition-colors">
                Sign In
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col space-y-space-md px-margin-mobile pt-space-md">
            {items.map((item: any) => (
              <div key={item._id} className="flex gap-space-sm bg-surface-container-low p-space-xs rounded-xl shadow-sm">
                <div className="w-24 h-24 bg-surface-container-highest rounded-lg overflow-hidden flex-shrink-0">
                  <img className="w-full h-full object-cover" src={item.product?.images && item.product.images.length > 0 ? item.product.images[0].imageUrl : 'https://placehold.co/200x200'} alt={item.product?.name} />
                </div>
                <div className="flex flex-col flex-1 py-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-title-md text-body-md text-on-surface leading-tight pr-2">{item.product?.name}</h3>
                    <button onClick={() => removeItem(item._id)} aria-label="Remove item" className="text-on-surface-variant hover:text-error transition-colors mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  <div className="flex-1"></div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-title-md text-title-md text-primary">${item.product?.price}</span>
                    <div className="flex items-center bg-surface-container-highest rounded-full h-8">
                      <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="w-8 h-full flex items-center justify-center text-on-surface hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="w-6 text-center font-title-md text-label-sm text-on-surface">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="w-8 h-full flex items-center justify-center text-on-surface hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Checkout Footer */}
      {items.length > 0 && (
        <div className="w-full bg-surface/95 mt-space-lg pt-space-md pb-32 border-t border-outline-variant/30">
          <div className="px-margin-mobile flex flex-col space-y-space-md max-w-[500px] mx-auto">
            
            {/* Address Selector */}
            <div className="flex flex-col space-y-1 px-2 border-b border-outline-variant/30 pb-4">
              <label className="font-label-md text-label-md text-on-surface">Shipping Address</label>
              {addresses.length > 0 ? (
                <select 
                  value={selectedAddressId} 
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="h-12 bg-surface-container-highest border border-outline-variant rounded-xl px-4 font-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  {addresses.map((addr) => (
                    <option key={addr._id} value={addr._id}>
                      {addr.fullName || addr.label || addr.type} - {addr.city} {addr.pincode ? `(${addr.pincode})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-error font-body-sm text-body-sm flex items-center justify-between">
                  <span>No address found.</span>
                  <Link href="/profile" className="text-primary hover:underline">Add one in Profile</Link>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-space-xs px-2">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span className="font-body-md text-body-md">Subtotal</span>
                <span className="font-title-md text-title-md text-on-surface">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span className="font-body-md text-body-md">Shipping</span>
                <span className="font-title-md text-title-md text-on-surface">Calculated next</span>
              </div>
            </div>
            <button className="w-full bg-primary text-on-primary h-14 rounded-full font-title-lg text-title-lg shadow-md hover:bg-primary-container hover:shadow-lg transition-all flex items-center justify-center gap-space-2xs group" onClick={placeOrder}>
              <span>Place Order</span>
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}