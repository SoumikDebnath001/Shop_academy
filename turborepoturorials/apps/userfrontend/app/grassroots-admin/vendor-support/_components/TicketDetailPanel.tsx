"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { adminPath } from '../../../../services/adminRoutes';
import {
  NewTicket, SUPPORT_VENDORS, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, Ticket, TicketAttachment, TicketPriority, TicketStatus,
} from '../../../../services/adminSupport';
import { Skeleton, StatusBadge } from '../../_dashboard/ui';
import { VendorLogo } from '../../vendors/_components/VendorDetailPanel';

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
export const formatDay = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const MAX_FILE_MB = 10;
const isImage = (name: string) => /\.(png|jpe?g|gif|webp)$/i.test(name);
const fileIcon = (name: string) => (isImage(name) ? 'image' : /\.(xlsx?|csv)$/i.test(name) ? 'table_chart' : /\.pdf$/i.test(name) ? 'picture_as_pdf' : 'description');
const sizeText = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`);

const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

/* Real files (added in this visit) download as they are. Demo files have no content yet,
   so a clearly labelled placeholder is downloaded instead — the backend will send the real file. */
export function downloadAttachment(file: TicketAttachment, ticketId: string) {
  if (file.url) {
    const a = document.createElement('a');
    a.href = file.url; a.download = file.name; a.click();
    return;
  }
  if (isImage(file.name)) {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 450;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f1f5ee'; ctx.fillRect(0, 0, 800, 450);
    ctx.fillStyle = '#0f3b24'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(file.name, 400, 200);
    ctx.font = '20px sans-serif'; ctx.fillStyle = '#414941';
    ctx.fillText(`Demo attachment for ticket ${ticketId}`, 400, 245);
    ctx.fillText('The real image will come from the backend.', 400, 280);
    canvas.toBlob((b) => b && saveBlob(b, file.name.replace(/\.\w+$/, '.png')));
    return;
  }
  saveBlob(new Blob([`Demo attachment: ${file.name}\nTicket: ${ticketId}\n\nThe real file will be downloaded from the backend once it is connected.\n`], { type: 'text/plain' }), `${file.name} (demo).txt`);
}

/* ---------- New ticket popup ---------- */

export function NewTicketDialog({ busy, onCancel, onSave }: { busy: boolean; onCancel: () => void; onSave: (t: NewTicket) => void }) {
  const [form, setForm] = useState<NewTicket>({ vendor: SUPPORT_VENDORS[0].name, category: 'Products', priority: 'Medium', subject: '', description: '' });
  const [touched, setTouched] = useState(false);
  const valid = form.subject.trim().length > 0 && form.description.trim().length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const cls = 'mt-1 w-full h-11 px-3 rounded-xl border border-outline-variant text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <form
        role="dialog" aria-modal="true" aria-label="New ticket" noValidate
        onSubmit={(e) => { e.preventDefault(); setTouched(true); if (valid) onSave({ ...form, subject: form.subject.trim(), description: form.description.trim() }); }}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 pb-safe"
      >
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3 className="text-[18px] font-semibold text-on-surface">New Ticket</h3>
          <button type="button" onClick={onCancel} aria-label="Close" className="w-9 h-9 -mr-2 -mt-1 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"><span className="material-symbols-outlined text-[22px]">close</span></button>
        </div>
        <p className="text-[13px] text-on-surface-variant mb-4">Open a ticket for a vendor, for example after a phone call.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] font-medium text-on-surface">
          <label className="sm:col-span-3">Vendor
            <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className={cls}>{SUPPORT_VENDORS.map((v) => <option key={v.name}>{v.name}</option>)}</select>
          </label>
          <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as NewTicket['category'] })} className={cls}>{TICKET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })} className={cls}>{TICKET_PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <span className="hidden sm:block" />
          <label className="sm:col-span-3">Subject
            <input autoFocus value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={`${cls} ${touched && !form.subject.trim() ? 'border-error' : ''}`} />
          </label>
          <label className="sm:col-span-3">Description
            <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`mt-1 w-full rounded-xl border p-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none ${touched && !form.description.trim() ? 'border-error' : 'border-outline-variant'}`} />
          </label>
        </div>
        {touched && !valid && <p className="mt-3 text-[13px] text-error">Add a subject and a description.</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onCancel} className="h-11 px-4 rounded-xl text-[14px] font-medium text-on-surface-variant hover:bg-surface-container-low">Cancel</button>
          <button type="submit" disabled={busy} className="h-11 px-5 rounded-xl bg-brand-red text-white text-[14px] font-medium disabled:opacity-50">{busy ? 'Saving…' : 'Create ticket'}</button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Panel ---------- */

const AttachmentRow = ({ file, onDownload }: { file: TicketAttachment; onDownload: () => void }) => (
  <li className="flex items-center gap-3 p-2.5 rounded-xl border border-outline-variant/60 bg-white">
    <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isImage(file.name) ? 'bg-slate-100 text-slate-700' : 'bg-green-50 text-green-700'}`}>
      <span className="material-symbols-outlined text-[22px]">{fileIcon(file.name)}</span>
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] text-on-surface truncate">{file.name}</span>
      <span className="block text-[12px] text-on-surface-variant">{sizeText(file.sizeKb)}</span>
    </span>
    <button onClick={onDownload} aria-label={`Download ${file.name}`} className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-high">
      <span className="material-symbols-outlined text-[22px]">download</span>
    </button>
  </li>
);

