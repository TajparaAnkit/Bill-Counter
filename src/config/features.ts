// Plans and client-wise feature flags.
// To add a new switchable feature: add its key to `FeatureKey` in types/index.ts,
// list it in FEATURES, pick which plans include it, then gate the UI with
// `useFeature('<key>')`. The admin page picks it up automatically.

import type { Account, FeatureKey, PlanId } from '../types';

export interface FeatureDef {
  key: FeatureKey;
  label: string;
  description: string;
  icon: string;
}

export const FEATURES: FeatureDef[] = [
  { key: 'partyStatement', label: 'Party Statement (Ledger)', description: 'Customer-wise statement with running balance, PDF and WhatsApp share.', icon: 'fa-solid fa-file-lines' },
  { key: 'catalog', label: 'Online Catalog', description: 'Public storefront link with WhatsApp ordering.', icon: 'fa-solid fa-store' },
  { key: 'bulkImport', label: 'Bulk Import', description: 'Import products from Excel / CSV.', icon: 'fa-solid fa-file-import' },
  { key: 'promote', label: 'Promote Product', description: 'Instagram / WhatsApp promo images for a product.', icon: 'fa-solid fa-bullhorn' },
  { key: 'stock', label: 'Stock Tracking', description: 'Product stock that invoices reduce, with low-stock alerts.', icon: 'fa-solid fa-boxes-stacked' },
  { key: 'quotations', label: 'Quotations', description: 'Send quotations / estimates and convert them into invoices.', icon: 'fa-solid fa-file-signature' },
];

export interface PlanDef {
  id: PlanId;
  label: string;
  features: FeatureKey[]; // included by default; the admin can still override per client
}

export const PLANS: PlanDef[] = [
  { id: 'trial', label: 'Trial', features: ['partyStatement', 'catalog', 'bulkImport', 'promote', 'stock', 'quotations'] },
  { id: 'basic', label: 'Basic', features: ['bulkImport', 'stock'] },
  { id: 'pro', label: 'Pro', features: ['partyStatement', 'catalog', 'bulkImport', 'promote', 'stock', 'quotations'] },
];

export const TRIAL_DAYS = 14;

export const getPlan = (id: PlanId | undefined): PlanDef => PLANS.find((p) => p.id === id) || PLANS[0];

// Plan defaults merged with the client's overrides.
export const planFeatures = (plan: PlanId): Record<FeatureKey, boolean> =>
  Object.fromEntries(FEATURES.map((f) => [f.key, getPlan(plan).features.includes(f.key)])) as Record<FeatureKey, boolean>;

export const hasFeature = (account: Account | null, key: FeatureKey): boolean => {
  if (!account) return false;
  return account.features?.[key] ?? getPlan(account.plan).features.includes(key);
};

const DAY = 86_400_000;

// Whole days left until validTill (negative once expired).
export const daysLeft = (account: Account): number => Math.ceil((account.validTill.getTime() - Date.now()) / DAY);

// Matches the Firestore rule: writes are allowed only while active and not past validTill.
export const canWrite = (account: Account | null): boolean =>
  !!account && account.status === 'active' && account.validTill.getTime() > Date.now();
