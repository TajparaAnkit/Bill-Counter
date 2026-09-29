import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { CustomerFormModal } from '../components/Customers/CustomerFormModal';
import { useConfirm } from '../components/ui/confirm';
import { useAuth } from '../hooks/useAuth';
import { useFeature } from '../hooks/useAccount';
import { useToast } from '../hooks/useToast';
import { getBills, getBusinessProfile, getCustomers, addCustomer, updateCustomer, deleteCustomer, CustomerInput } from '../services/db';
import { Bill, Customer, UserProfile } from '../types';
import { isLiveBill } from '../utils/docs';
import { partyReminderUrl } from '../utils/reminder';
import { Pagination } from '../components/ui/Pagination';
import { buildLedger } from '../utils/ledger';
import {
  CountBadge,
  IconAction,
  Initials,
  PageHeader,
  SearchInput,
  SegmentedTabs,
  SortDir,
  SortTh,
  StatusPill,
  TableCard,
  TableEmpty,
  nextSort,
  tableCls,
  tdCls,
  thCls,
  theadRowCls,
  trCls,
} from '../components/ui/Table';

type TypeFilter = 'all' | 'customer' | 'supplier';
type SortKey = 'name' | 'balance';

const inr = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const statementAllowed = useFeature('partyStatement');
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [type, setType] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [statementEnabled, setStatementEnabled] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // `?new=1` (top-bar "Create" menu) opens the add form directly, then drops the param.
  useEffect(() => {
    if (searchParams.get('new')) {
      setEditing(null);
      setIsFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadCustomers = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setCustomers(await getCustomers(user.uid));
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadCustomers();
    getBusinessProfile(user.uid).then((p) => {
      setProfile(p);
      setStatementEnabled(statementAllowed && !!p?.partyStatementEnabled);
    });
    // Balances are a nice-to-have: the list still works if bills fail to load.
    getBills(user.uid)
      .then((b) => setBills(b.filter(isLiveBill)))
      .catch(() => setBills([]));
  }, [user]);

  const handleSubmit = async (data: CustomerInput) => {
    if (!user) return;
    try {
      if (editing) {
        await updateCustomer(editing.id, data);
        toast.success('Customer updated');
      } else {
        await addCustomer(user.uid, data);
        toast.success('Customer added');
      }
      loadCustomers();
    } catch (err) {
      toast.error('Failed to save customer');
      throw err;
    }
  };

  const handleDelete = async (customer: Customer) => {
    const ok = await confirm({
      title: 'Delete Customer',
      message: `Are you sure you want to permanently delete "${customer.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteCustomer(customer.id);
      toast.success('Customer deleted');
      loadCustomers();
    } catch (err) {
      toast.error('Failed to delete customer');
    }
  };

  // Party balance (opening + invoices − payments): + to collect, − to pay.
  const balances = useMemo(() => {
    const now = new Date();
    return new Map(customers.map((c) => [c.id, buildLedger(c, bills, null, now).closingBalance]));
  }, [customers, bills]);

  const counts = useMemo(
    () => ({
      all: customers.length,
      customer: customers.filter((c) => c.partyType !== 'supplier').length,
      supplier: customers.filter((c) => c.partyType === 'supplier').length,
    }),
    [customers]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = customers.filter((c) => {
      if (type === 'customer' && c.partyType === 'supplier') return false;
      if (type === 'supplier' && c.partyType !== 'supplier') return false;
      if (!term) return true;
      return c.name?.toLowerCase().includes(term) || c.phone?.toLowerCase().includes(term) || c.email?.toLowerCase().includes(term) || c.gstin?.toLowerCase().includes(term);
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) =>
      sort.key === 'balance' ? ((balances.get(a.id) || 0) - (balances.get(b.id) || 0)) * dir : (a.name || '').localeCompare(b.name || '') * dir
    );
  }, [customers, search, type, sort, balances]);

  useEffect(() => {
    setPage(1);
  }, [search, type, sort, customers.length]);

  const pagedCustomers = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalToCollect = [...balances.values()].reduce((s, v) => s + Math.max(0, v), 0);

  const openNew = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  return (
    <Layout>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Customers' }]}
        title="Customers"
        subtitle="Customers and suppliers with GSTIN, addresses, credit terms and balances."
        actions={
          <button onClick={openNew} className="btn-primary flex items-center gap-2 h-10 px-4 text-sm">
            <FaIcon icon="fa-solid fa-plus" size={12} />
            Add Customer
          </button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-brand-600" size={36} />
          <p className="text-slate-500 font-semibold">Loading customers...</p>
        </div>
      ) : (
        <TableCard
          title={
            <>
              All parties <CountBadge n={filtered.length} />
              {totalToCollect > 0 && <span className="ml-2 text-xs font-medium text-slate-400">· {inr(totalToCollect)} to collect</span>}
            </>
          }
          toolbar={
            <>
              <SearchInput value={search} onChange={setSearch} placeholder="Search customers…" className="sm:w-72" />
              <SegmentedTabs<TypeFilter>
                ariaLabel="Filter by party type"
                value={type}
                onChange={setType}
                options={[
                  { value: 'all', label: 'All', count: counts.all },
                  { value: 'customer', label: 'Customers', count: counts.customer },
                  { value: 'supplier', label: 'Suppliers', count: counts.supplier },
                ]}
              />
            </>
          }
        >
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead>
                <tr className={theadRowCls}>
                  <SortTh label="Name" active={sort.key === 'name'} dir={sort.dir} onClick={() => setSort((c) => nextSort(c, 'name'))} />
                  <th className={thCls}>Type</th>
                  <th className={thCls}>Phone</th>
                  <th className={thCls}>GSTIN</th>
                  <SortTh label="Balance" align="right" active={sort.key === 'balance'} dir={sort.dir} onClick={() => setSort((c) => nextSort(c, 'balance', 'desc'))} />
                  <th className={`${thCls} text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedCustomers.length > 0 ? (
                  pagedCustomers.map((c) => {
                    const bal = balances.get(c.id) || 0;
                    const nameEl = <span className="font-semibold text-slate-900 truncate">{c.name}</span>;
                    return (
                      <tr key={c.id} className={trCls}>
                        <td className={tdCls}>
                          <div className="flex items-center gap-3 min-w-50">
                            <Initials name={c.name} />
                            <div className="min-w-0">
                              {statementEnabled ? (
                                <Link to={`/customers/${c.id}/statement`} className="block hover:text-brand-700 [&>span]:hover:text-brand-700">
                                  {nameEl}
                                </Link>
                              ) : (
                                <div>{nameEl}</div>
                              )}
                              <div className="text-xs text-slate-400 truncate">{c.email || c.category || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className={tdCls}>{c.partyType === 'supplier' ? <StatusPill tone="slate">Supplier</StatusPill> : <StatusPill tone="brandSoft">Customer</StatusPill>}</td>
                        <td className={`${tdCls} text-slate-600 whitespace-nowrap`}>{c.phone || '—'}</td>
                        <td className={`${tdCls} text-slate-500 font-mono text-xs whitespace-nowrap`}>{c.gstin || '—'}</td>
                        <td className={`${tdCls} text-right whitespace-nowrap`}>
                          {Math.abs(bal) < 0.005 ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <>
                              <div className={`font-semibold tabular-nums ${bal > 0 ? 'text-slate-900' : 'text-rose-600'}`}>{inr(bal)}</div>
                              <div className="text-xs text-slate-400">{bal > 0 ? 'To collect' : 'To pay'}</div>
                            </>
                          )}
                        </td>
                        <td className={`${tdCls} text-right`}>
                          <div className="flex items-center justify-end gap-0.5">
                            {bal > 0.005 && (
                              <IconAction
                                icon="fa-regular fa-bell"
                                title="Send payment reminder on WhatsApp"
                                tone="whatsapp"
                                onClick={() => window.open(partyReminderUrl(c.name, c.phone, bal, profile), '_blank', 'noopener')}
                              />
                            )}
                            {statementEnabled && <IconAction icon="fa-regular fa-file-lines" title="Party Statement (Ledger)" onClick={() => navigate(`/customers/${c.id}/statement`)} />}
                            <IconAction
                              icon="fa-regular fa-pen-to-square"
                              title="Edit"
                              onClick={() => {
                                setEditing(c);
                                setIsFormOpen(true);
                              }}
                            />
                            <IconAction icon="fa-regular fa-trash-can" title="Delete" tone="danger" onClick={() => handleDelete(c)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <TableEmpty
                    colSpan={6}
                    icon={search || type !== 'all' ? 'fa-solid fa-magnifying-glass' : 'fa-solid fa-user-plus'}
                    title={search || type !== 'all' ? 'No matching customers' : 'No customers yet'}
                    text={search || type !== 'all' ? 'Try a different name, phone or email.' : 'Add customers to reuse them on invoices and share bills.'}
                    action={
                      !search && type === 'all' ? (
                        <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm">
                          <FaIcon icon="fa-solid fa-plus" size={12} />
                          Add Customer
                        </button>
                      ) : undefined
                    }
                  />
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            itemLabel="parties"
          />
        </TableCard>
      )}

      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        customer={editing}
      />
    </Layout>
  );
};
