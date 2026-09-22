# Bill Counter - SaaS Platform

A modern, scalable SaaS application for managing small business inventory and billing. Built with React 19, Vite, Tailwind CSS, shadcn/ui, and Firebase.

> **Status:** All planned phases are shipped, including the GST invoice editor, Manage Business settings, the myBillBook-style theme and sidebar shell, and a Playwright UI suite. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the phase summary, route map, and cleanup backlog.

## 🚀 Features

- ✅ User Authentication (Register / Login + **Google Sign-In**)
- ✅ Product Management (Add, Edit, Delete, **Bulk Delete**) with optional **HSN / SAC code** and **unit** per product (prefilled on invoice lines)
- ✅ **Bulk Import from Excel / CSV** with image upload (matched by filename)
- ✅ Product image hosting via **Cloudinary** (no billing / Blaze plan needed)
- ✅ Slide-out Product Detail panel (right-side drawer)
- ✅ **Customer Directory** (customers & suppliers) with **GSTIN / PAN validation**, billing + shipping address, credit period & limit, opening balance
- ✅ **GST-style Invoice Editor** (full page, Edit / Preview modes): Bill To with per-invoice **Edit Details** (address, GSTIN, PAN), Ship To, Place of Supply, editable prefix + number, invoice & due date, payment terms, vehicle no.
- ✅ Line items with **HSN, unit, per-item discount (₹/%) and per-item GST rate**; **CGST/SGST or IGST** split, additional charges, bill discount, auto round-off, amount in words
- ✅ **Payment Tracking** at creation and later (Paid / Partial / Unpaid + method: cash, UPI, card, bank), balance shown on invoice
- ✅ **Sales Invoices list**: Total / Paid / Unpaid tiles that filter the table, date range + search, Due In (overdue days), amount with unpaid balance, row action menu (View, Download PDF, Delete)
- ✅ Bill Detail View + PDF Export (vector, print-ready A4)
- ✅ **UPI Scan-to-Pay QR** on Invoices (generated from your UPI ID)
- ✅ **Shareable public Storefront Catalog** (mobile-friendly link, "Order on WhatsApp")
- ✅ **Promote Product** — auto-generated Instagram-square marketing image + caption/hashtags to share on WhatsApp/Instagram
- ✅ Sales Dashboard with Metrics
- ✅ **Manage Business** settings: logo + signature upload (Cloudinary), business name, phone, e-mail, address, city, pincode, state, GST registered toggle + GSTIN, PAN, business type (multi-select), industry, registration type, extra business details (MSME, website…)
- ✅ Invoice defaults: prefix, default terms, tax rate, UPI, **bank account**
- ✅ **myBillBook-style invoice layout** (on-screen + PDF): seller block with logo, TAX INVOICE meta table, Bill To / Ship To chips, items table, totals, amount in words, authorised signature
- ✅ **Sidebar app shell** (collapsible groups, split Create button, mobile drawer) with a flat indigo theme and one shared dropdown/typeahead component everywhere
- ✅ **In-app Knowledge Base** (feature docs & help)
- ✅ **Playwright UI tests** for the shared dropdown components (`npm run test:ui`)
- ✅ Real-time Data Sync with Firestore
- ✅ Responsive Design (Mobile-Friendly)
- ✅ Modal & Drawer-based Workflows
- ✅ Toast Notifications & Error Boundary
- ✅ Multi-user SaaS Support

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TypeScript |
| UI / Styling | Tailwind CSS v4, shadcn/ui (built on Radix UI primitives); flat indigo "billing software" theme, Source Sans 3 font |
| State Management | Zustand |
| Routing | React Router v7 (`HashRouter` for GitHub Pages) |
| Backend/DB | Firebase (Auth + Firestore) |
| Image Hosting | Cloudinary (unsigned browser uploads) |
| Spreadsheet Parsing | SheetJS (`xlsx`) for Excel/CSV import |
| Icons | FontAwesome |
| PDF Export | jsPDF + jspdf-autotable (loaded on demand from CDN) |
| UI Tests | Playwright (`@playwright/test`, Chromium) against a dev-only harness route |

