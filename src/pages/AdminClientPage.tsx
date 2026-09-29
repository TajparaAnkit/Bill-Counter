import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { Initials, PageHeader } from '../components/ui/Table';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useAccountStore } from '../store/account';
import { useClientActions } from '../hooks/useClientActions';
import { getClientAccount, updateAccount } from '../services/db';
import { Account, AccountStatus, FeatureKey, InvoiceTemplateConfig, InvoiceTemplateId, PlanId } from '../types';
import { DEFAULT_COLOR, TEMPLATES, TEMPLATE_COLORS, allowedTemplates, resolveTemplate } from '../config/invoiceTemplates';
import { TemplateThumb } from '../components/Bills/TemplateThumb';
import { FEATURES, PLANS, getPlan, hasFeature, planFeatures } from '../config/features';
import { toISODate } from '../utils/ledger';

const DAY = 86_400_000;
const fmtDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const endOfDay = (iso: string) => new Date(`${iso}T23:59:59`);
const tsToDate = (t: any): Date | null => (t?.toDate ? t.toDate() : t ? new Date(t) : null);

const addMonths = (from: Date, n: number) => {
  const d = new Date(from);
  d.setMonth(d.getMonth() + n);
  return d;
};

type Form = {
  plan: PlanId;
  status: AccountStatus;
  validTill: string; // yyyy-mm-dd
  features: Record<FeatureKey, boolean>;
  notes: string;
  invoice: Required<InvoiceTemplateConfig>;
};

const formFrom = (a: Account): Form => ({
  plan: a.plan,
  status: a.status,
  validTill: toISODate(a.validTill),
  features: Object.fromEntries(FEATURES.map((f) => [f.key, hasFeature(a, f.key)])) as Record<FeatureKey, boolean>,
  notes: a.notes || '',
  invoice: {
    templates: allowedTemplates(a),
    defaultTemplate: resolveTemplate({ ...a, invoice: { ...a.invoice, clientCanChoose: false } }, null).id,
    color: a.invoice?.color || DEFAULT_COLOR,
    clientCanChoose: !!a.invoice?.clientCanChoose,
  },
});

const card = 'bg-white rounded-xl border border-slate-200 shadow-xs';

