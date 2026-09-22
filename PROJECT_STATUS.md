# 🎯 PROJECT STATUS - Bill Counter

**Last Updated:** September 8, 2026
**Project:** Bill Counter - SaaS inventory & billing platform
**Location:** `d:\project\Bill-Counter`
**Live Target:** GitHub Pages (`npm run deploy`)

---

## 📊 Phase Summary

| Phase | Scope | Status |
|-------|-------|--------|
| 1. Setup | React + Vite + TS scaffold, Tailwind, Firebase SDK, Zustand, Router, layout | ✅ Complete |
| 2. Authentication | Email/password auth, validation, Firebase error mapping, toasts, error boundary | ✅ Complete |
| 3. Products | CRUD, detail drawer, bulk import (Excel/CSV), bulk delete, Cloudinary images | ✅ Complete |
| 4. Bills | Invoice builder, discount & tax, payment tracking, PDF export, UPI QR | ✅ Complete |
| 5. Dashboard & Settings | Live metrics, business profile, invoice prefix / notes / tax | ✅ Complete |
| Extras | Google Sign-In, customer directory, public Storefront Catalog, Promote Product, Knowledge Base, GitHub Pages deploy | ✅ Complete |
| 6. GST Invoicing | myBillBook-style full-page invoice editor and customer (party) form | ✅ Complete (Sep 8, 2026) |
| 7. Manage Business + Invoice Layout | Settings rework (logo, signature, GST/PAN, business type, extra details) and myBillBook-style invoice/PDF layout | ✅ Complete (Sep 8, 2026) |
| 8. App Theme | Flat indigo/orange theme, Source Sans 3, compact controls and cards (catalog untouched) | ✅ Complete (Sep 8, 2026) |
| 9. App Shell | Fixed navy sidebar with collapsible groups, split "Create" button, mobile drawer; slim header; Sales Invoices list | ✅ Complete (Sep 8, 2026) |
| 10. Shared Dropdowns + UI Tests | One dropdown/typeahead pattern (`Select`, `MultiSelect`, `Combobox`) across the app; Playwright suite | ✅ Complete (Sep 8, 2026) |
| 11. Product & Bill To polish | HSN + unit on products (form, table, bulk import); editable Bill To details (GSTIN/PAN) per invoice | ✅ Complete (Sep 8, 2026) |

Per-phase reports for Phases 1 and 2 were retired; everything they described is
shipped and documented in [README.md](README.md). Implementation notes for
Phases 3 to 5 remain in [walkthrough.md](walkthrough.md) (partly outdated, see
Cleanup below).

---

## ✅ What Is Shipped

### Infrastructure
- React 19 + Vite 8 + TypeScript (strict)
- Tailwind CSS v4 (CSS-first `@theme`, via `@tailwindcss/postcss`) + shadcn/ui (Radix primitives)
- Firebase Auth + Firestore (flat collections scoped by `userId`)
- Cloudinary for product images, logo and signature (unsigned browser uploads, no Blaze plan)
- Zustand stores: `auth`, `toast`
- React Router v7 using `HashRouter` for GitHub Pages
- Invoice maths in `src/utils/tax.ts` (line + bill totals, CGST/SGST vs IGST split, Indian state list, date helpers, amount in words)
- Playwright (`@playwright/test`, Chromium) for UI tests
- Dependencies trimmed (Sep 8, 2026): removed unused `@fontsource-variable/inter`, `@fontsource-variable/plus-jakarta-sans` and `autoprefixer` (Tailwind v4 handles prefixing)

