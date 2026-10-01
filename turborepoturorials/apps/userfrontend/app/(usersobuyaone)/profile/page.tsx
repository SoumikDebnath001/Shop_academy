"use client";
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Icon from '@/components/Icon';
import Loader, { PageLoader } from '@/components/Loader';
import { useToast } from '@/components/ToastProvider';
import { api } from '@/services/api';
import { StorePage } from '../_components/StorePage';
import UserAvatar from '../_components/UserAvatar';
import ConfirmDialog from '../_components/ConfirmDialog';
import OrdersSection from '../_components/account/OrdersSection';
import AddressesSection from '../_components/account/AddressesSection';
import ProductCard from '../_components/catalog/ProductCard';
import { useCart } from '../_components/shop/CartProvider';
import { useWishlist } from '../_components/shop/WishlistProvider';

type Section = 'profile' | 'orders' | 'addresses' | 'saved' | 'help';

const MENU: { label: string; icon: string; key: Section; hint: string }[] = [
  { label: 'Profile', icon: 'person', key: 'profile', hint: 'Name, email, phone' },
  { label: 'Orders', icon: 'receipt_long', key: 'orders', hint: 'Track, buy again' },
  { label: 'Addresses', icon: 'pin_drop', key: 'addresses', hint: 'Delivery details' },
  { label: 'Saved Items', icon: 'favorite', key: 'saved', hint: 'Your wishlist' },
  { label: 'Help', icon: 'help', key: 'help', hint: 'Contact support' },
];

/**
 * Account page. Laptop: menu on the left, section on the right. Phone: menu tiles, tap one to open it (back arrow).
 * Profile edits refresh the signed-in user everywhere; Saved Items is the live wishlist; Orders can buy again.
 */