const Card: React.FC<{ title: string; subtitle?: string; icon: string; right?: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, icon, right, children }) => (
  <section className={card}>
    <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <FaIcon icon={icon} size={14} />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

const Switch: React.FC<{ on: boolean; label: string; onToggle: () => void }> = ({ on, label, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${on ? 'bg-brand-600' : 'bg-slate-300'}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);

// Admin only: one client's plan, validity, features, status and notes.
export const AdminClientPage: React.FC = () => {
  const { uid = '' } = useParams<{ uid: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { cleanup, remove, busy } = useClientActions((action) => (action === 'delete' ? navigate('/admin') : undefined));
  const [account, setAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const a = await getClientAccount(uid);
        if (cancelled) return;
        setAccount(a);
        setForm(a ? formFrom(a) : null);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load client');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const baseline = useMemo(() => (account ? JSON.stringify(formFrom(account)) : ''), [account]);
  const dirty = !!form && JSON.stringify(form) !== baseline;
  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));

  if (isLoading || !form || !account) {
    return (
      <Layout>
        {isLoading ? (
          <div className="flex justify-center py-24">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-brand-500" size={32} />
          </div>
        ) : (
          <div className={`${card} px-6 py-16 text-center space-y-4`}>
            <p className="font-bold text-slate-600">Client not found</p>
            <Link to="/admin" className="btn-primary text-sm inline-flex">
              Back to Clients
            </Link>
          </div>
        )}
      </Layout>
    );
  }

  const name = account.businessName || account.email;
  const till = endOfDay(form.validTill);
  const left = Math.ceil((till.getTime() - Date.now()) / DAY);
  const expired = left <= 0;
  const readOnly = form.status !== 'active' || expired;
  const deletedOn = account.status === 'deleted' ? tsToDate(account.deletedAt) : null;
  const defaults = planFeatures(form.plan);
  const custom = FEATURES.filter((f) => form.features[f.key] !== defaults[f.key]);
  const onCount = FEATURES.filter((f) => form.features[f.key]).length;
  const joined = tsToDate(account.createdAt);

  // Renewals extend from the current end date, or from today if already expired.
  const extend = (months: number) => set({ validTill: toISODate(addMonths(expired ? new Date() : till, months)) });

  const save = async () => {
    try {
      setSaving(true);
      const invoice: InvoiceTemplateConfig = {
        templates: form.invoice.templates.filter((t) => t !== 'classic'),
        defaultTemplate: form.invoice.defaultTemplate,
        color: form.invoice.color,
        clientCanChoose: form.invoice.clientCanChoose,
      };
      const data = { plan: form.plan, status: form.status, validTill: till, features: form.features, notes: form.notes.trim(), invoice };
      await updateAccount(account.uid, data, form.features.catalog);
      const saved = { ...account, ...data };
      setAccount(saved);
      setForm(formFrom(saved));
      // Editing your own account: refresh your plan, features and template in the background.
      if (user && user.uid === account.uid) useAccountStore.getState().load(user);
      toast.success('Client updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  const stat = (label: string, value: React.ReactNode, sub: React.ReactNode, tone: string, icon: string) => (
    <div className={`${card} p-4 flex items-center gap-4`}>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        <FaIcon icon={icon} size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] text-slate-500">{label}</p>
        <p className="text-lg font-bold tracking-tight text-slate-900 truncate">{value}</p>
        <p className="text-xs text-slate-400 truncate">{sub}</p>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className={dirty ? 'pb-20' : ''}>
        <PageHeader
          crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Clients', to: '/admin' }, { label: name }]}
          title={name}
          subtitle={account.email}
          actions={
            <>
              <button type="button" onClick={() => navigate('/admin')} className="btn-secondary flex items-center gap-2 h-10 px-3.5 text-sm">
                <FaIcon icon="fa-solid fa-arrow-left" size={12} />
                Back
              </button>
              <button type="button" onClick={save} disabled={!dirty || saving} className="btn-primary flex items-center gap-2 h-10 px-4 text-sm disabled:opacity-50">
                <FaIcon icon={saving ? 'fa-solid fa-spinner' : 'fa-solid fa-floppy-disk'} size={13} className={saving ? 'animate-spin' : ''} />
                Save changes
              </button>
            </>
          }
        />

        {account.status === 'deleted' && (
          <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <FaIcon icon="fa-regular fa-trash-can" size={14} className="mt-0.5" />
            <span>
              This account was deleted{deletedOn ? ` on ${fmtDate(deletedOn)}` : ''}. All its data is gone and the client can't use the app. Choosing <strong>Active</strong> below and
              saving gives this login a fresh, empty account.
            </span>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {stat('Plan', getPlan(form.plan).label, `${onCount} of ${FEATURES.length} features on`, 'bg-brand-50 text-brand-600', 'fa-solid fa-crown')}
          {stat(
            'Valid till',
            fmtDate(till),
            expired ? <span className="text-rose-600 font-semibold">Expired {Math.abs(left)} day{Math.abs(left) === 1 ? '' : 's'} ago</span> : `${left} day${left === 1 ? '' : 's'} left`,
            expired ? 'bg-rose-50 text-rose-600' : left <= 7 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600',
            'fa-regular fa-calendar'
          )}
          {stat(
            'Access',
            readOnly ? 'Read-only' : 'Full access',
            form.status === 'deleted' ? 'Account deleted' : form.status === 'blocked' ? 'Blocked by you' : expired ? 'Plan expired' : 'Can create & edit',
            readOnly ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600',
            readOnly ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
          {/* ===== Main ===== */}
          <div className="space-y-5 min-w-0">
            <Card title="Plan" subtitle="Choosing a plan sets its default features; you can still fine-tune them below." icon="fa-solid fa-crown">
              <div role="radiogroup" aria-label="Plan" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map((p) => {
                  const active = form.plan === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set({ plan: p.id, features: planFeatures(p.id) })}
                      className={`relative text-left rounded-xl border-2 p-4 transition-colors cursor-pointer ${
                        active ? 'border-brand-600 bg-brand-50/60' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {active && (
                        <span className="absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
                          <FaIcon icon="fa-solid fa-check" size={10} />
                        </span>
                      )}
                      <p className="font-bold text-slate-900">{p.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.features.length} of {FEATURES.length} features
                      </p>
                      <ul className="mt-3 space-y-1">
                        {FEATURES.map((f) => {
                          const inc = p.features.includes(f.key);
                          return (
                            <li key={f.key} className={`flex items-center gap-2 text-xs ${inc ? 'text-slate-700' : 'text-slate-300 line-through'}`}>
                              <FaIcon icon={inc ? 'fa-solid fa-check' : 'fa-solid fa-xmark'} size={10} className={inc ? 'text-emerald-600' : ''} />
                              {f.label}
                            </li>
                          );
                        })}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card title="Validity" subtitle="The client can create and edit until the end of this day." icon="fa-regular fa-calendar">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="sm:w-56">
                  <label htmlFor="valid-till" className="block text-sm font-semibold text-slate-600 mb-1.5">
                    Valid Till
                  </label>
                  <input
                    id="valid-till"
                    type="date"
                    value={form.validTill}
                    onChange={(e) => e.target.value && set({ validTill: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['+1 month', 1],
                      ['+3 months', 3],
                      ['+6 months', 6],
                      ['+1 year', 12],
                    ] as const
                  ).map(([text, m]) => (
                    <button key={text} type="button" onClick={() => extend(m)} className="btn-secondary h-10 px-3.5 text-sm">
                      {text}
                    </button>
                  ))}
                </div>
              </div>
              <p
                className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  expired ? 'bg-rose-50 text-rose-700' : left <= 7 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                <FaIcon icon={expired ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'} size={13} />
                {expired
                  ? `Expired on ${fmtDate(till)}. The client can view their data but can't create or edit.`
                  : `Access until ${fmtDate(till)} (${left} day${left === 1 ? '' : 's'} from today).`}
              </p>
              <p className="mt-2 text-xs text-slate-400">Extending adds to the current end date, or to today if the plan has already expired.</p>
            </Card>

            <Card
              title="Features"
              subtitle={`${onCount} on · ${custom.length ? `${custom.length} changed from the ${getPlan(form.plan).label} plan` : `matches the ${getPlan(form.plan).label} plan`}`}
              icon="fa-solid fa-toggle-on"
              right={
                custom.length > 0 && (
                  <button type="button" onClick={() => set({ features: defaults })} className="text-sm font-semibold text-brand-700 hover:underline cursor-pointer whitespace-nowrap">
                    Reset to plan
                  </button>
                )
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FEATURES.map((f) => {
                  const on = form.features[f.key];
                  const changed = on !== defaults[f.key];
                  return (
                    <div
                      key={f.key}
                      className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${on ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200 bg-white'}`}
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${on ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <FaIcon icon={f.icon} size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-800">{f.label}</p>
                          {changed && (
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800" title={`Differs from the ${getPlan(form.plan).label} plan`}>
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{f.description}</p>
                      </div>
                      <Switch on={on} label={f.label} onToggle={() => set({ features: { ...form.features, [f.key]: !on } })} />
                    </div>
                  );
                })}
              </div>
            </Card>

            <InvoiceTemplatesCard value={form.invoice} onChange={(invoice) => set({ invoice })} />
          </div>

          {/* ===== Side ===== */}
          <div className="space-y-5">
            <section className={`${card} p-5`}>
              <div className="flex items-center gap-3">
                <Initials name={name} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{name}</p>
                  <p className="text-xs text-slate-500 truncate">{account.email}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                {joined && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Joined</dt>
                    <dd className="font-medium text-slate-800">{fmtDate(joined)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Current plan</dt>
                  <dd className="font-medium text-slate-800">{getPlan(account.plan).label}</dd>
                </div>
                <div className="flex justify-between gap-3 items-center">
                  <dt className="text-slate-500">Client ID</dt>
                  <dd className="flex items-center gap-1.5 min-w-0">
                    <code className="truncate text-xs text-slate-600">{account.uid}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(account.uid).then(() => toast.success('Client ID copied'))}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy client ID"
                      aria-label="Copy client ID"
                    >
                      <FaIcon icon="fa-regular fa-copy" size={12} />
                    </button>
                  </dd>
                </div>
              </dl>
            </section>

            <Card title="Account status" icon={form.status === 'blocked' ? 'fa-solid fa-lock' : 'fa-solid fa-user-check'}>
              <div role="radiogroup" aria-label="Account status" className="space-y-2">
                {(
                  [
                    ['active', 'Active', 'Full access while the plan is valid.', 'fa-solid fa-circle-check'],
                    ['blocked', 'Blocked', 'Read-only right away, whatever the date.', 'fa-solid fa-ban'],
                  ] as const
                ).map(([value, label, hint, icon]) => {
                  const active = form.status === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set({ status: value })}
                      className={`w-full flex items-start gap-3 rounded-lg border-2 px-3 py-2.5 text-left cursor-pointer transition-colors ${
                        active ? (value === 'blocked' ? 'border-rose-500 bg-rose-50' : 'border-emerald-500 bg-emerald-50') : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <FaIcon icon={icon} size={14} className={`mt-0.5 ${active ? (value === 'blocked' ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-300'}`} />
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">{label}</span>
                        <span className="block text-xs text-slate-500">{hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card title="Notes" subtitle="Only you see this." icon="fa-regular fa-note-sticky">
              <textarea
                aria-label="Notes"
                value={form.notes}
                onChange={(e) => set({ notes: e.target.value })}
                rows={4}
                placeholder="e.g. Paid ₹999 by UPI on 1 Oct, ref 4521…"
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </Card>

            {account.status !== 'deleted' && (
              <Card title="Danger zone" subtitle="Both ask for confirmation and cannot be undone." icon="fa-solid fa-triangle-exclamation">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      <strong className="block text-sm text-slate-800">Clean up data</strong>
                      Deletes invoices, quotations, products and customers. Keeps Business Settings, plan and validity.
                    </span>
                    <button type="button" onClick={() => cleanup(account)} disabled={!!busy} className="btn-secondary shrink-0 h-9 px-3 text-sm flex items-center gap-2 disabled:opacity-50">
                      <FaIcon icon={busy ? 'fa-solid fa-spinner' : 'fa-solid fa-broom'} size={12} className={busy ? 'animate-spin' : ''} />
                      Clean up
                    </button>
                  </div>
                  {account.uid !== user?.uid && (
                    <div className="flex items-start justify-between gap-3 border-t border-slate-100 pt-3">
                      <span className="text-xs text-slate-500">
                        <strong className="block text-sm text-rose-700">Delete account</strong>
                        Deletes all data and Business Settings, and locks the account.
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(account)}
                        disabled={!!busy}
                        className="shrink-0 h-9 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        <FaIcon icon="fa-regular fa-trash-can" size={12} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Unsaved changes bar (portal: the page's slide-in transform would pin a fixed child to the page, not the window) */}
      {dirty &&
        createPortal(
        <div className="fixed bottom-0 inset-x-0 z-40 lg:pl-64">
          <div className="mx-auto max-w-[1600px] px-3 sm:px-6 pb-4">
            <div role="status" className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-xl">
              <span className="flex items-center gap-2 text-sm">
                <FaIcon icon="fa-solid fa-circle-info" size={13} className="text-brand-300" />
                You have unsaved changes
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setForm(formFrom(account))} className="h-9 px-3 rounded-lg text-sm font-semibold text-slate-300 hover:text-white cursor-pointer">
                  Discard
                </button>
                <button type="button" onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-brand-500 hover:bg-brand-400 text-sm font-semibold cursor-pointer disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>,
          document.body
        )}
    </Layout>
  );
};

// Which invoice designs this client may use, the default one, the accent colour, and
// whether they may change it themselves. Classic is always on so nothing can break.
const InvoiceTemplatesCard: React.FC<{ value: Form['invoice']; onChange: (v: Form['invoice']) => void }> = ({ value, onChange }) => {
  const toggle = (id: InvoiceTemplateId) => {
    if (id === 'classic') return;
    const on = value.templates.includes(id);
    const templates = on ? value.templates.filter((t) => t !== id) : [...value.templates, id];
    // Turning off the default falls back to Classic.
    onChange({ ...value, templates, defaultTemplate: on && value.defaultTemplate === id ? 'classic' : value.defaultTemplate });
  };
  const colorUsed = value.templates.some((t) => TEMPLATES.find((d) => d.id === t)?.usesColor);
  return (
    <Card
      title="Invoice templates"
      subtitle="Designs for this client's invoice and quotation PDFs. Classic, the original layout, is always available."
      icon="fa-solid fa-palette"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {TEMPLATES.map((t) => {
          const on = value.templates.includes(t.id);
          const isDefault = value.defaultTemplate === t.id;
          return (
            <div key={t.id} className={`rounded-xl border-2 overflow-hidden transition-colors ${isDefault ? 'border-brand-600' : on ? 'border-brand-200' : 'border-slate-200'}`}>
              <div className={`h-28 ${on ? '' : 'opacity-40 grayscale'}`}>
                <TemplateThumb id={t.id} color={value.color} />
              </div>
              <div className="p-3 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.label}</p>
                  <p className="text-[11px] text-slate-500">{t.paper}</p>
                </div>
                <label className={`flex items-center gap-2 text-xs ${t.id === 'classic' ? 'text-slate-400' : 'text-slate-700 cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={t.id === 'classic'}
                    onChange={() => toggle(t.id)}
                    aria-label={`Allow ${t.label}`}
                    className="w-4 h-4 accent-brand-600"
                  />
                  {t.id === 'classic' ? 'Always on' : 'Available'}
                </label>
                <label className={`flex items-center gap-2 text-xs ${on ? 'text-slate-700 cursor-pointer' : 'text-slate-300'}`}>
                  <input
                    type="radio"
                    name="default-template"
                    checked={isDefault}
                    disabled={!on}
                    onChange={() => onChange({ ...value, defaultTemplate: t.id })}
                    aria-label={`Default ${t.label}`}
                    className="w-4 h-4 accent-brand-600"
                  />
                  Default
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-5 ${colorUsed ? '' : 'opacity-50'}`}>
        <p className="text-sm font-semibold text-slate-700">Accent colour</p>
        <p className="text-xs text-slate-500 mb-2">{colorUsed ? 'Used by the Modern and Minimal designs.' : 'Turn on Modern or Minimal to use a colour.'}</p>
        <div role="radiogroup" aria-label="Accent colour" className="flex flex-wrap gap-2">
          {TEMPLATE_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={value.color === c.value}
              aria-label={c.label}
              title={c.label}
              disabled={!colorUsed}
              onClick={() => onChange({ ...value, color: c.value })}
              className={`h-9 w-9 rounded-full grid place-items-center text-white cursor-pointer disabled:cursor-default ring-offset-2 ${value.color === c.value ? 'ring-2 ring-slate-800' : ''}`}
              style={{ background: c.value }}
            >
              {value.color === c.value && <FaIcon icon="fa-solid fa-check" size={12} />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3">
        <span>
          <span className="block text-sm font-semibold text-slate-800">Client can change it in Settings</span>
          <span className="block text-xs text-slate-500">Off: the client always uses the default above. On: they can pick any available design and colour.</span>
        </span>
        <Switch on={value.clientCanChoose} label="Client can change template" onToggle={() => onChange({ ...value, clientCanChoose: !value.clientCanChoose })} />
      </div>
    </Card>
  );
};
