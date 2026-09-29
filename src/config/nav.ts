// App navigation — shared by the sidebar and the top-bar search.

import type { FeatureKey } from '../types';

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  keywords?: string;
  feature?: FeatureKey; // hidden unless the client's plan includes it
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: 'fa-solid fa-table-cells-large', keywords: 'home sales chart overview' }],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Sales Invoices', to: '/bills', icon: 'fa-regular fa-file-lines', keywords: 'bills invoices list' },
      { label: 'Quotations', to: '/quotations', icon: 'fa-solid fa-file-signature', keywords: 'quotation estimate quote proforma', feature: 'quotations' },
      { label: 'Customers', to: '/customers', icon: 'fa-solid fa-user-group', keywords: 'parties suppliers statement ledger' },
      { label: 'Products', to: '/products', icon: 'fa-solid fa-cube', keywords: 'items catalog stock import' },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Settings', to: '/settings', icon: 'fa-solid fa-gear', keywords: 'business profile gst bank upi logo features' },
      { label: 'Help Center', to: '/knowledge-base', icon: 'fa-regular fa-circle-question', keywords: 'knowledge base help guide faq' },
    ],
  },
];

// Shown in the sidebar only to admins (see admins/{uid} in Firestore).
export const ADMIN_NAV_GROUP: NavGroup = {
  title: 'Admin',
  items: [{ label: 'Clients', to: '/admin', icon: 'fa-solid fa-user-shield', keywords: 'admin plans subscriptions features' }],
};

// Quick "create" actions (top-bar button menu + search).
export const CREATE_ACTIONS: NavItem[] = [
  { label: 'New Sales Invoice', to: '/bills?new=1', icon: 'fa-solid fa-file-circle-plus', keywords: 'create bill invoice' },
  { label: 'New Quotation', to: '/quotations?new=1', icon: 'fa-solid fa-file-signature', keywords: 'create quotation estimate', feature: 'quotations' },
  { label: 'Add Customer', to: '/customers?new=1', icon: 'fa-solid fa-user-plus', keywords: 'create party supplier' },
  { label: 'Add Product', to: '/products?new=1', icon: 'fa-solid fa-box-open', keywords: 'create item' },
];