export default function UserProfile() {
  const { user, isLoading, logout, checkAuth } = useAuth();
  const router = useRouter();
  const { cart, openCart } = useCart();
  const { items: saved } = useWishlist();
  // null = phone menu; laptop always shows a section (Profile by default)
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const onOrderCount = useCallback((n: number) => setOrderCount(n), []);

  useEffect(() => {
    if (!isLoading && !user) router.push('/auth');
  }, [isLoading, user, router]);

  useEffect(() => {
    api.getOrders().then((o) => setOrderCount(o.length)).catch(() => setOrderCount(0));
  }, []);

  if (!user) return <PageLoader label="Loading profile" />;

  const shown: Section = activeSection ?? 'profile';
  const stats = [
    { label: 'Orders', value: orderCount ?? '–', go: 'orders' as Section },
    { label: 'Saved', value: saved?.length ?? '–', go: 'saved' as Section },
    { label: 'In cart', value: cart?.itemCount ?? '–', go: null },
  ];

  const confirmLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <StorePage>
      {/* Account header card */}
      <section className="relative overflow-hidden rounded-xl bg-linear-to-br from-[#7a1d2e] via-[#5a1624] to-[#2a0e14] text-white p-5 md:p-7 shadow-[0_20px_40px_-24px_rgba(122,29,46,0.7)]">
        <div aria-hidden className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#f2c037]/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <UserAvatar name={user.name} picture={user.picture} size={72} className="ring-4 ring-[#f2c037]/50 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.25em] uppercase text-[#f2c037]">My account</p>
              <h1 className="font-headline-lg text-[24px] md:text-[30px] font-bold leading-tight truncate">{user.name}</h1>
              <p className="text-[13px] text-white/70 truncate">{user.email}</p>
            </div>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:w-[300px]">
            {stats.map((s) => (
              <li key={s.label}>
                <button
                  type="button"
                  onClick={() => (s.go ? setActiveSection(s.go) : openCart())}
                  className="w-full rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 py-2.5 text-center transition-colors"
                >
                  <span className="block text-[20px] font-bold tabular-nums">{s.value}</span>
                  <span className="block text-[11px] text-white/70">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-5 md:mt-8 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 items-start">
        {/* Menu: phone tiles (hidden while a section is open), laptop sidebar */}
        <nav aria-label="Account" className={`${activeSection ? 'hidden lg:block' : ''} lg:sticky lg:top-[94px]`}>
          <ul className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-1.5">
            {MENU.map((item) => {
              const current = shown === item.key;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                    aria-current={current ? 'page' : undefined}
                    className={`group w-full flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-3 rounded-lg p-4 lg:px-3.5 lg:py-3 text-center lg:text-left border transition-all duration-300 ease-obuya ${
                      // one laptop background per state (two conflicting lg:bg-* classes let the transparent one win)
                      current ? 'lg:bg-obuya-maroon lg:text-white lg:border-obuya-maroon' : 'lg:bg-transparent lg:border-transparent lg:hover:bg-obuya-panel'
                    } bg-obuya-panel text-obuya-ink border-obuya-line/30 active:scale-[0.98]`}
                  >
                    <span className={`w-11 h-11 lg:w-9 lg:h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${current ? 'bg-obuya-gold/15 text-obuya-gold lg:bg-white/15 lg:text-[#f2c037]' : 'bg-obuya-gold/15 text-obuya-gold'}`}>
                      <Icon name={item.icon} size={21} filled={current} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-semibold">{item.label}</span>
                      <span className={`block text-[11px] ${current ? 'text-obuya-muted lg:text-white/70' : 'text-obuya-muted'}`}>{item.hint}</span>
                    </span>
                    <span className="hidden lg:flex opacity-60"><Icon name="chevron_right" size={18} /></span>
                  </button>
                </li>
              );
            })}
            <li className="col-span-2 lg:col-span-1 lg:mt-3 lg:pt-3 lg:border-t lg:border-obuya-line/40">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-center lg:justify-start gap-3 rounded-lg p-3.5 lg:px-3.5 lg:py-3 border border-obuya-maroon/30 lg:border-transparent text-obuya-maroon hover:bg-obuya-maroon/10 transition-colors"
              >
                <Icon name="logout" size={20} /> <span className="text-[14px] font-semibold">Sign Out</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Section */}
        <div className={activeSection ? '' : 'hidden lg:block'}>
          <div className="flex items-center gap-2 mb-4 md:mb-5">
            <button type="button" onClick={() => setActiveSection(null)} aria-label="Back to account menu" className="lg:hidden w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-obuya-ink/5">
              <Icon name="arrow_back" size={22} />
            </button>
            <h2 className="font-headline-lg text-[24px] md:text-[28px] font-bold text-obuya-ink">{MENU.find((m) => m.key === shown)?.label}</h2>
          </div>

          <div key={shown} className="obuya-fade-up">
            {shown === 'profile' && <ProfileDetails onSaved={checkAuth} />}
            {shown === 'orders' && <OrdersSection onCount={onOrderCount} />}
            {shown === 'addresses' && <AddressesSection />}
            {shown === 'saved' && <SavedItems />}
            <HelpSection activeSection={shown} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        icon="logout"
        title="Sign out?"
        message="You can sign back in any time with Google. Your cart and wishlist stay on this device."
        confirmLabel="Sign out"
        danger
        onConfirm={confirmLogout}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </StorePage>
  );
}

