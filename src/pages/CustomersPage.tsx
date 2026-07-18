import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { CustomerFormModal } from '../components/Customers/CustomerFormModal';
import { useConfirm } from '../components/ui/confirm';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '../services/db';
import { Customer } from '../types';
import { Pagination } from '../components/ui/Pagination';

const avatarPalette = [
  'from-blue-600 to-indigo-600',
  'from-sky-500 to-blue-500',
  'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
];

export const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

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
    if (user) loadCustomers();
  }, [user]);

  const handleSubmit = async (data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  }) => {
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
    );
  }, [customers, search]);

  // Reset to first page when search or dataset changes.
  useEffect(() => {
    setPage(1);
  }, [search, customers.length]);

  const pagedCustomers = filtered.slice((page - 1) * pageSize, page * pageSize);

  const initials = (name: string) =>
    (name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?';

  const avatarColor = (name: string) => {
    const code = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return avatarPalette[code % avatarPalette.length];
  };

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <FaIcon icon="fa-solid fa-users" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">Customers</h1>
              <p className="text-slate-500 mt-0.5 text-sm font-medium">Your customer directory and contacts</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
            className="btn-primary flex items-center space-x-2 py-2.5 px-4.5"
          >
            <FaIcon icon="fa-solid fa-plus" size={16} />
            <span>Add Customer</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-blue-600" size={40} />
            <p className="text-slate-500 font-semibold">Loading customers...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800">All Customers</h2>
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">
                  {filtered.length}
                </span>
              </div>
              <div className="relative w-full sm:w-72">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <FaIcon icon="fa-solid fa-magnifying-glass" size={14} />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone or email..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white transition-all duration-300"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Name</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length > 0 ? (
                    pagedCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(c.name)} text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm`}>
                              {initials(c.name)}
                            </span>
                            <span className="font-bold text-slate-700">{c.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 text-sm font-medium">{c.phone || '—'}</td>
                        <td className="p-4 text-slate-500 text-sm">{c.email || '—'}</td>
                        <td className="p-4">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditing(c);
                                setIsFormOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FaIcon icon="fa-solid fa-pen" size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(c)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FaIcon icon="fa-solid fa-trash" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-20">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                            <FaIcon
                              icon={search ? 'fa-solid fa-magnifying-glass' : 'fa-solid fa-user-plus'}
                              size={26}
                              className="text-slate-300"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-slate-600">
                              {search ? 'No matching customers' : 'No customers yet'}
                            </p>
                            <p className="text-sm text-slate-400 max-w-xs">
                              {search
                                ? 'Try a different name, phone or email.'
                                : 'Add customers to reuse them on invoices and share bills.'}
                            </p>
                          </div>
                          {!search && (
                            <button
                              onClick={() => {
                                setEditing(null);
                                setIsFormOpen(true);
                              }}
                              className="btn-primary flex items-center space-x-2 mt-1"
                            >
                              <FaIcon icon="fa-solid fa-plus" size={14} />
                              <span>Add Customer</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
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
              itemLabel="customers"
            />
          </div>
        )}
      </div>

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
