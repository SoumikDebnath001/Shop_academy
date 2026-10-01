"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/services/api';

type Section = 'profile' | 'orders' | 'addresses' | 'saved' | 'help' | null;

export default function UserProfile() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    landmark: '', city: '', state: '', pincode: '', type: 'home'
  });
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [isLoading, user, router]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    try {
      await api.createAddress(addressFormData);
      setShowAddressForm(false);
      setAddressFormData({
        fullName: '', phone: '', addressLine1: '', addressLine2: '',
        landmark: '', city: '', state: '', pincode: '', type: 'home'
      });
      // Refresh addresses
      const res = await api.getAddresses();
      setAddresses(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to save address', err);
      alert('Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await api.setDefaultAddress(id);
      const res = await api.getAddresses();
      setAddresses(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to set default address', err);
    }
  };

  const openSection = async (section: Section) => {
    setActiveSection(section);
    setSectionLoading(true);
    try {
      if (section === 'orders') {
        const res = await api.getOrders();
        setOrders(Array.isArray(res) ? res : []);
      } else if (section === 'addresses') {
        const res = await api.getAddresses();
        setAddresses(Array.isArray(res) ? res : []);
      }
    } catch (e) {
      console.error(`Failed to load ${section}`, e);
    } finally {
      setSectionLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleEditProfile = () => {
    setFormData({ name: user?.name || '', phone: user?.phone || '' });
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile(formData);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      await logout();
      window.location.href = '/';
    } catch (e) {
      console.error(e);
      alert("Failed to delete account");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-on-surface-variant font-body-md">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const menuItems: { label: string; icon: string; key: Section }[] = [
    { label: 'Profile', icon: 'person', key: 'profile' },
    { label: 'Orders', icon: 'receipt_long', key: 'orders' },
    { label: 'Addresses', icon: 'pin_drop', key: 'addresses' },
    { label: 'Saved Items', icon: 'favorite', key: 'saved' },
    { label: 'Help', icon: 'help', key: 'help' },
    { label: 'Sign Out', icon: 'logout', key: null },
  ];

  // Main menu view
  if (!activeSection) {
    return (
      <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
        <main className="flex-1 w-full bg-surface pt-20 pb-24">
          <div className="flex flex-col w-full pb-8 space-y-6 px-margin-mobile">

            {/* Profile Header */}
            <section className="flex flex-col items-center text-center pt-space-md">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-space-sm shadow-md">
                <span className="text-[36px] text-on-primary font-bold">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              </div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface">{user.name}</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{user.email}</p>
            </section>

            {/* Menu Buttons */}
            <section className="grid grid-cols-2 gap-space-sm">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.key ? openSection(item.key) : handleLogout()}
                  className={`flex flex-col items-center justify-center gap-space-2xs p-space-md rounded-xl shadow-sm active:scale-[0.98] transition-all ${
                    item.key === null 
                      ? 'bg-surface-container-low hover:bg-error-container hover:text-on-error-container text-on-surface-variant' 
                      : 'bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    item.key === null ? 'bg-surface-container text-on-surface-variant' : 'bg-surface-container text-on-surface'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  </div>
                  <span className="font-title-md text-body-md font-semibold">{item.label}</span>
                </button>
              ))}
            </section>

          </div>

          {/* Logout Confirmation Modal */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-8">
              <div className="bg-surface rounded-2xl shadow-xl p-space-lg w-full max-w-sm flex flex-col items-center gap-space-md">
                <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px] text-on-error-container">logout</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Sign Out?</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-center">Are you sure you want to sign out of your account?</p>
                <div className="flex gap-space-sm w-full">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-3 rounded-xl bg-surface-container-low text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 py-3 rounded-xl bg-error text-on-error font-label-lg text-label-lg hover:opacity-90 transition-opacity"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    );
  }

  // Section detail view
  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen">
      <main className="flex-1 w-full bg-surface pt-20 pb-24">
        <div className="flex flex-col w-full pb-8 px-margin-mobile">

          {/* Back button + section title */}
          <div className="flex items-center gap-space-xs mb-space-md">
            <button
              onClick={() => setActiveSection(null)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors -ml-1"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {activeSection === 'profile' && 'Profile'}
              {activeSection === 'orders' && 'Orders'}
              {activeSection === 'addresses' && 'Addresses'}
              {activeSection === 'saved' && 'Saved Items'}
              {activeSection === 'help' && 'Help'}
            </h2>
          </div>

          {/* PROFILE SECTION */}
          {activeSection === 'profile' && (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-sm relative">
              
              <div className="flex flex-col items-center pb-space-md border-b border-outline-variant/20 relative">
                {!editMode && (
                  <button 
                    onClick={handleEditProfile}
                    className="absolute right-0 top-0 text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    <span className="font-label-sm font-semibold">Edit</span>
                  </button>
                )}
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-space-sm shadow-md">
                  <span className="text-[36px] text-on-primary font-bold">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface">{user.name}</h3>
              </div>
              
              {editMode ? (
                <div className="space-y-4 py-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-on-surface-variant uppercase tracking-wider">Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-surface border border-outline-variant/40 rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-on-surface-variant uppercase tracking-wider">Email (Read Only)</label>
                    <input 
                      type="email" 
                      value={user.email}
                      disabled
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 text-on-surface-variant opacity-70 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-on-surface-variant uppercase tracking-wider">Phone</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-surface border border-outline-variant/40 rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors"
                      placeholder="Add phone number"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setEditMode(false)}
                      className="flex-1 py-2 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex-1 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-medium transition-colors disabled:opacity-70"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/15">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Name</span>
                    <span className="font-body-md text-on-surface font-medium">{user.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/15">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Email</span>
                    <span className="font-body-md text-on-surface font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Phone</span>
                    <span className="font-body-md text-on-surface font-medium">{user.phone || 'Not provided'}</span>
                  </div>
                </>
              )}

              {/* Account Deletion Section */}
              <div className="mt-8 pt-6 border-t border-error/20 flex flex-col items-center">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-2 rounded-full border border-error text-error font-label-md hover:bg-error-container hover:text-on-error-container transition-colors"
                >
                  Delete Account
                </button>
              </div>

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-8">
                  <div className="bg-surface rounded-2xl shadow-xl p-space-lg w-full max-w-sm flex flex-col items-center gap-space-md">
                    <div className="w-14 h-14 rounded-full bg-error flex items-center justify-center">
                      <span className="material-symbols-outlined text-[28px] text-on-error">warning</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Delete Account?</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant text-center">
                      Are you sure you want to permanently delete your account? This action cannot be undone.
                    </p>
                    <div className="flex gap-space-sm w-full mt-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-3 rounded-xl bg-surface-container-low text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        className="flex-1 py-3 rounded-xl bg-error text-on-error font-label-lg text-label-lg hover:opacity-90 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ORDERS SECTION */}
          {activeSection === 'orders' && (
            <div className="space-y-space-sm">
              {sectionLoading ? (
                <div className="py-12 text-center text-on-surface-variant animate-pulse">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center justify-center py-12 gap-space-sm">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant">shopping_bag</span>
                  <p className="font-title-md text-title-md text-on-surface">No orders yet</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Your order history will appear here</p>
                  <Link href="/gifts" className="mt-2 px-5 py-2 bg-primary text-on-primary rounded-full font-label-lg text-label-lg hover:bg-primary-container transition-colors">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                orders.map((order: any) => (
                  <div key={order._id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
                    <div className="flex items-center justify-between mb-space-xs">
                      <span className="font-title-md text-title-md text-on-surface font-semibold">
                        #{order._id?.slice(-6).toUpperCase()}
                      </span>
                      <span className={`px-space-xs py-1 rounded-full font-label-sm text-label-sm font-semibold capitalize ${
                        order.status === 'delivered' ? 'bg-secondary-container text-on-secondary-container' :
                        order.status === 'cancelled' ? 'bg-error-container text-on-error-container' :
                        'bg-primary-container text-on-primary-container'
                      }`}>
                        {order.status?.replace(/_/g, ' ') || 'processing'}
                      </span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant font-body-sm text-body-sm">
                      <span>{order.items?.length || 0} items</span>
                      <span className="font-semibold text-on-surface">₹{order.totalAmount || 0}</span>
                    </div>
                    {order.createdAt && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-space-xs">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ADDRESSES SECTION */}
          {activeSection === 'addresses' && (
            <div className="space-y-space-sm pb-16">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-title-md text-title-md text-on-surface">Your Addresses</h3>
                <button onClick={() => setShowAddressForm(true)} className="flex items-center gap-1 text-primary hover:text-primary-container transition-colors font-label-lg font-bold">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add New
                </button>
              </div>

              {sectionLoading ? (
                <div className="py-12 text-center text-on-surface-variant animate-pulse">Loading addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center justify-center py-12 gap-space-sm">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant">location_off</span>
                  <p className="font-title-md text-title-md text-on-surface">No saved addresses</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Add an address to speed up checkout</p>
                  <button onClick={() => setShowAddressForm(true)} className="mt-4 bg-primary text-on-primary px-6 py-2 rounded-full font-label-lg">
                    Add Address
                  </button>
                </div>
              ) : (
                addresses.map((addr: any) => (
                  <div key={addr._id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-start gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[20px] text-on-primary-container">location_on</span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-title-md text-title-md text-on-surface font-semibold">{addr.fullName || addr.label || addr.type || 'Address'}</span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 bg-primary-container text-on-primary-container rounded-full font-label-sm text-[10px] font-bold">Default</span>
                        )}
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        {[addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Phone: {addr.phone}</p>
                      
                      {!addr.isDefault && (
                        <button 
                          onClick={() => handleSetDefaultAddress(addr._id)}
                          className="mt-3 self-start text-primary font-label-md hover:underline"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SAVED ITEMS SECTION */}
          {activeSection === 'saved' && (
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center justify-center py-12 gap-space-sm">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">favorite_border</span>
              <p className="font-title-md text-title-md text-on-surface">No saved items yet</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Items you save will appear here</p>
              <Link href="/gifts" className="mt-2 px-5 py-2 bg-primary text-on-primary rounded-full font-label-lg text-label-lg hover:bg-primary-container transition-colors">
                Browse Products
              </Link>
            </div>
          )}

          {/* HELP SECTION */}
          {activeSection === 'help' && (
            <div className="space-y-space-sm">
              <a href="mailto:support@obuyagrassroots.com" className="flex items-center gap-space-sm p-space-md bg-surface-container-lowest rounded-xl shadow-sm hover:bg-surface-container-low transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-on-primary-container">mail</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-body-md font-semibold text-on-surface">Email Support</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">support@obuyagrassroots.com</span>
                </div>
              </a>
              <a href="tel:+911234567890" className="flex items-center gap-space-sm p-space-md bg-surface-container-lowest rounded-xl shadow-sm hover:bg-surface-container-low transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-on-primary-container">call</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-body-md font-semibold text-on-surface">Call Us</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">+91 123 456 7890</span>
                </div>
              </a>
              <div className="flex items-center gap-space-sm p-space-md bg-surface-container-lowest rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-on-primary-container">schedule</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-body-md font-semibold text-on-surface">Working Hours</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Mon - Sat, 10 AM - 7 PM</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ADD ADDRESS MODAL */}
      {showAddressForm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-scrim/40 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-[500px] rounded-t-3xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-margin-mobile border-b border-outline-variant/30">
              <h2 className="font-title-lg text-title-lg text-on-surface">Add New Address</h2>
              <button onClick={() => setShowAddressForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[24px] text-on-surface-variant">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveAddress} className="flex flex-col flex-1 overflow-y-auto p-margin-mobile space-y-space-md">
              <div className="flex flex-col space-y-1">
                <label className="font-label-md text-label-md text-on-surface">Full Name</label>
                <input required type="text" value={addressFormData.fullName} onChange={e => setAddressFormData({...addressFormData, fullName: e.target.value})} className="h-12 bg-surface-container-highest border border-outline-variant rounded-xl px-4 font-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="John Doe" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-label-md text-label-md text-on-surface">Phone Number</label>
                <input required type="tel" value={addressFormData.phone} onChange={e => setAddressFormData({...addressFormData, phone: e.target.value})} className="h-12 bg-surface-container-highest border border-outline-variant rounded-xl px-4 font-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="10-digit mobile number" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-label-md text-label-md text-on-surface">Address Line 1</label>
                <input required type="text" value={addressFormData.addressLine1} onChange={e => setAddressFormData({...addressFormData, addressLine1: e.target.value})} className="h-12 bg-surface-container-highest border border-outline-variant rounded-xl px-4 font-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="House/Flat No, Building, Street" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-label-md text-label-md text-on-surface">Address Line 2 (Optional)</label>
                <input type="text" value={addressFormData.addressLine2} onChange={e => setAddressFormData({...addressFormData, addressLine2: e.target.value})} className="h-12 bg-surface-container-highest border border-outline-variant rounded-xl px-4 font-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Area, Sector, Village" />
              </div>
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col space-y-1">
                  <label className="font-label-md text-label-md text-on-surface">City</label>
                  <input required type="text" value={addressFormData.city} onChange={e => setAddressFormData({...addressFormData, city: e.target.value})} className="h-12 bg-surface-container-highest border border-outline-variant rounded-xl px-4 font-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="City" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-label-md text-label-md text-on-surface">State</label>
                  <input required type="text" value={addressFormData.state} onChange={e => setAddressFormData({...addressFormData, state: e.target.value})} className="h-12 bg-surface-container-highest border border-outline-variant rounded-xl px-4 font-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="State" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col space-y-1">
                  <label className="font-label-md text-label-md text-on-surface">Pincode</label>
                  <input required type="text" value={addressFormData.pincode} onChange={e => setAddressFormData({...addressFormData, pincode: e.target.value})} className="h-12 bg-surface-container-highest border border-outline-variant rounded-xl px-4 font-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="e.g. 400001" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-label-md text-label-md text-on-surface">Address Type</label>
                  <select required value={addressFormData.type} onChange={e => setAddressFormData({...addressFormData, type: e.target.value})} className="h-12 bg-surface-container-highest border border-outline-variant rounded-xl px-4 font-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none">
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 pb-safe border-t border-outline-variant/30 mt-auto">
                <button type="submit" disabled={isSavingAddress} className="w-full h-14 bg-primary text-on-primary rounded-full font-title-lg text-title-lg shadow-md hover:bg-primary-container hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSavingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}