function ProfileDetails({ onSaved }: { onSaved: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { triggerToast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (!user) return null;

  const startEdit = () => {
    setFormData({ name: user.name || '', phone: user.phone || '' });
    setEditMode(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return triggerToast('Please enter your name');
    setIsSaving(true);
    try {
      await api.updateProfile({ name: formData.name.trim(), phone: formData.phone.trim() });
      onSaved(); // refresh the signed-in user (header, this page)
      setEditMode(false);
      triggerToast('Profile updated');
    } catch {
      triggerToast('Could not save your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      await logout();
      router.replace('/');
    } catch {
      triggerToast('Could not delete your account');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const input = 'h-11 w-full rounded-md border border-obuya-line/60 bg-obuya-bg px-3 text-[14px] text-obuya-ink focus:outline-none focus:border-obuya-gold';
  const rows = [
    { label: 'Name', value: user.name, icon: 'badge' },
    { label: 'Email', value: user.email, icon: 'mail' },
    { label: 'Phone', value: user.phone || 'Not added yet', icon: 'call', muted: !user.phone },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-obuya-panel border border-obuya-line/30 border-t-2 border-t-obuya-gold p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-obuya-gold">Personal details</p>
          {!editMode && (
            <button type="button" onClick={startEdit} className="h-9 px-3 flex items-center gap-1.5 rounded-md border border-obuya-line text-[13px] font-medium text-obuya-ink hover:border-obuya-gold">
              <Icon name="edit" size={17} /> Edit
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={save} className="space-y-3 pt-2">
            <label className="block text-[12px] font-medium text-obuya-muted">
              Name
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} autoComplete="name" className={`${input} mt-1`} />
            </label>
            <label className="block text-[12px] font-medium text-obuya-muted">
              Email (from your Google account)
              <input value={user.email} disabled className={`${input} mt-1 opacity-60 cursor-not-allowed`} />
            </label>
            <label className="block text-[12px] font-medium text-obuya-muted">
              Phone
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} autoComplete="tel" placeholder="+254 7XX XXX XXX" className={`${input} mt-1`} />
            </label>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button type="button" onClick={() => setEditMode(false)} className="h-11 rounded-md border border-obuya-line text-[14px] font-medium text-obuya-ink">Cancel</button>
              <button type="submit" disabled={isSaving} className="h-11 rounded-md bg-obuya-gold text-white text-[14px] font-semibold disabled:opacity-60">
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        ) : (
          <dl className="divide-y divide-obuya-line/30">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-3 py-3.5">
                <Icon name={r.icon} size={20} className="text-obuya-gold shrink-0" />
                <dt className="w-16 text-[12px] uppercase tracking-wider text-obuya-muted">{r.label}</dt>
                <dd className={`flex-1 min-w-0 truncate text-[14px] font-medium ${r.muted ? 'text-obuya-muted italic' : 'text-obuya-ink'}`}>{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="rounded-lg border border-obuya-maroon/30 bg-obuya-maroon/5 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-obuya-ink">Delete account</p>
          <p className="text-[12px] text-obuya-muted">Permanently removes your account, addresses and order history.</p>
        </div>
        <button type="button" onClick={() => setShowDeleteConfirm(true)} className="h-10 px-4 rounded-md border border-obuya-maroon text-obuya-maroon text-[13px] font-semibold hover:bg-obuya-maroon hover:text-white transition-colors">
          Delete account
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        icon="warning"
        title="Delete your account?"
        message="This permanently deletes your account and cannot be undone."
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={deleteAccount}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

/** Live wishlist (same data as /wishlist and every heart on the site). */
function SavedItems() {
  const { items } = useWishlist();
  if (!items) return <Loader label="Loading saved items" size={88} className="py-16" />;
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-obuya-line/60 py-14 px-6 text-center">
        <Icon name="favorite" size={44} weight={200} className="text-obuya-muted" />
        <p className="mt-2 text-[16px] font-semibold text-obuya-ink">No saved items yet</p>
        <p className="mt-1 text-[13px] text-obuya-muted">Tap the heart on any product to save it.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/sports" className="h-10 px-5 inline-flex items-center rounded-md bg-obuya-gold text-white text-[14px] font-semibold">Browse Sports</Link>
          <Link href="/apparels" className="h-10 px-5 inline-flex items-center rounded-md border border-obuya-line text-obuya-ink text-[14px] font-semibold">Browse Apparel</Link>
        </div>
      </div>
    );
  }
  return (
    <div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 md:gap-x-4 gap-y-6">
        {items.slice(0, 6).map((w) => (
          <li key={w.product.id}><ProductCard product={w.product} /></li>
        ))}
      </ul>
      <Link href="/wishlist" className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-obuya-gold hover:underline">
        {items.length > 6 ? `See all ${items.length} saved items` : 'Open your wishlist'} <Icon name="arrow_forward" size={18} />
      </Link>
    </div>
  );
}

/** Help section: kept exactly as provided (owner asked not to change it). */
function HelpSection({ activeSection }: { activeSection: Section }) {
  return (
    <>
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
    </>
  );
}
