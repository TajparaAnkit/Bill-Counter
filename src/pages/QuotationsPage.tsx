import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { BillForm, BillDraft } from '../components/Bills/BillForm';
import { InvoicePaper } from '../components/Bills/InvoicePaper';
import { useConfirm } from '../components/ui/confirm';
import { useAuth } from '../hooks/useAuth';
import { useFeature } from '../hooks/useAccount';
import { useInvoiceTemplate } from '../hooks/useInvoiceTemplate';
import { useToast } from '../hooks/useToast';
import { addQuotation, deleteQuotation, getBusinessProfile, getCustomers, getProducts, getQuotations, updateQuotation } from '../services/db';
import { Customer, Product, Quotation, UserProfile } from '../types';
import { formatISODate, todayISO } from '../utils/tax';
import { generateInvoicePDF, generateInvoicePdfFile } from '../utils/pdf';
import { sharePdfOnWhatsApp } from '../utils/share';
import { Pagination } from '../components/ui/Pagination';
import {
  CountBadge,
  IconAction,
  Initials,
  PageHeader,
  SearchInput,
  StatusPill,
  TableCard,
  TableEmpty,
  tableCls,
  tdCls,
  thCls,
  theadRowCls,
  trCls,
} from '../components/ui/Table';

const money = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const isExpired = (q: Quotation) => !q.convertedBillId && !!q.dueDate && q.dueDate < todayISO();

const QuoteStatus: React.FC<{ q: Quotation }> = ({ q }) =>
  q.convertedBillId ? (
    <StatusPill tone="green" icon="fa-solid fa-check">
      Converted · {q.convertedBillNo}
    </StatusPill>
  ) : isExpired(q) ? (
    <StatusPill tone="slate">Expired</StatusPill>
  ) : (
    <StatusPill tone="brandSoft">Open</StatusPill>
  );