## 🛠 Prerequisites

- **Node.js** 18+ recommended ([Download](https://nodejs.org/))
- **npm** 9+ or **yarn**
- **Firebase Account** ([Create Free](https://console.firebase.google.com/))

## 📦 Installation & Setup

### 1. Navigate to the Project
```bash
cd d:\project\Bill-Counter
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Follow the steps (no need to enable Google Analytics)
4. Once created, go to Project Settings (gear icon)
5. Copy your config values

### 4. Configure Environment Variables

> ⚠️ **Required.** Without a valid `.env.local`, the app throws `FirebaseError: auth/invalid-api-key` on startup.

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Enable Firebase Services

In your Firebase Console:

**Authentication:**
- Go to Authentication > Sign-in method
- Enable "Email/Password" provider
- Enable "Google" provider (required for the **Google Sign-In** button on the login/register pages)

**Firestore Database:**
- Go to Firestore Database
- Click "Create Database"
- Choose "Start in production mode"
- Select your region

**Firestore Security Rules:**

This app stores data in **flat top-level collections**, each document carrying a `userId` field (queries filter with `where('userId', '==', uid)`). Publish the rules from [`firestore.rules`](firestore.rules) (copied below) in Firebase Console → Firestore → Rules, and keep the two in sync. Notes: **products are publicly readable** to power the shareable catalog; `publicProfiles` exposes only a whitelisted set of public-safe fields; every other collection is owner-only and an owner cannot reassign a document to another `userId`; unknown collections are denied.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ---------- helpers ----------
    function signedIn() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return signedIn() && request.auth.uid == userId;
    }
    // New document must belong to the caller.
    function creatingOwn() {
      return signedIn() && request.resource.data.userId == request.auth.uid;
    }
    // Existing document belongs to the caller AND the update does not
    // reassign it to someone else.
    function updatingOwn() {
      return signedIn()
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid;
    }
    function deletingOwn() {
      return signedIn() && resource.data.userId == request.auth.uid;
    }

    // ---------- users: private business profile (email, bank, GSTIN, PAN…) ----------
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create, update: if isOwner(userId)
        && request.resource.data.uid == userId
        && request.resource.data.businessName is string
        && request.resource.data.businessName.size() <= 200;
      allow delete: if false;
    }

    // ---------- publicProfiles: public-safe mirror for the storefront ----------
    // Anyone can read. Only the owner writes, and only the whitelisted fields.
    match /publicProfiles/{userId} {
      allow read: if true;
      allow create, update: if isOwner(userId)
        && request.resource.data.userId == userId
        && request.resource.data.keys().hasOnly([
          'userId', 'businessName', 'phone', 'upiId', 'tagline', 'catalogTheme', 'logoUrl', 'updatedAt'
        ]);
      allow delete: if isOwner(userId);
    }

    // ---------- products: publicly readable (catalog); owner-only writes ----------
    match /products/{productId} {
      allow read: if true;
      allow create: if creatingOwn()
        && request.resource.data.name is string
        && request.resource.data.name.size() <= 200
        && request.resource.data.price is number
        && request.resource.data.price >= 0;
      allow update: if updatingOwn()
        && request.resource.data.name is string
        && request.resource.data.price is number
        && request.resource.data.price >= 0;
      allow delete: if deletingOwn();
    }

    // ---------- bills: owner only ----------
    match /bills/{billId} {
      allow read: if deletingOwn();
      allow create: if creatingOwn()
        && request.resource.data.billNo is string
        && request.resource.data.items is list
        && request.resource.data.total is number;
      allow update: if updatingOwn();
      allow delete: if deletingOwn();
    }

    // ---------- customers (parties): owner only ----------
    match /customers/{customerId} {
      allow read: if deletingOwn();
      allow create: if creatingOwn()
        && request.resource.data.name is string
        && request.resource.data.name.size() <= 200;
      allow update: if updatingOwn();
      allow delete: if deletingOwn();
    }

    // Everything else is denied (Firestore default), stated explicitly.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

> **Privacy note:** only product listings (name, price, image) and public shop info
> (name, phone, UPI) are exposed via the catalog. Bills, customers, and your email
> stay private.

> **Note:** Product images are **not** stored in Firebase Storage. Firebase now
> requires the paid Blaze plan to use Cloud Storage, so this app uses **Cloudinary**
> (free tier) for image hosting instead — see the next section.

### Image Hosting (Cloudinary)

Product images (single add/edit and bulk import) are uploaded directly from the
browser to Cloudinary using an **unsigned upload preset** — no server, no billing.

1. Create a free account at [cloudinary.com](https://cloudinary.com/).
2. Copy your **Cloud name** from the dashboard.
3. Go to **Settings → Upload → Upload presets → Add upload preset**, set
   **Signing Mode = Unsigned**, and note the preset name.
4. Set both values in [`src/services/db.ts`](src/services/db.ts):

```ts
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name';
const CLOUDINARY_UPLOAD_PRESET = 'your_unsigned_preset';
```

Cloudinary allows browser uploads from any origin, so this works on localhost and
your live site with no CORS setup.

### 6. Start Development Server
```bash
npm run dev
```

The app opens at `http://localhost:5173` (Vite auto-selects the next free port, e.g. `5174`, if 5173 is in use).

## 📁 Project Structure

```
Bill-Counter/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── GoogleButton.tsx           # Google Sign-In
│   │   │   ├── AuthArt.tsx                # decorative side panel on auth pages
│   │   │   └── ProtectedRoute.tsx
│   │   ├── Products/
│   │   │   ├── ProductTable.tsx           # table + bulk-delete + promote actions
│   │   │   ├── ProductFormModal.tsx
│   │   │   ├── ProductDetailSidebar.tsx   # slide-out product detail panel (portal)
│   │   │   ├── PromoteModal.tsx           # marketing image + caption/hashtags share
│   │   │   └── BulkImportModal.tsx        # Excel/CSV import + Cloudinary images
│   │   ├── Customers/
│   │   │   └── CustomerFormModal.tsx      # full-page Add/Edit Customer (GSTIN, PAN, addresses, credit)
│   │   ├── Bills/
│   │   │   ├── BillForm.tsx               # full-page GST invoice editor (Edit / Preview)
│   │   │   ├── InvoicePaper.tsx           # shared invoice layout (detail modal + preview)
│   │   │   └── BillDetailModal.tsx        # invoice view, payment status, PDF / WhatsApp share
│   │   ├── Dashboard/
│   │   │   ├── DashboardMetrics.tsx
│   │   │   └── MetricsCard.tsx
│   │   ├── shared/
│   │   │   ├── Sidebar.tsx                # fixed nav sidebar (mobile drawer), business block, groups
│   │   │   ├── Header.tsx                 # slim top bar: hamburger (mobile) + user badge
│   │   │   ├── Layout.tsx                 # sidebar + header + white content card
│   │   │   ├── UserMenu.tsx               # signed-in user badge (name, email, avatar)
│   │   │   ├── FaIcon.tsx
│   │   │   ├── ToastContainer.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── ui/
│   │       ├── Select.tsx                 # app-wide dropdown: Select, MultiSelect, Combobox (typeahead), portal-positioned
│   │       ├── dropdown-menu.tsx          # shadcn/ui dropdown (Radix-based)
│   │       ├── Pagination.tsx
│   │       └── confirm.tsx                # confirm/prompt dialog provider
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── CustomersPage.tsx
│   │   ├── BillsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── KnowledgeBasePage.tsx          # in-app feature docs
│   │   ├── CatalogPage.tsx                # PUBLIC shareable storefront (no auth)
│   │   └── UiTestPage.tsx                 # dev-only dropdown harness for Playwright (/#/__ui-test)
│   ├── config/
│   │   ├── brand.ts                       # BRAND_NAME (app name; invoice fallback)
│   │   ├── business.ts                    # business / industry / registration type lists
│   │   └── catalogThemes.ts               # storefront theme(s)
│   ├── services/
│   │   ├── firebase.ts          # Firebase config & init
│   │   └── db.ts                # Firestore access (products, bills, customers, profile, catalog)
│   ├── store/
│   │   ├── auth.ts              # Zustand auth store
│   │   └── toast.ts             # Zustand toast store
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   ├── validators.ts        # email/password/GSTIN/PAN validation + Firebase error mapping
│   │   ├── tax.ts               # invoice maths: line/bill totals, CGST/SGST vs IGST, states, dates, amount in words
│   │   ├── pdf.ts               # jsPDF-based invoice export (mirrors InvoicePaper)
│   │   ├── upiQr.ts             # UPI scan-to-pay QR generator
│   │   ├── payment.ts           # payment status helpers
│   │   └── promoImage.ts        # canvas marketing-image + caption generator
│   ├── assets/
│   │   └── qr.ts                # invoice QR / barcode image (swappable sample)
│   ├── lib/
│   │   └── utils.ts             # cn() class-name helper (clsx + tailwind-merge)
│   ├── App.tsx                  # Main router
│   ├── main.tsx
│   └── index.css
├── tests/
│   └── e2e/
│       └── select.spec.ts       # Playwright UI suite for Select / MultiSelect / Combobox
├── public/
├── index.html
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json
├── firebase.json
├── playwright.config.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── components.json
├── tsconfig.json
├── tsconfig.node.json
├── .env.example
└── README.md
```

## 🚀 Running the Project

### Development Mode
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📝 Testing the App

1. **Register:** Go to `/register`, create an account with email & business name (or Google Sign-In)
2. **Login:** Use those credentials to log in
3. **Products:** Add products (name, price, unit, optional HSN, image), **bulk import** from a spreadsheet, or **bulk delete** with row checkboxes
4. **Promote:** Click the 📣 icon on a product to generate a marketing image + caption to share
5. **Share Catalog:** Click **Share Catalog** to copy your public storefront link
6. **Customers:** **Add Customer** to save customers/suppliers with GSTIN, PAN, addresses and credit terms, then reuse them on invoices
7. **Bills:** Click **Create Sales Invoice** (sidebar or Sales Invoices page) for the full-page GST invoice editor: pick a party (Bill To / Ship To, with **Edit Details** for GSTIN/PAN), set number/date/terms, add items (HSN, unit and tax prefill from the product), add charges/discount/round-off, record payment received, preview, save, then export to PDF
8. **Dashboard:** Review sales metrics
9. **Settings:** Fill in **Manage Business** (logo, signature, name, contact, address, GSTIN/PAN, business type) plus invoice defaults, bank account and terms
10. **Knowledge Base:** In-app help explaining every feature

> **Navigation:** A fixed left **sidebar** (drawer on mobile) holds your business name, a **Create Sales Invoice** split button (its chevron opens a menu with **Add Customer**, **Add Product** and **Sales Invoice**), and collapsible groups with chevrons — General: Dashboard, Customers (All / Add), Products (All / Add), Sales (Sales Invoices / Create Sales Invoice); Business: Settings (Business Settings / Knowledge Base) — plus **Logout** pinned at the bottom. The top bar shows only the signed-in user's name, email and avatar.

### 📥 Bulk Import Products (Excel / CSV)

From the **Products** page → **Import**:

1. **Prepare a sheet** with columns `name`, `price`, and optionally `hsn`, `unit` and `image`
   (headers are flexible: `productname`/`title`, `amount`/`cost`, `hsncode`/`sac`, `uom`, `imageurl`/`link`):
   ```csv
   name,price,hsn,unit,image
   T-Shirt,450,6109,PCS,https://example.com/tshirt.jpg
   Coffee Mug,299,,PCS,
   ```
2. **Images on your computer:** a browser can't read local paths (`C:\pics\mug.jpg`).
   Click **Upload Product Images**, select the actual files — they upload to Cloudinary
   and are matched to products by the **filename in the sheet's image column**
   (falls back to matching the product name if there's no image column).
3. **Upload the `.xlsx` / `.csv`** — products are created with images attached where matched.

### 🛍️ Shareable Storefront Catalog

A public, mobile-friendly catalog that sellers can share on Instagram/WhatsApp:

1. On the **Products** page, click **Share Catalog** → the public link is copied
   (`.../#/catalog/<userId>`).
2. Anyone can open it (no login) and see the shop's products with images/prices.
3. Each product has an **"Order on WhatsApp"** button that opens WhatsApp with a
   pre-filled message. The button appears when the seller's **Phone** (WhatsApp
   number) is set in **Settings**.
4. The catalog uses a fixed default theme; the seller's shop name comes from
   **Settings → Business Name**. Public data is mirrored to `publicProfiles`
   whenever Settings are saved.

> Requires the **public** Firestore rules above to be published, and the seller
> to save **Settings** once (to create their `publicProfiles` doc).

### 📣 Promote Product (Marketing)

Click the **📣 megaphone** icon on any product to open the Promote dialog:

- Auto-generates a **1080×1080 Instagram-square image** (product photo + shop name +
  price badge) on a canvas — see [`src/utils/promoImage.ts`](src/utils/promoImage.ts).
- Auto-writes a **caption + hashtags** (editable).
- **Share** (mobile only — opens the native share sheet to Instagram/WhatsApp with
  the image), **Download image**, **Copy caption**, and **WhatsApp** (text).

> Instagram/WhatsApp don't allow web apps to attach an image *and* caption in one
> action, and desktop browsers can't push images to those apps — so the Share
> button only appears on devices that support image sharing (mobile). On desktop,
> use Download + Copy and post manually.

## 🎨 Customization

### Theme (colours & font)
The whole UI is driven by a handful of tokens at the top of [`src/index.css`](src/index.css):

- `--color-brand-*` — the indigo primary scale used for buttons, links, focus rings, table headers and badges (classes `bg-brand-600`, `text-brand-700`, …).
- `--color-accent-*` — the orange accent (`.btn-accent`) for a single main call-to-action.
- `--font-sans` — Source Sans 3 (bundled via `@fontsource-variable/source-sans-3`).

Component utilities (`.btn-primary`, `.btn-secondary`, `.btn-accent`, `.card`, `.input-field`) live in the same file, so changing the palette or font is a one-file edit. The public storefront catalog keeps its own per-shop themes in [`src/config/catalogThemes.ts`](src/config/catalogThemes.ts).

### App Name / Branding
The app name (**Bill Counter**) appears in the header, login/register pages, and browser tab. To rename, update the text in `src/components/shared/Header.tsx`, `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`, and the `<title>` in `index.html`.

**Invoices show each seller's own business name, logo and signature** from **Settings → Manage Business**. [`src/config/brand.ts`](src/config/brand.ts) (`BRAND_NAME`) is only the fallback when a seller has not set a business name or logo, plus the small "Generated with" footer line on PDFs.

### Invoice QR / Barcode
Invoices show a QR/barcode driven by a single constant in [`src/assets/qr.ts`](src/assets/qr.ts). It ships with a generated placeholder — replace `INVOICE_QR` with your own image to use it everywhere (both the on-screen invoice and the PDF):

```ts
export const INVOICE_QR = 'data:image/png;base64,....';   // data URL (recommended)
// or a hosted URL (must allow CORS), or an imported image file
export const INVOICE_QR_CAPTION = 'Scan to pay / verify'; // set '' to hide
```

## 🔐 Firestore Collections Schema

Collections are flat and top-level; each document stores its owner's `userId`.

```
users/{userId}
├── uid: string
├── email: string
├── businessName: string
├── address: string (optional)
├── phone: string (optional)
├── invoiceNotes: string (optional)
├── upiId: string (optional)          # powers the invoice scan-to-pay QR
├── billPrefix: string (optional)     # e.g. "INV" -> INV-0001
├── taxEnabled: boolean (optional)
├── defaultTaxRate: number (optional) # default GST %, e.g. 18
├── gstin: string (optional)
├── state: string (optional)          # business state; decides CGST+SGST vs IGST
├── companyEmail, city, pincode, pan: string (optional)
├── gstRegistered: boolean (optional) # false hides GSTIN on invoices
├── businessTypes: string[] (optional), industryType, registrationType: string (optional)
├── logoUrl, signatureUrl: string (optional)        # Cloudinary URLs
├── businessDetails: array<{ label, value }> (optional)  # e.g. MSME, Website — printed on invoices
├── bankName / bankAccountNo / bankIfsc / bankBranch / bankAccountHolder: string (optional)
└── createdAt: timestamp

publicProfiles/{userId}                # public-safe mirror for the shareable catalog
├── userId: string
├── businessName: string
├── phone: string (optional)           # used for "Order on WhatsApp"
├── upiId: string (optional)
├── logoUrl: string (optional)         # shown on the catalog header
└── updatedAt: timestamp

products/{productId}
├── userId: string
├── name: string
├── price: number
├── imageUrl: string (optional)       # Cloudinary URL
├── hsn: string (optional)            # prefilled onto invoice lines
├── unit: string (optional)           # e.g. PCS, KGS
├── taxRate: number (optional)        # default GST % for this product
└── createdAt: timestamp

customers/{customerId}                 # "parties" — customers and suppliers
├── userId: string
├── name: string
├── phone: string (optional)
├── email: string (optional)
├── address: string (optional)        # billing address
├── partyType: 'customer' | 'supplier' (defaults to customer)
├── category: string (optional)
├── gstin: string (optional)
├── pan: string (optional)
├── shippingAddress: string (optional)
├── shippingSameAsBilling: boolean
├── openingBalance: number, openingBalanceType: 'to_collect' | 'to_pay'
├── creditPeriod: number (days)       # default payment terms on new invoices
├── creditLimit: number
└── createdAt: timestamp

bills/{billId}
├── userId: string
├── billNo: string, billSeqNum: number, billPrefix: string
├── customerName: string, customerId: string (optional), customerPhone: string (optional)
├── billTo: { name, address, phone, email, gstin, pan }     # snapshot at billing time
├── shipTo: { name, address, phone }
├── invoiceDate: 'yyyy-mm-dd', dueDate: 'yyyy-mm-dd', paymentTerms: number (days)
├── placeOfSupply: string, vehicleNo: string (optional)
├── items: array<{ productId?, productName, description?, hsn?, unit?, quantity, price,
│                  discount?, discountPercent?, taxRate?, taxable?, taxAmount?, total }>
├── subtotal: number                  # sum of line totals (incl. line tax)
├── taxableAmount: number, itemDiscount: number, billDiscount: number
├── cgst: number, sgst: number, igst: number
├── tax: number                       # total tax amount
├── discount: number (optional)       # itemDiscount + billDiscount (kept for legacy readers)
├── taxRate: number (optional)        # only when every taxed line shares one rate (legacy)
├── additionalCharges: array<{ label, amount }>
├── roundOff: number
├── termsAndConditions: string, showBankDetails: boolean, showPaymentQr: boolean
├── total: number
├── paymentStatus: 'paid' | 'partial' | 'unpaid'
├── amountPaid: number
├── paymentMethod: 'cash'|'upi'|'card'|'bank'|'other' (optional)
├── paidAt: timestamp (optional)
├── createdAt: timestamp
└── notes: string (optional)
```

> Every new invoice field is optional. Bills and customers created before the GST
> editor keep working and render with their original layout.
>
> The `customers` collection is queried by `userId` only (sorted client-side) to
> avoid needing a composite index. Firestore rules should scope every collection
> by the `userId` field, the same way `products` and `bills` are scoped above.

## 📚 Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server (default port 5173) |
| `npm run build` | Type-check (`tsc`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run test:ui` | Run the Playwright UI suite for the shared dropdown/typeahead components (starts `vite` on port 5199 automatically) |
| `npm run test:ui:headed` | Same, with a visible browser |
| `npm run deploy` | Build and publish `dist/` to the `gh-pages` branch |

## 🧪 UI Tests (Playwright)

The shared dropdown components in [`src/components/ui/Select.tsx`](src/components/ui/Select.tsx) — `Select`, `MultiSelect` and `Combobox` — are covered by a Playwright suite in [`tests/e2e/select.spec.ts`](tests/e2e/select.spec.ts). It exercises a **dev-only harness page** at `/#/__ui-test` ([`src/pages/UiTestPage.tsx`](src/pages/UiTestPage.tsx)), which is mounted only under `vite dev` and never ships in production builds. No Firebase calls are made.

```bash
npx playwright install chromium   # one time
npm run test:ui
```

Covered (22 tests): open/close (click, outside click, Escape, Tab), option selection and the active check mark, the automatic search box for lists over 10 options with "No match", keyboard navigation (arrows / Enter, including from inside the search box), clear button, disabled state, single-open-panel rule, no clipping inside `overflow-hidden` input groups and `overflow-x-auto` table cells, right-edge alignment, flipping upward near the viewport bottom, following the trigger on scroll, multi-select toggling, and the item-name typeahead (filtering, hint prices, pick by mouse and keyboard, free text, no native `datalist`).

Playwright output (`test-results/`, `playwright-report/`) is git-ignored. Use `--repeat-each 3` to shake out flakiness after changing the component.

## 🐛 Troubleshooting

### `FirebaseError: auth/invalid-api-key` on startup
- `.env.local` is missing or has placeholder values. Create it from `.env.example` and fill in real Firebase credentials.
- Restart the dev server after editing `.env.local` (Vite only reads env vars at startup).

### "Cannot find module 'firebase'"
```bash
npm install
```

### Port 5173 Already in Use
Vite automatically uses the next available port, or specify one manually:
```bash
npm run dev -- --port 3000
```

### Firestore Permission Error
- Confirm the Firestore Rules above are published
- Ensure the user is logged in
- Confirm each product/bill document has a `userId` field matching the signed-in user

## 🚢 Deployment

### Deploy to GitHub Pages (current setup)

This project is configured for GitHub Pages:
- `vite.config.ts` sets `base: '/Bill-Counter/'` (the repo name)
- The app uses `HashRouter` so deep links / refreshes don't 404
- `gh-pages` handles publishing via `predeploy` + `deploy` scripts

```bash
# One-time: install the publisher (already a devDependency here)
npm install --save-dev gh-pages

# Build and publish to the gh-pages branch
npm run deploy
```

Then, in the GitHub repo → **Settings → Pages** → Source: **Deploy from a branch** →
Branch: **`gh-pages`** / `/ (root)`. The site goes live at
`https://<username>.github.io/Bill-Counter/`.

> **Also required for a working live site:**
> - Firebase Console → **Authentication → Settings → Authorized domains** → add your
>   Pages domain (e.g. `<username>.github.io`), or login will fail.
> - `VITE_FIREBASE_*` values are baked in at **build time** — build locally with a
>   valid `.env.local`, or add them as CI secrets if building via GitHub Actions.
> - Cloudinary needs no setup for the live domain (unsigned uploads work anywhere).

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize Firebase (set "dist" as the public directory)
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy
```

Your app will be live at `https://your-project.web.app`

### Deploy to Vercel (Alternative)

```bash
npm i -g vercel
vercel
```

Set the Firebase `VITE_*` environment variables in your hosting provider's dashboard.

## 📚 Documentation

| File | Purpose |
|------|---------|
| [README.md](README.md) | Setup, features, schema, deployment (this file, authoritative) |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Phase summary, what is shipped, route map, cleanup backlog |
| [walkthrough.md](walkthrough.md) | Historical implementation notes for the products, bills, and dashboard phases (mentions the old html2pdf export and Firebase Storage, both since replaced) |
| [FIREBASE_SETUP.md](FIREBASE_SETUP.md), [FIREBASE_SETUP_CHECKLIST.md](FIREBASE_SETUP_CHECKLIST.md), [QUICK_START.md](QUICK_START.md) | Legacy step-by-step Firebase onboarding guides (predate the project rename; the README takes precedence where they differ) |

## 📧 Support

For issues or questions:
1. Check Firestore Rules in the Console
2. Review the browser console for errors
3. Verify Firebase project configuration
4. Check `.env.local` file setup

## 📄 License

MIT