### Theme & App Shell
- Tokens in `src/index.css` `@theme`: `brand` (indigo) and `accent` (orange) scales, Source Sans 3 as `--font-sans`
- Flat component utilities: `.btn-primary`, `.btn-secondary`, `.btn-accent`, `.card`, `.input-field` (no gradients / heavy shadows, 6–8 px radii). All pages use `brand-*`; `blue-*` remains only in the public catalog themes and the promo-image canvas. PDF accent colours follow the brand indigo.
- Layout (`Layout.tsx`): fixed 240 px navy sidebar + slim white header; content renders in a white bordered card on `#f5f6fa`; sidebar becomes a slide-over drawer under `lg`
- Sidebar (`Sidebar.tsx`): business logo/name/phone block; **Create Sales Invoice** split button (`/bills?new=1`) whose chevron menu offers Add Customer (`/customers?new=1`), Add Product (`/products?new=1`) and Sales Invoice — each page opens its add form when it sees `?new=1`; collapsible groups with chevrons — General: Dashboard, Customers (All / Add), Products (All / Add), Sales (Sales Invoices / Create Sales Invoice); Business: Settings (Business Settings / Knowledge Base); the group owning the current route auto-expands; rounded active highlight; **Logout** pinned at the bottom
- Header (`Header.tsx` + `UserMenu.tsx`): hamburger on mobile, wordmark on mobile, signed-in user's name + email + avatar (Google photo or initials). No dropdown menu.
- Page titles standardised to one `text-xl` heading (Dashboard, Products, Customers, Sales Invoices, Business Settings, Knowledge Base)
- User-facing wording: **Customers / Add Customer** and **Products / Add Product** everywhere (sidebar, headings, toasts, dialogs, Knowledge Base). Invoice line items keep the word *Item*; the Bill To picker keeps *Party*. Routes, Firestore collections and code identifiers are unchanged.

### Shared UI Components
- `src/components/ui/Select.tsx` — the one dropdown pattern: white rounded panel, hairline rows, brand tint + check on the active row, positioned through a portal (never clipped by tables or input groups), flips upward near the viewport bottom, re-measures on scroll and when its contents change, only one panel open at a time.
  - `Select` (single): placeholder, clearable, search box (auto over 10 options), keyboard navigation (arrows / Enter / Escape, also from the search box), `embedded` variant for input groups, `sm` size
  - `MultiSelect`: checkbox rows (used for Business Type)
  - `Combobox`: free-text input with typeahead suggestions and hints (replaced every native `<datalist>`: invoice item name, customer category, business-detail label)
  - No native `<select>` or `<datalist>` remains outside the public catalog
- `dropdown-menu.tsx` (shadcn/Radix) for action menus (sidebar create menu, invoice row menu); `confirm.tsx` confirm/prompt provider; `Pagination.tsx`

### Authentication
- Email/password register & login, plus Google Sign-In
- Field-level validation with real-time error clearing; Firebase errors mapped to friendly messages (`validators.ts`)
- Loading spinners and disabled buttons during submission; toast notifications; global `ErrorBoundary`; `ProtectedRoute`
- Logout lives in the sidebar

### Products
- Add / edit / delete, bulk delete with row checkboxes
- Optional **HSN / SAC code** and **Unit** dropdown (PCS, KGS, …) per product — form fields, HSN column and "₹ price / unit" in the table, optional `hsn` / `unit` columns in bulk import. Existing products show a blank HSN and default to PCS until edited. Both prefill onto invoice lines.
- Slide-out detail panel
- Bulk import from `.xlsx` / `.csv` with image matching by filename
- Promote Product: 1080×1080 marketing image + caption/hashtags

### Customers (parties)
- Full-page Add/Edit Customer form: Customer Name, mobile, email, opening balance (to collect / to pay)
- GSTIN and PAN with format validation; PAN auto-derived from GSTIN
- Customer Type (customer / supplier) and Category (typeahead)
- Billing address, shipping address with "same as billing"
- Credit period (drives default payment terms on invoices) and credit limit
- Table shows type and GSTIN; search includes GSTIN