export default function TicketDetailPanel({ ticket, loading, error, busy, onClose, onStatus, onPriority, onAssign, onReply }: {
  ticket: Ticket | null; loading: boolean; error: string; busy: boolean;
  onClose: () => void; onStatus: (s: TicketStatus) => void; onPriority: (p: TicketPriority) => void;
  onAssign: (who: string | null) => void; onReply: (text: string, files: TicketAttachment[]) => Promise<boolean>;
}) {
  const [reply, setReply] = useState('');
  const [files, setFiles] = useState<TicketAttachment[]>([]);
  const [fileError, setFileError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role=dialog],[role=alertdialog]')) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Keep the newest message in view
  const messageCount = ticket?.messages.length ?? 0;
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [messageCount]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = [...list];
    const tooBig = picked.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    setFileError(tooBig.length ? `${tooBig.map((f) => f.name).join(', ')} is larger than ${MAX_FILE_MB} MB` : '');
    setFiles((cur) => [...cur, ...picked.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024).map((f) => ({ name: f.name, sizeKb: f.size / 1024, url: URL.createObjectURL(f) }))]);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() && !files.length) return;
    const ok = await onReply(reply.trim(), files);
    if (ok) { setReply(''); setFiles([]); setFileError(''); }
  };

  const t = ticket;
  const selectCls = 'h-8 pl-2 pr-7 rounded-lg border border-outline-variant bg-white text-[13px]';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        {t ? (
          <div>
            <p className="flex items-center gap-2 text-[20px] font-bold text-on-surface">{t.id} <StatusBadge status={t.status} /></p>
            <p className="text-[13px] text-on-surface-variant mt-0.5">Created on {formatDateTime(t.createdAt)}</p>
          </div>
        ) : <Skeleton className="h-12 w-48" />}
        <button onClick={onClose} aria-label="Close ticket" className="w-9 h-9 -mr-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high shrink-0">
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {error ? (
          <p className="rounded-2xl bg-red-50 border border-red-200 p-4 text-[13px] text-error">{error}</p>
        ) : !t || loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-6">
            <section className="pt-4 border-t border-outline-variant/50">
              <div className="flex items-start gap-3">
                <VendorLogo name={t.vendor.name} size="lg" />
                <div className="min-w-0 text-[13px]">
                  <p className="text-[15px] font-semibold text-on-surface">{t.vendor.name}</p>
                  <a href={`mailto:${t.vendor.email}`} className="block text-on-surface-variant hover:text-primary truncate">{t.vendor.email}</a>
                  <p className="text-on-surface-variant">{t.vendor.phone}</p>
                  <Link href={adminPath(`/vendors?q=${encodeURIComponent(t.vendor.name)}`)} className="inline-flex items-center gap-1 mt-1 font-medium text-blue-700 hover:underline">View Vendor Profile <span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link>
                </div>
              </div>

              <dl className="grid grid-cols-[minmax(0,7rem)_1fr] items-center gap-x-4 gap-y-2.5 text-[13px] mt-4">
                <dt className="text-on-surface-variant">Category</dt><dd className="text-on-surface">{t.category}</dd>
                <dt className="text-on-surface-variant">Priority</dt>
                <dd className="flex items-center gap-2">
                  <StatusBadge status={t.priority} />
                  <select aria-label="Change priority" value={t.priority} disabled={busy} onChange={(e) => onPriority(e.target.value as TicketPriority)} className={selectCls}>
                    {TICKET_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </dd>
                <dt className="text-on-surface-variant">Status</dt>
                <dd className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <select aria-label="Change status" value={t.status} disabled={busy} onChange={(e) => onStatus(e.target.value as TicketStatus)} className={selectCls}>
                    {TICKET_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </dd>
                <dt className="text-on-surface-variant">Assigned To</dt>
                <dd className="flex items-center gap-2">
                  {t.assignedTo ? (
                    <>
                      <span className="w-6 h-6 rounded-full bg-brand-black text-white text-[11px] font-semibold flex items-center justify-center">{t.assignedTo[0]}</span>
                      <span className="text-on-surface">{t.assignedTo}</span>
                      <button disabled={busy} onClick={() => onAssign(null)} className="text-[12px] text-on-surface-variant hover:text-error hover:underline">Unassign</button>
                    </>
                  ) : (
                    <button disabled={busy} onClick={() => onAssign('Admin')} className="text-[13px] font-medium text-primary hover:underline">Assign to me</button>
                  )}
                </dd>
                <dt className="text-on-surface-variant">Last Updated</dt><dd className="text-on-surface">{formatDateTime(t.updatedAt)}</dd>
              </dl>
            </section>

            <section className="pt-5 border-t border-outline-variant/50 text-[13px]">
              <h3 className="text-[15px] font-semibold text-on-surface">Subject</h3>
              <p className="font-semibold text-on-surface mt-1">{t.subject}</p>
              <h3 className="text-[15px] font-semibold text-on-surface mt-4">Description</h3>
              <p className="text-on-surface mt-1 whitespace-pre-line leading-relaxed">{t.description}</p>
            </section>

            {t.attachments.length > 0 && (
              <section className="pt-5 border-t border-outline-variant/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-semibold text-on-surface">Attachments ({t.attachments.length})</h3>
                  {t.attachments.length > 1 && (
                    <button onClick={() => t.attachments.forEach((f, i) => setTimeout(() => downloadAttachment(f, t.id), i * 400))} className="text-[13px] font-medium text-blue-700 hover:underline">Download All</button>
                  )}
                </div>
                <ul className="space-y-2">{t.attachments.map((f) => <AttachmentRow key={f.name} file={f} onDownload={() => downloadAttachment(f, t.id)} />)}</ul>
              </section>
            )}

            <section className="pt-5 border-t border-outline-variant/50">
              <h3 className="text-[15px] font-semibold text-on-surface mb-3">Conversation</h3>
              <ol className="space-y-4">
                {t.messages.map((m, i) => (
                  <li key={i} className="flex gap-3">
                    {m.from === 'vendor'
                      ? <VendorLogo name={m.author} />
                      : <span className="w-9 h-9 rounded-lg bg-brand-green-dark text-brand-gold text-[13px] font-bold flex items-center justify-center shrink-0" aria-hidden="true">A</span>}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px]"><span className="font-semibold text-on-surface">{m.author}</span> <span className="text-[12px] text-on-surface-variant">{formatDateTime(m.at)}</span></p>
                      <p className={`mt-1 text-[13px] whitespace-pre-line rounded-xl px-3 py-2 ${m.from === 'admin' ? 'bg-primary/5 text-on-surface' : 'text-on-surface'}`}>{m.text || <em className="text-on-surface-variant">Sent files</em>}</p>
                      {m.attachments.length > 0 && m.from === 'admin' && (
                        <ul className="mt-2 space-y-2">{m.attachments.map((f, j) => <AttachmentRow key={j} file={f} onDownload={() => downloadAttachment(f, t.id)} />)}</ul>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              <div ref={endRef} />
            </section>
          </div>
        )}
      </div>

      {/* Reply box */}
      {t && !error && (
        <form onSubmit={send} className="px-5 py-3 border-t border-outline-variant/50 bg-surface pb-safe">
          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2 mb-2">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5 h-8 pl-2.5 pr-1 rounded-lg bg-surface-container-high text-[12px] text-on-surface">
                  <span className="material-symbols-outlined text-[16px]">{fileIcon(f.name)}</span>
                  <span className="max-w-[140px] truncate">{f.name}</span>
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface-container-highest">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {fileError && <p className="text-[12px] text-error mb-2">{fileError}</p>}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileInput.current?.click()} aria-label="Attach files" className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high shrink-0">
              <span className="material-symbols-outlined text-[22px]">attach_file</span>
            </button>
            <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={t.status === 'Closed' ? 'Reply to reopen the conversation…' : 'Type your reply...'}
              aria-label="Reply to vendor"
              className="flex-1 min-w-0 h-11 px-3 rounded-xl border border-outline-variant bg-white text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button type="submit" disabled={busy || (!reply.trim() && !files.length)} className="h-11 px-4 rounded-xl bg-brand-red text-white text-[14px] font-medium disabled:opacity-40 shrink-0">
              {busy ? 'Sending…' : 'Send Reply'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
