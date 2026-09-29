import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import {
  CountBadge,
  IconAction,
  Initials,
  PageHeader,
  PillTone,
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
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { useClientActions } from '../hooks/useClientActions';
import { listAccounts } from '../services/db';
import { Account } from '../types';
import { FEATURES, daysLeft, getPlan, hasFeature } from '../config/features';

const fmtDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const validity = (a: Account): { tone: PillTone; text: string } => {
  if (a.status === 'deleted') return { tone: 'red', text: 'Deleted' };
  if (a.status === 'blocked') return { tone: 'slate', text: 'Blocked' };
  const left = daysLeft(a);
  if (left <= 0) return { tone: 'red', text: 'Expired' };
  if (left <= 7) return { tone: 'amber', text: `${left}d left` };
  return { tone: 'green', text: 'Active' };
};

// Admin-only: every client with their plan, validity and feature switches.
export const AdminPage: React.FC = () => {
  const toast = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { user } = useAuth();
  const { cleanup, remove, busy } = useClientActions(() => load());

  // Cleanup / delete for one client. Deleted accounts have nothing left; you can't delete yourself.
  const actions = (a: Account) => (
    <>
      {a.status !== 'deleted' && (
        <IconAction icon="fa-solid fa-broom" title="Clean up data" busy={busy === a.uid} onClick={() => cleanup(a)} />
      )}
      {a.status !== 'deleted' && a.uid !== user?.uid && (
        <IconAction icon="fa-regular fa-trash-can" title="Delete account" tone="danger" disabled={busy === a.uid} onClick={() => remove(a)} />
      )}
    </>
  );

  const load = async () => {
    try {
      setIsLoading(true);
      setAccounts(await listAccounts());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? accounts.filter((a) => `${a.businessName} ${a.email}`.toLowerCase().includes(q)) : accounts;
  }, [accounts, search]);

  return (
    <Layout>
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Clients' }]}
        title="Clients"
        subtitle="Plans, validity and features for every business using the app."
      />

      <TableCard
        title={
          <>
            All Clients <CountBadge n={accounts.length} />
          </>
        }
        toolbar={<SearchInput value={search} onChange={setSearch} placeholder="Search business or email" className="sm:w-72" />}
      >
        {/* Phones: one card per client */}
        <ul className="lg:hidden divide-y divide-slate-100 border-t border-slate-100">
          {isLoading ? (
            <li className="py-12 text-center">
              <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-brand-500" size={24} />
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-slate-500">No clients found</li>
          ) : (
            filtered.map((a) => {
              const v = validity(a);
              const on = FEATURES.filter((f) => hasFeature(a, f.key)).length;
              return (
                <li key={a.uid} className="flex items-center">
                  <Link to={`/admin/clients/${a.uid}`} className="flex flex-1 min-w-0 items-center gap-3 pl-4 pr-2 py-3.5 hover:bg-slate-50">
                    <Initials name={a.businessName || a.email} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900 truncate">{a.businessName || a.email}</p>
                        <StatusPill tone={v.tone}>{v.text}</StatusPill>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{a.email}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <StatusPill tone="brandSoft">{getPlan(a.plan).label}</StatusPill>
                        <span>till {fmtDate(a.validTill)}</span>
                        <span>·</span>
                        <span>
                          {on}/{FEATURES.length} features
                        </span>
                      </p>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center pr-2">{actions(a)}</div>
                </li>
              );
            })
          )}
        </ul>

        <div className="hidden lg:block overflow-x-auto">
          <table className={tableCls}>
            <thead>
              <tr className={theadRowCls}>
                <th className={thCls}>Business</th>
                <th className={thCls}>Plan</th>
                <th className={thCls}>Valid Till</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Features</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-brand-500" size={28} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <TableEmpty colSpan={6} icon="fa-solid fa-user-shield" title="No clients found" text="Clients appear here after they sign up." />
              ) : (
                filtered.map((a) => {
                  const v = validity(a);
                  const on = FEATURES.filter((f) => hasFeature(a, f.key));
                  return (
                    <tr key={a.uid} className={trCls}>
                      <td className={tdCls}>
                        <div className="flex items-center gap-3 min-w-50">
                          <Initials name={a.businessName || a.email} />
                          <div className="min-w-0">
                            <Link to={`/admin/clients/${a.uid}`} className="block font-semibold text-slate-900 truncate hover:text-brand-700">
                              {a.businessName || '—'}
                            </Link>
                            <p className="text-xs text-slate-400 truncate">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={tdCls}>
                        <StatusPill tone="brandSoft">{getPlan(a.plan).label}</StatusPill>
                      </td>
                      <td className={`${tdCls} whitespace-nowrap text-slate-600`}>{fmtDate(a.validTill)}</td>
                      <td className={tdCls}>
                        <StatusPill tone={v.tone}>{v.text}</StatusPill>
                      </td>
                      <td className={`${tdCls} text-xs text-slate-500 min-w-56`}>
                        {on.length ? on.map((f) => f.label).join(', ') : <span className="text-slate-300">None</span>}
                      </td>
                      <td className={`${tdCls} text-right`}>
                        <div className="flex items-center justify-end gap-0.5">
                          <IconAction icon="fa-regular fa-pen-to-square" title="Edit plan & features" onClick={() => navigate(`/admin/clients/${a.uid}`)} />
                          {actions(a)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TableCard>

    </Layout>
  );
};