### Bills (GST invoice editor)
- Full-page editor with Edit Mode / Preview Mode toggle and its own top bar (Exit, Save Sales Invoice)
- Bill To: party picker (search by name / phone / GSTIN, or one-time customer) with **Edit Details** to override name, address, mobile, email, GSTIN and PAN for that invoice only (validated; PAN and Place of Supply derived from GSTIN); GSTIN / PAN rows always visible with "+ Add" shortcuts. Ship To override. Place of Supply.
- Invoice prefix, editable invoice number with duplicate check, invoice date, payment terms + due date, vehicle no.
- Items: name typeahead (auto-fills price, HSN, unit and tax rate from the product), description, HSN, qty (unit shown read-only from the product, default PCS), price, per-item discount (₹ / %), per-item GST rate
- Totals: taxable amount, CGST + SGST (same state) or IGST (inter-state), additional charges, bill discount, auto / manual round-off
- Payment on creation: amount received + method, mark fully paid, balance
- Toggles: Notes, Terms & Conditions (default from Settings), Bank Account, Payment QR
- Shared `InvoicePaper` component (myBillBook-style: seller logo + block, TAX INVOICE meta table, ORIGINAL FOR RECIPIENT badge, Bill To / Ship To chips with GSTIN / PAN / Place of Supply, tinted items table, subtotal band, totals, amount in words, authorised signature) used by the detail modal and Preview Mode
- PDF export (jsPDF, vector) mirrors the same layout incl. logo and signature; legacy bills still render with their original fields
- Sales Invoices list: Total Sales / Paid / Unpaid tiles act as status filters; search (party, number, GSTIN) + date range (30/90/365 days, all); columns Date, Invoice Number, Party, Due In (Overdue by N days / Due in N days / Paid), Amount with unpaid balance, Status, row menu (View, Download PDF, Delete)
- Payment tracking after saving: paid / partial / unpaid, method (cash, UPI, card, bank, other)
- UPI scan-to-pay QR generated from the seller's UPI ID (payee = seller's business name)
- Invoices print the seller's own business name, logo and signature; `BRAND_NAME` is only the fallback and the small PDF footer line

### Settings (Business Settings)
- Manage Business: logo + signature upload via Cloudinary (downscaled in-browser), business name, phone, company e-mail, billing address, state, pincode, city
- GST Registered Yes/No (No hides GSTIN on invoices), GSTIN with state + PAN auto-fill, PAN
- Business Type multi-select, searchable Industry Type, Registration Type (`src/config/business.ts`)
- Add Business Details key/value list (MSME, Website…) printed under the seller block
- Invoice Defaults (prefix, UPI, default GST toggle + rate, default Terms) and Bank Account sections
- Logo mirrored to `publicProfiles` and shown on the public catalog

### Storefront & Help
- Public shareable catalog at `#/catalog/<userId>` with "Order on WhatsApp" (keeps its own storefront themes)
- `publicProfiles` mirror of public-safe shop info
- In-app Knowledge Base page (articles updated for every feature above)

### Dashboard
- Active Products, Today's Sales, Total Invoices, Avg Order Value, 7-day sales bars, recent items

### Tests
- `npm run test:ui` — Playwright suite `tests/e2e/select.spec.ts` (22 tests) against the dev-only harness `/#/__ui-test` (`src/pages/UiTestPage.tsx`, mounted only under `vite dev`, no Firebase). Covers open/close, selection, search, keyboard, clear, disabled, single-open, positioning (no clipping, alignment, flip-up, follow on scroll), multi-select and the item-name typeahead. Passing (44/44 across two full runs).
- No unit tests yet for `tax.ts` or form validation.

---

## 📂 Current Route Map

| Route | Page | Auth |
|-------|------|------|
| `/login`, `/register` | Auth pages | Public |
| `/catalog/:userId` | Public storefront | Public |
| `/dashboard` | Metrics | Protected |
| `/products` (`?new=1` opens Add Product) | Products | Protected |
| `/customers` (`?new=1` opens Add Customer) | Customers / parties | Protected |
| `/bills` (`?new=1` opens the invoice editor) | Sales Invoices | Protected |
| `/settings` | Business Settings | Protected |
| `/knowledge-base` | In-app help | Protected |
| `/__ui-test` | Dropdown test harness | Dev server only |

---

## 🔧 Environment & Setup

- Firebase config lives in `.env.local` (git-ignored). Copy from `.env.example`.
- Cloudinary cloud name and unsigned preset are set in `src/services/db.ts`.
- Firestore rules are in [firestore.rules](firestore.rules); products and
  `publicProfiles` are publicly readable to power the catalog. Hardened Sep 11, 2026:
  added the missing `customers` rule, blocked `userId` reassignment on update,
  basic type/size checks on create, `publicProfiles` field whitelist, explicit
  deny-all fallback. **Must be re-published in the Firebase Console** to take effect.
