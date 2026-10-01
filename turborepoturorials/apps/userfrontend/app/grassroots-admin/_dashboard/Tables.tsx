"use client";
import React, { useState } from 'react';
import { adminPath } from '../../../services/adminRoutes';
import {
  Order, OrderStatus, Quotation, QuotationStatus, SupportQuery, SupportStatus,
  formatDate, formatMoney, updateOrderStatus, updateQuotationStatus, updateSupportStatus,
} from '../../../services/adminDashboard';
import { useToast } from '../../../components/ToastProvider';
import { DataTable, DetailModal, EmptyRow, Panel, Skeleton, StatusBadge } from './ui';

const ORDER_STATUSES: OrderStatus[] = ['New', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const QUOTATION_STATUSES: QuotationStatus[] = ['New', 'In Discussion', 'Quote Sent', 'Accepted', 'Declined'];
const SUPPORT_STATUSES: SupportStatus[] = ['Open', 'In Progress', 'Resolved'];

const rowClass = 'hover:bg-surface-container-low/60 cursor-pointer transition-colors';
const cell = 'px-3 py-3 whitespace-nowrap';

const TableSkeleton = () => (
  <div className="px-5 pb-5 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
);

/* Keeps the popup and the status change logic the same for all three tables */
function useStatusEditor<T extends { id: string; status: S }, S extends string>(
  rows: T[], setRows: (rows: T[]) => void, save: (id: string, status: S) => Promise<void>, label: string,
) {
  const { triggerToast } = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const changeStatus = async (status: S) => {
    if (!openId) return;
    setBusy(true);
    try {
      await save(openId, status);
      setRows(rows.map((r) => (r.id === openId ? { ...r, status } : r)));
      triggerToast(`${label} ${openId} marked as ${status}`);
    } catch {
      triggerToast(`Could not update ${label.toLowerCase()} ${openId}`);
    } finally {
      setBusy(false);
    }
  };

  return { selected: rows.find((r) => r.id === openId), open: setOpenId, close: () => setOpenId(null), busy, changeStatus };
}

/* ---------- Recent orders ---------- */

export function RecentOrders({ orders, setOrders, loading }: { orders: Order[]; setOrders: (o: Order[]) => void; loading: boolean }) {
  const editor = useStatusEditor(orders, setOrders, updateOrderStatus, 'Order');
  const columns = ['Order ID', 'Customer', 'Date', 'Items', 'Amount', 'Status', 'Action'];

  return (
    <Panel title="Recent Orders" viewAllHref={adminPath('/orders')}>
      {loading ? <TableSkeleton /> : (
        <DataTable columns={columns} minWidth={640}>
          {orders.length === 0 ? <EmptyRow colSpan={columns.length} text="No orders in this period" /> : orders.map((o) => (
            <tr key={o.id} className={rowClass} onClick={() => editor.open(o.id)}>
              <td className={`${cell} font-medium text-on-surface`}>{o.id}</td>
              <td className={cell}>{o.customer}</td>
              <td className={cell}>{formatDate(o.date)}</td>
              <td className={`${cell} tabular-nums`}>{o.items}</td>
              <td className={`${cell} tabular-nums`}>{formatMoney(o.amount)}</td>
              <td className={cell}><StatusBadge status={o.status} /></td>
              <td className={cell}>
                <button onClick={(e) => { e.stopPropagation(); editor.open(o.id); }} className="h-8 px-4 rounded-lg border border-outline-variant text-primary text-[13px] font-medium hover:bg-primary/5">View</button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {editor.selected && (
        <DetailModal
          title={`Order ${editor.selected.id}`}
          subtitle={`Placed on ${formatDate(editor.selected.date)}`}
          fields={[
            { label: 'Customer', value: editor.selected.customer },
            { label: 'Email', value: editor.selected.email },
            { label: 'Ship to', value: editor.selected.address },
            { label: 'Vendor', value: editor.selected.vendor },
            { label: 'Items', value: editor.selected.items },
            { label: 'Amount', value: formatMoney(editor.selected.amount) },
            { label: 'Status', value: <StatusBadge status={editor.selected.status} /> },
          ]}
          status={editor.selected.status}
          statusOptions={ORDER_STATUSES}
          onStatusChange={editor.changeStatus}
          busy={editor.busy}
          onClose={editor.close}
        />
      )}
    </Panel>
  );
}

/* ---------- Quotations ---------- */

export function LatestQuotations({ quotations, setQuotations, loading }: { quotations: Quotation[]; setQuotations: (q: Quotation[]) => void; loading: boolean }) {
  const editor = useStatusEditor(quotations, setQuotations, updateQuotationStatus, 'Quotation');
  const columns = ['ID', 'Organization', 'Items', 'Status', 'Date'];

  return (
    <Panel title="Latest Quotation Requests (Bulk Orders)" viewAllHref={adminPath('/quotations')}>
      {loading ? <TableSkeleton /> : (
        <DataTable columns={columns} minWidth={480}>
          {quotations.length === 0 ? <EmptyRow colSpan={columns.length} text="No quotation requests" /> : quotations.map((q) => (
            <tr key={q.id} className={rowClass} onClick={() => editor.open(q.id)}>
              <td className={`${cell} font-medium text-on-surface`}>{q.id}</td>
              <td className={cell}>{q.organization}</td>
              <td className={`${cell} tabular-nums`}>{q.items}</td>
              <td className={cell}><StatusBadge status={q.status} /></td>
              <td className={cell}>{formatDate(q.date)}</td>
            </tr>
          ))}
        </DataTable>
      )}

      {editor.selected && (
        <DetailModal
          title={`Quotation ${editor.selected.id}`}
          subtitle={`Requested on ${formatDate(editor.selected.date)}`}
          fields={[
            { label: 'Organization', value: editor.selected.organization },
            { label: 'Contact', value: editor.selected.contact },
            { label: 'Items', value: editor.selected.items },
            { label: 'Request', value: editor.selected.note },
            { label: 'Status', value: <StatusBadge status={editor.selected.status} /> },
          ]}
          status={editor.selected.status}
          statusOptions={QUOTATION_STATUSES}
          onStatusChange={editor.changeStatus}
          busy={editor.busy}
          onClose={editor.close}
        />
      )}
    </Panel>
  );
}

/* ---------- Vendor support ---------- */

export function OpenSupportQueries({ queries, setQueries, loading }: { queries: SupportQuery[]; setQueries: (q: SupportQuery[]) => void; loading: boolean }) {
  const editor = useStatusEditor(queries, setQueries, updateSupportStatus, 'Query');
  const columns = ['ID', 'Vendor', 'Subject', 'Status', 'Date'];

  return (
    <Panel title="Open Vendor Support Queries" viewAllHref={adminPath('/vendor-support')}>
      {loading ? <TableSkeleton /> : (
        <DataTable columns={columns} minWidth={480}>
          {queries.length === 0 ? <EmptyRow colSpan={columns.length} text="No open support queries" /> : queries.map((s) => (
            <tr key={s.id} className={rowClass} onClick={() => editor.open(s.id)}>
              <td className={`${cell} font-medium text-on-surface`}>{s.id}</td>
              <td className={cell}>{s.vendor}</td>
              <td className={cell}>{s.subject}</td>
              <td className={cell}><StatusBadge status={s.status} /></td>
              <td className={cell}>{formatDate(s.date)}</td>
            </tr>
          ))}
        </DataTable>
      )}

      {editor.selected && (
        <DetailModal
          title={`Support query ${editor.selected.id}`}
          subtitle={`Opened on ${formatDate(editor.selected.date)}`}
          fields={[
            { label: 'Vendor', value: editor.selected.vendor },
            { label: 'Subject', value: editor.selected.subject },
            { label: 'Message', value: editor.selected.message },
            { label: 'Status', value: <StatusBadge status={editor.selected.status} /> },
          ]}
          status={editor.selected.status}
          statusOptions={SUPPORT_STATUSES}
          onStatusChange={editor.changeStatus}
          busy={editor.busy}
          onClose={editor.close}
        />
      )}
    </Panel>
  );
}
