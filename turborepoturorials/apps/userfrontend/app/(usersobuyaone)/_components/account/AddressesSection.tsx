'use client';
import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import Loader from '@/components/Loader';
import { useToast } from '@/components/ToastProvider';
import { api } from '@/services/api';
import type { Address, AddressInput } from '@/services/catalog.types';
import ConfirmDialog from '../ConfirmDialog';
import { useOverlay } from '../useOverlay';

const TYPE_ICON: Record<Address['type'], string> = { home: 'home', work: 'work', other: 'location_on' };
const EMPTY: AddressInput = {
  fullName: '', phone: '', addressLine1: '', addressLine2: '', landmark: '', city: '', state: '', pincode: '', country: 'Kenya', type: 'home',
};

/** Saved delivery addresses (real backend): add, edit, set default, delete. */
export default function AddressesSection() {
  const { triggerToast } = useToast();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.getAddresses();
      setAddresses(Array.isArray(res) ? res : []);
    } catch {
      setAddresses([]);
      triggerToast('Could not load your addresses');
    }
  }, [triggerToast]);

  // First load (state is set after the request resolves, never synchronously in the effect).
  useEffect(() => {
    let alive = true;
    api.getAddresses()
      .then((res) => alive && setAddresses(Array.isArray(res) ? res : []))
      .catch(() => alive && setAddresses([]));
    return () => { alive = false; };
  }, []);

  const act = async (task: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await task();
      await load();
      triggerToast(done);
      return true;
    } catch (e) {
      triggerToast((e as Error).message || 'Something went wrong');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async (data: AddressInput) => {
    const ok = editing === 'new'
      ? await act(() => api.createAddress(data), 'Address saved')
      : editing && (await act(() => api.updateAddress(editing._id, data), 'Address updated'));
    if (ok) setEditing(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-obuya-muted">Used at checkout. Your default is picked first.</p>
        <button type="button" onClick={() => setEditing('new')} className="h-10 px-4 flex items-center gap-1.5 rounded-md bg-obuya-gold text-white text-[13px] font-semibold hover:brightness-95 shrink-0">
          <Icon name="add" size={18} /> Add new
        </button>
      </div>

      {!addresses ? (
        <Loader label="Loading addresses" size={88} className="py-16" />
      ) : !addresses.length ? (
        <div className="rounded-lg border border-dashed border-obuya-line/60 py-14 px-6 text-center">
          <Icon name="location_off" size={44} weight={200} className="text-obuya-muted" />
          <p className="mt-2 text-[16px] font-semibold text-obuya-ink">No saved addresses</p>
          <p className="mt-1 text-[13px] text-obuya-muted">Add one to speed up checkout.</p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3 md:gap-4">
          {addresses.map((a) => (
            <li key={a._id} className={`obuya-fade-up relative rounded-lg bg-obuya-panel border p-4 md:p-5 flex flex-col ${a.isDefault ? 'border-obuya-gold/70' : 'border-obuya-line/30'}`}>
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-full bg-obuya-maroon/10 text-obuya-maroon flex items-center justify-center">
                  <Icon name={TYPE_ICON[a.type] ?? 'location_on'} size={19} />
                </span>
                <span className="text-[13px] font-semibold capitalize text-obuya-ink">{a.type}</span>
                {a.isDefault && <span className="ml-auto px-2 py-0.5 rounded-full bg-obuya-gold text-white text-[11px] font-semibold">Default</span>}
              </div>
              <p className="mt-3 text-[15px] font-semibold text-obuya-ink">{a.fullName}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-obuya-muted">
                {[a.addressLine1, a.addressLine2, a.landmark, a.city, a.state, a.pincode, a.country].filter(Boolean).join(', ')}
              </p>
              <p className="mt-1 text-[13px] text-obuya-muted">{a.phone}</p>
              <div className="mt-auto pt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-medium">
                {!a.isDefault && (
                  <button type="button" disabled={busy} onClick={() => act(() => api.setDefaultAddress(a._id), 'Default address updated')} className="text-obuya-gold hover:underline">
                    Set as default
                  </button>
                )}
                <button type="button" disabled={busy} onClick={() => setEditing(a)} className="text-obuya-ink hover:text-obuya-gold">Edit</button>
                <button type="button" disabled={busy} onClick={() => setDeleting(a)} className="text-obuya-maroon hover:underline">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && <AddressForm initial={editing === 'new' ? EMPTY : editing} busy={busy} onSave={save} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        icon="delete"
        title="Delete this address?"
        message={deleting ? `${deleting.fullName}, ${deleting.addressLine1}, ${deleting.city}` : ''}
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={async () => { if (deleting) await act(() => api.deleteAddress(deleting._id), 'Address deleted'); setDeleting(null); }}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function AddressForm({ initial, busy, onSave, onClose }: { initial: AddressInput; busy: boolean; onSave: (a: AddressInput) => void; onClose: () => void }) {
  const [form, setForm] = useState<AddressInput>({
    fullName: initial.fullName, phone: initial.phone, addressLine1: initial.addressLine1, addressLine2: initial.addressLine2 ?? '',
    landmark: initial.landmark ?? '', city: initial.city, state: initial.state, pincode: initial.pincode, country: initial.country || 'Kenya', type: initial.type,
  });
  useOverlay(true, onClose);
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const input = 'h-11 w-full rounded-md border border-obuya-line/60 bg-obuya-bg px-3 text-[14px] text-obuya-ink placeholder:text-obuya-muted/60 focus:outline-none focus:border-obuya-gold';
  const field = (label: string, k: keyof AddressInput, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="flex flex-col gap-1 text-[12px] font-medium text-obuya-muted">
      {label}
      <input value={form[k] as string} onChange={set(k)} className={input} {...props} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" aria-label="Address" className="obuya-fade-up relative w-full max-w-[520px] max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-xl bg-obuya-bg border border-obuya-line/40 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-obuya-line/40">
          <h3 className="font-headline-lg text-[20px] font-bold text-obuya-ink">{initial.fullName ? 'Edit address' : 'Add address'}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-obuya-ink/5"><Icon name="close" size={22} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="flex-1 overflow-y-auto px-5 py-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">{field('Full name', 'fullName', { required: true, autoComplete: 'name', placeholder: 'Jane Wanjiku' })}</div>
          <div className="col-span-2">{field('Phone', 'phone', { required: true, type: 'tel', autoComplete: 'tel', placeholder: '+254 7XX XXX XXX' })}</div>
          <div className="col-span-2">{field('Address line 1', 'addressLine1', { required: true, autoComplete: 'address-line1', placeholder: 'House / building, street' })}</div>
          <div className="col-span-2">{field('Address line 2 (optional)', 'addressLine2', { autoComplete: 'address-line2', placeholder: 'Estate, area' })}</div>
          {field('Landmark (optional)', 'landmark', { placeholder: 'Near…' })}
          {field('Town / City', 'city', { required: true, autoComplete: 'address-level2' })}
          {field('County / State', 'state', { required: true, autoComplete: 'address-level1' })}
          {field('Postal code', 'pincode', { required: true, autoComplete: 'postal-code' })}
          {field('Country', 'country', { required: true, autoComplete: 'country-name' })}
          <label className="flex flex-col gap-1 text-[12px] font-medium text-obuya-muted">
            Type
            <select value={form.type} onChange={set('type')} className={input}>
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </label>
          <div className="col-span-2 pt-2 pb-[env(safe-area-inset-bottom)]">
            <button type="submit" disabled={busy} className="w-full h-12 rounded-md bg-obuya-gold text-white text-[15px] font-semibold hover:brightness-95 disabled:opacity-60">
              {busy ? 'Saving…' : 'Save address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