- Security review (Sep 11, 2026) open items: restrict the Firebase browser API key by
  HTTP referrer (Console task); Cloudinary preset limits; signature URL exposure;
  SRI on CDN scripts; `noopener` on two `window.open` calls; password policy /
  email verification / App Check; remove unused Storage init, `cors.json`,
  `VITE_AUTH_BYPASS`.
- Full setup steps: [README.md](README.md). Older step-by-step Firebase guides:
  [FIREBASE_SETUP.md](FIREBASE_SETUP.md), [FIREBASE_SETUP_CHECKLIST.md](FIREBASE_SETUP_CHECKLIST.md),
  [QUICK_START.md](QUICK_START.md) (these predate the rename from "naitu-saas"
  and still reference the old project name and Firebase Storage; the README is
  authoritative).

---

## 📚 Documentation Files

1. **README.md** - Full project overview, setup, schema, tests, deployment (authoritative)
2. **PROJECT_STATUS.md** - This file
3. **walkthrough.md** - Implementation notes for Phases 3 to 5 (historical)
4. **FIREBASE_SETUP.md** / **FIREBASE_SETUP_CHECKLIST.md** / **QUICK_START.md** - Legacy Firebase onboarding guides

---

## 🧹 Known Cleanup Items

- Legacy docs above still reference `naitu-saas`, `d:\naitu-saas`, and Firebase Storage.
- `walkthrough.md` describes the old `html2pdf.js` export and Firebase Storage uploads; both were replaced (jsPDF, Cloudinary).
- `test.css` and `cors.json` at the repo root appear unused.
- `tailwind.config.js` is a Tailwind v3-style config (old green `primary`) that Tailwind v4 ignores; it is only referenced by `components.json`. The real theme lives in `src/index.css`.
- `src/utils/formatters.ts` is no longer imported anywhere.
- Invoice editor "Scan Barcode" button is present but disabled; the customer form's "Get Details" (GSTIN lookup) button is present but disabled.

---

## ⏸️ On Hold

### e-Way Bill (planned Sep 11, 2026, paused by owner)
Real e-way bill numbers come only from the NIC e-way bill system, whose API needs a GSP subscription and server-side credentials. Bill Counter has no backend, so the agreed plan was two-phase:

- **Phase A (no backend):** "Enable e-Way Bill" toggle in Business Settings (off by default; when off nothing e-way related is shown) with threshold (₹50,000), default transporter and mode. Invoice editor gains a collapsible e-Way Bill section: Part A prefilled from the invoice (GSTINs, addresses + pincodes, doc no/date, value, HSN) plus dispatch-from, sub-type and document type; Part B per myBillBook (Transporter ID/Name, distance, mode, vehicle type, vehicle no., transport doc no/date). "Download e-Way Bill JSON" in the NIC bulk-upload format for the portal; then record EWB number (12 digits), date, valid-until (1 day / 200 km, overridable) and status. Print block on invoice/PDF; "e-Way Bills" page under Sales; docs + Playwright coverage of the toggle.
- **Phase B (later, optional):** Cloud Function on Firebase Blaze holding GSP credentials to generate / update Part B / extend / cancel via the NIC API. Needs Blaze upgrade, a GSP contract and portal API registration.

Open decisions when resumed: show section on every invoice vs only at/above threshold (recommended: threshold + manual "Add anyway"); sidebar placement (recommended: under Sales).

---

## 🚀 Possible Next Steps

- Default GST rate per product (type and invoice prefill already support it; add the field to the product form and bulk import)
- Edit / void existing invoices, refunds
- Barcode scanning on the invoice editor
- Purchase bills for suppliers; party ledger using opening balance and credit limit
- Low-stock / inventory quantity tracking
- Export reports (CSV) from the dashboard
- Dark mode (tokens are in place; add a `.dark` brand palette and a toggle)
- Broaden automated tests: unit tests for `tax.ts` (GST split, round-off), customer form validation, an authenticated invoice-editor flow
- CI build on GitHub Actions with `VITE_FIREBASE_*` secrets, running `npm run build` and `npm run test:ui`