export const QuotationsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const enabled = useFeature('quotations');
  const [searchParams, setSearchParams] = useSearchParams();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const template = useInvoiceTemplate(profile);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(!!searchParams.get('new'));
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [viewing, setViewing] = useState<Quotation | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('new')) {
      setEditing(null);
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!user || !enabled) return;
    (async () => {
      try {
        setIsLoading(true);
        const [q, p, c, prof] = await Promise.all([
          getQuotations(user.uid),
          getProducts(user.uid),
          getCustomers(user.uid).catch(() => [] as Customer[]),
          getBusinessProfile(user.uid),
        ]);
        setQuotations(q);
        setProducts(p);
        setCustomers(c);
        setProfile(prof);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load quotations');
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, enabled]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return t ? quotations.filter((q) => `${q.billNo} ${q.customerName} ${q.customerPhone || ''}`.toLowerCase().includes(t)) : quotations;
  }, [quotations, search]);

  useEffect(() => setPage(1), [search, quotations.length]);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSave = async (draft: BillDraft) => {
    if (!user) return;
    try {
      if (editing) {
        const saved = await updateQuotation(editing, draft);
        setQuotations((qs) => qs.map((q) => (q.id === saved.id ? saved : q)));
        toast.success('Quotation updated');
        setViewing(saved);
      } else {
        const saved = await addQuotation(user.uid, draft);
        setQuotations((qs) => [saved, ...qs]);
        toast.success('Quotation saved');
        setViewing(saved);
      }
      closeForm();
    } catch (err) {
      toast.error('Failed to save quotation');
      throw err;
    }
  };

  const handleDelete = async (q: Quotation) => {
    const ok = await confirm({
      title: 'Delete Quotation',
      message: `Delete quotation "${q.billNo}" for ${q.customerName}?${q.convertedBillNo ? ` Invoice ${q.convertedBillNo} made from it is not affected.` : ''}`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteQuotation(q.id);
      setQuotations((qs) => qs.filter((x) => x.id !== q.id));
      if (viewing?.id === q.id) setViewing(null);
      toast.success('Quotation deleted');
    } catch {
      toast.error('Failed to delete quotation');
    }
  };

  const convert = (q: Quotation) => navigate(`/bills?fromQuote=${q.id}`);

  const download = async (q: Quotation) => {
    try {
      setBusyId(q.id);
      await generateInvoicePDF(q, profile, `Quotation_${q.billNo}.pdf`, template);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setBusyId(null);
    }
  };

  const share = async (q: Quotation) => {
    try {
      setBusyId(q.id);
      const file = await generateInvoicePdfFile(q, profile, `Quotation_${q.billNo}.pdf`, template);
      const res = await sharePdfOnWhatsApp(file, q.customerPhone || q.billTo?.phone);
      if (res === 'downloaded') toast.info('Downloaded the PDF and opened WhatsApp — attach the file in the chat.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare the quotation PDF');
    } finally {
      setBusyId(null);
    }
  };

  if (!enabled) {
    return (
      <Layout>
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-6 py-16 flex flex-col items-center text-center space-y-4">
          <FaIcon icon="fa-solid fa-lock" size={26} className="text-slate-300" />
          <p className="font-bold text-slate-600">Quotations are not included in your plan</p>
          <p className="text-sm text-slate-400 max-w-sm">Contact us to upgrade and send quotations that convert into invoices in one click.</p>
          <Link to="/dashboard" className="btn-primary text-sm">
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Layout>
      {formOpen && !isLoading ? (
        <BillForm
          key={editing?.id || 'new'}
          docType="quotation"
          userId={user?.uid || ''}
          products={products}
          customers={customers}
          profile={profile}
          existingBillNos={quotations.map((q) => q.billNo)}
          onSave={handleSave}
          onCancel={closeForm}
          initial={editing}
          editing={!!editing}
        />
      ) : (
        <>
          <PageHeader
            crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Quotations' }]}
            title="Quotations"
            subtitle="Send quotations / estimates and convert accepted ones into invoices."
            actions={
              <button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="btn-primary flex items-center gap-2 h-10 px-4 text-sm"
              >
                <FaIcon icon="fa-solid fa-plus" size={12} />
                Create Quotation
              </button>
            }
          />

          <TableCard
            title={
              <>
                All quotations <CountBadge n={filtered.length} />
              </>
            }
            toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search party or quotation no.…" className="sm:w-72" />}
          >
            {/* Phones: one card per quotation */}
            <ul className="lg:hidden divide-y divide-slate-100 border-t border-slate-100">
              {isLoading ? (
                <li className="py-12 text-center">
                  <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-brand-500" size={24} />
                </li>
              ) : paged.length === 0 ? (
                <li className="px-5 py-12 text-center text-sm text-slate-500">{search ? 'No matching quotations' : 'No quotations yet'}</li>
              ) : (
                paged.map((q) => (
                  <li key={q.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={() => setViewing(q)} className="min-w-0 text-left cursor-pointer">
                        <span className="block font-mono text-[13px] font-semibold text-slate-900">{q.billNo}</span>
                        <span className="block font-semibold text-slate-800 truncate">{q.customerName}</span>
                        <span className="block text-xs text-slate-400">
                          {q.invoiceDate ? formatISODate(q.invoiceDate) : '—'}
                          {q.dueDate ? ` · valid till ${formatISODate(q.dueDate)}` : ''}
                        </span>
                      </button>
                      <div className="shrink-0 text-right space-y-1">
                        <p className="font-semibold text-slate-900 tabular-nums">{money(q.total)}</p>
                        <QuoteStatus q={q} />
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-end gap-0.5">
                      {!q.convertedBillId && (
                        <button type="button" onClick={() => convert(q)} className="mr-auto inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 cursor-pointer">
                          <FaIcon icon="fa-solid fa-file-invoice" size={12} />
                          Convert to Invoice
                        </button>
                      )}
                      <IconAction icon="fa-solid fa-download" title="Download PDF" busy={busyId === q.id} onClick={() => download(q)} />
                      <IconAction icon="fa-brands fa-whatsapp" title="Share on WhatsApp" tone="whatsapp" onClick={() => share(q)} />
                      {!q.convertedBillId && (
                        <IconAction
                          icon="fa-regular fa-pen-to-square"
                          title="Edit"
                          onClick={() => {
                            setEditing(q);
                            setFormOpen(true);
                          }}
                        />
                      )}
                      <IconAction icon="fa-regular fa-trash-can" title="Delete" tone="danger" onClick={() => handleDelete(q)} />
                    </div>
                  </li>
                ))
              )}
            </ul>

            <div className="hidden lg:block overflow-x-auto">
              <table className={tableCls}>
                <thead>
                  <tr className={theadRowCls}>
                    <th className={thCls}>Quotation</th>
                    <th className={thCls}>Customer</th>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Valid Till</th>
                    <th className={thCls}>Status</th>
                    <th className={`${thCls} text-right`}>Amount</th>
                    <th className={`${thCls} text-right`}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-brand-500" size={28} />
                      </td>
                    </tr>
                  ) : paged.length === 0 ? (
                    <TableEmpty
                      colSpan={7}
                      icon={search ? 'fa-solid fa-magnifying-glass' : 'fa-regular fa-file-lines'}
                      title={search ? 'No matching quotations' : 'No quotations yet'}
                      text={search ? 'Try a different party name or number.' : 'Create a quotation, share it, then convert it into an invoice when the customer agrees.'}
                    />
                  ) : (
                    paged.map((q) => (
                      <tr key={q.id} className={trCls}>
                        <td className={tdCls}>
                          <button type="button" onClick={() => setViewing(q)} className="font-mono text-[13px] font-semibold text-slate-900 hover:text-brand-700 whitespace-nowrap cursor-pointer">
                            {q.billNo}
                          </button>
                        </td>
                        <td className={tdCls}>
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <Initials name={q.customerName} size="sm" />
                            <span className="font-semibold text-slate-900 truncate">{q.customerName}</span>
                          </div>
                        </td>
                        <td className={`${tdCls} text-slate-600 whitespace-nowrap`}>{q.invoiceDate ? formatISODate(q.invoiceDate) : '—'}</td>
                        <td className={`${tdCls} text-slate-600 whitespace-nowrap`}>{q.dueDate ? formatISODate(q.dueDate) : '—'}</td>
                        <td className={tdCls}>
                          <QuoteStatus q={q} />
                        </td>
                        <td className={`${tdCls} text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap`}>{money(q.total)}</td>
                        <td className={`${tdCls} text-right`}>
                          <div className="flex items-center justify-end gap-0.5">
                            {!q.convertedBillId && <IconAction icon="fa-solid fa-file-invoice" title="Convert to Invoice" onClick={() => convert(q)} />}
                            <IconAction icon="fa-solid fa-download" title="Download PDF" busy={busyId === q.id} onClick={() => download(q)} />
                            <IconAction icon="fa-brands fa-whatsapp" title="Share on WhatsApp" tone="whatsapp" onClick={() => share(q)} />
                            {!q.convertedBillId && (
                              <IconAction
                                icon="fa-regular fa-pen-to-square"
                                title="Edit"
                                onClick={() => {
                                  setEditing(q);
                                  setFormOpen(true);
                                }}
                              />
                            )}
                            <IconAction icon="fa-regular fa-trash-can" title="Delete" tone="danger" onClick={() => handleDelete(q)} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
              itemLabel="quotations"
            />
          </TableCard>
        </>
      )}

      {viewing &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4" onClick={() => setViewing(null)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Quotation ${viewing.billNo}`}
              className="flex flex-col bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">Quotation: {viewing.billNo}</h2>
                  <QuoteStatus q={viewing} />
                </div>
                <div className="flex items-center gap-2">
                  {!viewing.convertedBillId && (
                    <button onClick={() => convert(viewing)} className="btn-primary flex items-center gap-2 text-sm py-1.5 px-3">
                      <FaIcon icon="fa-solid fa-file-invoice" size={14} />
                      Convert to Invoice
                    </button>
                  )}
                  <button onClick={() => download(viewing)} className="btn-secondary flex items-center gap-2 text-sm py-1.5 px-3" aria-label="Download PDF" title="Download PDF">
                    <FaIcon icon="fa-solid fa-file-arrow-down" size={14} />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full" aria-label="Close">
                    <FaIcon icon="fa-solid fa-xmark" size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-10 bg-slate-100 flex justify-center">
                <InvoicePaper bill={viewing} profile={profile} template={template} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </Layout>
  );
};
