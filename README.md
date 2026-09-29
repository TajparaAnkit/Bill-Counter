# myBillCounter - SaaS Platform

A modern, scalable SaaS application for managing small business inventory and billing. Built with React 19, Vite, Tailwind CSS, shadcn/ui, and Firebase.

> **Status:** All planned phases are shipped, including the GST invoice editor, Manage Business settings, the light violet theme with collapsible sidebar and top-bar search, **client plans with per-client feature switches**, **invoice edit / cancel**, **stock tracking**, **WhatsApp payment reminders**, **quotations**, and a Playwright suite (component + end-to-end). See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the phase summary, route map, and cleanup backlog.

## 🚀 Features

- ✅ User Authentication (email & password Register / Login, **Forgot password** reset)
- ✅ Product Management (Add, Edit, Delete, **Bulk Delete**) with optional **HSN / SAC code** and **unit** per product (prefilled on invoice lines)
- ✅ **Bulk Import from Excel / CSV** with image upload (matched by filename)
- ✅ Product image hosting via **Cloudinary** (no billing / Blaze plan needed)
- ✅ Slide-out Product Detail panel (right-side drawer)
- ✅ **Customer Directory** (customers & suppliers) with **GSTIN / PAN validation**, billing + shipping address, credit period & limit, opening balance
- ✅ **GST-style Invoice Editor** (full page, Edit / Preview modes): Bill To with per-invoice **Edit Details** (address, GSTIN, PAN), Ship To, Place of Supply, editable prefix + number, invoice & due date, payment terms, vehicle no.
- ✅ Line items with **HSN, unit, per-item discount (₹/%) and per-item GST rate**; **CGST/SGST or IGST** split, additional charges, bill discount, auto round-off, amount in words
- ✅ **Payment Tracking** at creation and later (Paid / Partial / Unpaid + method: cash, UPI, card, bank), balance shown on invoice
- ✅ **Sales Invoices list**: Total / Paid / Unpaid tiles that filter the table, date range + search, Due In (overdue days), amount with unpaid balance, row action menu (View, Edit, Record payment, Cancel / Restore, Delete)
- ✅ **Export invoices to Excel** from Sales Invoices for the selected date range (Last 30 / 90 / 365 Days / All Time), tab and search: an *Invoices* sheet (GSTIN, taxable, CGST/SGST/IGST, total, received, balance, status + TOTAL row) and an *Items* sheet (HSN, qty, rate, GST %, amount); cancelled invoices are excluded from totals
- ✅ **Edit saved invoices** (number and recorded payments are kept) and **Cancel invoice** (keeps the number so the GST series has no gaps; excluded from totals, balances, statements and dashboard; restorable; PDF stamped CANCELLED)
- ✅ **Stock tracking** (optional per product): invoices reduce stock, edits move the difference, cancel / delete put it back — written atomically with the invoice; live "In stock" hint and over-stock warning in the editor; Stock column, **Low stock** filter and a dashboard low-stock alert
- ✅ **WhatsApp payment reminders** from invoice rows, the invoice view, the dashboard overdue list and Customers (whole outstanding balance), with amount, invoice number and UPI ID
- ✅ **Quotations / estimates** with their own number series (QT-0001), "Valid Till", PDF titled QUOTATION, and one-click **Convert to Invoice** (quotation marked Converted · INV-xxxx)
- ✅ **Client plans & feature switches**: 14-day trial on signup, trial / expiry banner, expired or blocked accounts become read-only (enforced in Firestore rules), and an admin-only **Clients** page to set each client's plan, validity and features
- ✅ Bill Detail View + PDF Export (vector, print-ready A4)
- ✅ **UPI Scan-to-Pay QR** on Invoices (generated from your UPI ID)
- ✅ **Shareable public Storefront Catalog** (mobile-friendly link, "Order on WhatsApp")
- ✅ **Promote Product** — auto-generated Instagram-square marketing image + caption/hashtags to share on WhatsApp/Instagram
- ✅ Sales Dashboard with Metrics
- ✅ **Manage Business** settings: logo + signature upload (Cloudinary), business name, phone, e-mail, address, city, pincode, state, GST registered toggle + GSTIN, PAN, business type (multi-select), industry, registration type, extra business details (MSME, website…)
- ✅ Invoice defaults: prefix, default terms, tax rate, UPI, **bank account**
- ✅ **myBillBook-style invoice layout** (on-screen + PDF): seller block with logo, TAX INVOICE meta table, Bill To / Ship To chips, items table, totals, amount in words, authorised signature
- ✅ **Sidebar app shell** (collapsible groups, split Create button, mobile drawer) with a flat indigo theme and one shared dropdown/typeahead component everywhere
- ✅ **In-app Knowledge Base** (feature docs & help; articles for features outside the client's plan are hidden)
- ✅ **Playwright tests**: the shared dropdown components plus end-to-end flows in demo mode (`npm run test:ui`)
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
| UI Tests | Playwright (`@playwright/test`, Chromium): a dev-only component harness route + end-to-end flows against demo mode |

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
- Enable "Email/Password" provider (the only sign-in method the app uses — Google Sign-In is not supported)

**Firestore Database:**
- Go to Firestore Database
- Click "Create Database"
- Choose "Start in production mode"
- Select your region

**Firestore Security Rules:**

This app stores data in **flat top-level collections**, each document carrying a `userId` field (queries filter with `where('userId', '==', uid)`). Publish the rules from [`firestore.rules`](firestore.rules) (copied below) in Firebase Console → Firestore → Rules, and keep the two in sync. Notes: business-data writes require an active plan (`hasActivePlan()`); `accounts` and `admins` can't be changed by clients; **products are publicly readable** to power the shareable catalog; `publicProfiles` exposes only a whitelisted set of public-safe fields; every other collection is owner-only and an owner cannot reassign a document to another `userId`; unknown collections are denied.

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
    // Admins are added by hand in the Firebase Console: admins/{uid} (any fields).
    function isAdmin() {
      return signedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    // Plan not expired and not blocked. Checked on create/update of business data,
    // so an expired client can still view (and delete) their records but not add or edit.
    function hasActivePlan() {
      let acc = /databases/$(database)/documents/accounts/$(request.auth.uid);
      return exists(acc)
        && get(acc).data.status == 'active'
        && get(acc).data.validTill > request.time;
    }

    // ---------- users: private business profile (email, bank, GSTIN, PAN…) ----------
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create, update: if isOwner(userId)
        && request.resource.data.uid == userId
        && request.resource.data.businessName is string
        && request.resource.data.businessName.size() <= 200;
      allow delete: if false;
    }

    // ---------- publicProfiles: public-safe mirror for the storefront ----------
    // Anyone can read. The owner writes only the whitelisted fields; `catalogEnabled`
    // (Online Catalog feature) is set by the admin and the owner can't change it.
    match /publicProfiles/{userId} {
      function ownerFieldsOnly() {
        return isOwner(userId)
          && request.resource.data.userId == userId
          && request.resource.data.keys().hasOnly([
            'userId', 'businessName', 'phone', 'upiId', 'tagline', 'catalogTheme', 'logoUrl', 'updatedAt', 'catalogEnabled'
          ]);
      }
      allow read: if true;
      allow create: if (ownerFieldsOnly() && !('catalogEnabled' in request.resource.data)) || isAdmin();
      allow update: if (ownerFieldsOnly()
          && request.resource.data.get('catalogEnabled', null) == resource.data.get('catalogEnabled', null))
        || isAdmin();
      allow delete: if isOwner(userId);
    }

    // ---------- accounts: plan, validity and features per client ----------
    // The client can read theirs and create only the default trial (no features,
    // at most 15 days). Every later change is made by the admin.
    match /accounts/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId)
        && request.resource.data.keys().hasOnly(['uid', 'email', 'businessName', 'plan', 'status', 'validTill', 'createdAt'])
        && request.resource.data.uid == userId
        && request.resource.data.plan == 'trial'
        && request.resource.data.status == 'active'
        && request.resource.data.validTill is timestamp
        && request.resource.data.validTill <= request.time + duration.value(15, 'd');
      allow update: if isAdmin();
      allow delete: if false;
    }

    // ---------- admins: managed only from the Firebase Console ----------
    match /admins/{userId} {
      allow read: if isOwner(userId);
      allow write: if false;
    }

    // ---------- products: publicly readable (catalog); owner-only writes ----------
    match /products/{productId} {
      allow read: if true;
      allow create: if creatingOwn() && hasActivePlan()
        && request.resource.data.name is string
        && request.resource.data.name.size() <= 200
        && request.resource.data.price is number
        && request.resource.data.price >= 0;
      allow update: if updatingOwn() && hasActivePlan()
        && request.resource.data.name is string
        && request.resource.data.price is number
        && request.resource.data.price >= 0;
      allow delete: if deletingOwn();
    }

    // ---------- bills: owner only ----------
    match /bills/{billId} {
      allow read: if deletingOwn();
      allow create: if creatingOwn() && hasActivePlan()
        && request.resource.data.billNo is string
        && request.resource.data.items is list
        && request.resource.data.total is number;
      allow update: if updatingOwn() && hasActivePlan();
      allow delete: if deletingOwn();
    }

    // ---------- quotations: owner only (same shape as bills) ----------
    match /quotations/{quotationId} {
      allow read: if deletingOwn();
      allow create: if creatingOwn() && hasActivePlan()
        && request.resource.data.billNo is string
        && request.resource.data.items is list
        && request.resource.data.total is number;
      allow update: if updatingOwn() && hasActivePlan();
      allow delete: if deletingOwn();
    }

    // ---------- customers (parties): owner only ----------
    match /customers/{customerId} {
      allow read: if deletingOwn();
      allow create: if creatingOwn() && hasActivePlan()
        && request.resource.data.name is string
        && request.resource.data.name.size() <= 200;
      allow update: if updatingOwn() && hasActivePlan();
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
│   │   │   ├── InvoicePaper.tsx           # shared invoice / quotation layout (detail modal + preview)
│   │   │   ├── RecordPaymentModal.tsx
│   │   │   └── BillDetailModal.tsx        # invoice view: payments, Edit, Remind, PDF / WhatsApp share
│   │   ├── Dashboard/
│   │   │   ├── DashboardMetrics.tsx
│   │   │   └── MetricsCard.tsx
│   │   ├── shared/
│   │   │   ├── Sidebar.tsx                # fixed nav sidebar (mobile drawer), business block, groups
│   │   │   ├── Header.tsx                 # slim top bar: hamburger (mobile) + user badge
│   │   │   ├── Layout.tsx                 # sidebar + header + plan banner + content
│   │   │   ├── PlanBanner.tsx             # trial / expiry / blocked notice
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
│   │   ├── LandingPage.tsx            # PUBLIC landing page at #/ (copy in landing/content.ts)
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── CustomersPage.tsx
│   │   ├── BillsPage.tsx                  # invoices: create / edit / cancel / delete, convert from quotation
│   │   ├── QuotationsPage.tsx             # quotations list, editor, view, convert to invoice
│   │   ├── CustomerStatementPage.tsx      # party statement (ledger)
│   │   ├── AdminPage.tsx                  # admin only: clients list
│   │   ├── AdminClientPage.tsx            # admin only: one client's plan, validity, features, status, notes
│   │   ├── SettingsPage.tsx
│   │   ├── KnowledgeBasePage.tsx          # in-app feature docs
│   │   ├── CatalogPage.tsx                # PUBLIC shareable storefront (no auth)
│   │   └── UiTestPage.tsx                 # dev-only dropdown harness for Playwright (/#/__ui-test)
│   ├── config/
│   │   ├── brand.ts                       # BRAND_NAME, SUPPORT_PHONE / SUPPORT_EMAIL (renewal contact)
│   │   ├── features.ts                    # plans, switchable features, trial length, hasFeature / canWrite
│   │   ├── nav.ts                         # sidebar / search / create-menu items (feature-gated)
│   │   ├── business.ts                    # business / industry / registration type lists
│   │   └── catalogThemes.ts               # storefront theme(s)
│   ├── services/
│   │   ├── firebase.ts          # Firebase config & init
│   │   └── db.ts                # Firestore access (products, bills, quotations, customers, profile, catalog, accounts)
│   ├── store/
│   │   ├── auth.ts              # Zustand auth store
│   │   ├── account.ts           # signed-in client's plan / features / admin flag (loaded once)
│   │   └── toast.ts             # Zustand toast store
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAccount.ts        # useAccount(), useFeature('stock')…
│   │   └── useToast.ts
│   ├── dev/
│   │   ├── demoDb.ts            # in-memory stand-in for db.ts (npm run dev:demo, e2e tests)
│   │   └── demoAuth.ts          # always signed in as a demo admin
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   ├── validators.ts        # email/password/GSTIN/PAN validation + Firebase error mapping
│   │   ├── tax.ts               # invoice maths: line/bill totals, CGST/SGST vs IGST, states, dates, amount in words
│   │   ├── pdf.ts               # jsPDF-based invoice export (mirrors InvoicePaper)
│   │   ├── upiQr.ts             # UPI scan-to-pay QR generator
│   │   ├── payment.ts           # payment status helpers
│   │   ├── stock.ts             # stock deltas between invoice versions, low-stock check
│   │   ├── reminder.ts          # WhatsApp payment reminder messages (invoice / party)
│   │   ├── exportInvoices.ts    # Sales Invoices → Excel (Invoices + Items sheets)
│   │   ├── docs.ts              # invoice vs quotation labels, cancelled filter
│   │   ├── ledger.ts            # party statement maths
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
│       ├── select.spec.ts       # Playwright UI suite for Select / MultiSelect / Combobox
│       └── flows.spec.ts        # end-to-end flows (invoices, stock, reminders, quotations, admin)
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

1. **Register:** Go to `/register`, create an account with business name, email and password
2. **Login:** Use those credentials to log in
3. **Products:** Add products (name, price, unit, optional HSN, image), **bulk import** from a spreadsheet, or **bulk delete** with row checkboxes
4. **Promote:** Click the 📣 icon on a product to generate a marketing image + caption to share
5. **Share Catalog:** Click **Share Catalog** to copy your public storefront link
6. **Customers:** **Add Customer** to save customers/suppliers with GSTIN, PAN, addresses and credit terms, then reuse them on invoices
7. **Bills:** Click **Create Sales Invoice** (sidebar or Sales Invoices page) for the full-page GST invoice editor: pick a party (Bill To / Ship To, with **Edit Details** for GSTIN/PAN), set number/date/terms, add items (HSN, unit and tax prefill from the product), add charges/discount/round-off, record payment received, preview, save, then export to PDF
8. **Edit / cancel:** open an invoice → **Edit**, or **⋯ → Cancel invoice / Restore invoice / Delete** on its row
9. **Stock:** edit a product → **Track stock** (current stock + low-stock alert), bill it, and watch the Stock column and dashboard alert
10. **Reminders:** click the 🔔 on an unpaid invoice or a customer with a balance to open WhatsApp with a ready message
11. **Quotations:** **Quotations → Create Quotation**, then **Convert to Invoice**
12. **Dashboard:** Review sales metrics, overdue invoices and low-stock alerts
13. **Settings:** Fill in **Manage Business** (logo, signature, name, contact, address, GSTIN/PAN, business type) plus invoice defaults, bank account and terms
14. **Knowledge Base:** In-app help explaining every feature
15. **Admin:** after adding yourself to `admins` (see below), open **Admin → Clients**

> **Try it without Firebase:** `npm run dev:demo` runs the app with in-memory sample data, signed in as a demo admin with every feature on.

> **Navigation:** A fixed left **sidebar** (collapsible to an icon rail; a drawer on mobile) with groups — Overview: Dashboard; Sales: Sales Invoices, Quotations, Customers, Products; Business: Settings, Help Center; Admin: Clients (admins only) — and your business card with **Logout** at the bottom. Items for features outside the client's plan are hidden. The top bar has a global search (Ctrl/⌘+K), a **New Invoice** split button whose menu offers **New Quotation**, **Add Customer** and **Add Product**, a Help link and the user avatar.

### 📥 Bulk Import Products (Excel / CSV)

From the **Products** page → **Import**:

1. **Start from the sample:** click **Download sample Excel** in the Import window (or in the Help Center article *Import products from Excel / CSV*). It is built by [`src/utils/sampleProducts.ts`](src/utils/sampleProducts.ts): a *Products* sheet with every column and 5 example rows, plus an *Instructions* sheet.
   Columns: `name` and `price` (required), `unit`, `hsn`, `gst` (%), `stock` (opening stock; fills turn on stock tracking), `low_stock` (alert level) and `image`.
   Headers are flexible: `productname`/`title`, `amount`/`cost`, `uom`, `hsncode`/`sac`, `tax`/`gstrate`, `openingstock`, `reorderlevel`, `imageurl`/`link`:
   ```csv
   name,price,unit,hsn,gst,stock,low_stock,image
   Cotton T-Shirt,450,PCS,6109,5,100,10,https://example.com/tshirt.jpg
   Basmati Rice,95,KGS,1006,5,250,25,
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

### 📤 Export Invoices to Excel

**Sales Invoices → Export** downloads `Sales_Invoices_<period>_<date>.xlsx` with exactly the invoices the table shows (date range, status tab and search; all pages). Built in [`src/utils/exportInvoices.ts`](src/utils/exportInvoices.ts) with SheetJS:

- **Invoices** sheet: invoice no., dates, customer, phone, GSTIN, place of supply, taxable amount, CGST, SGST, IGST, total tax, discount, charges, round off, total, received, balance, status, payment mode, and a **TOTAL** row.
- **Items** sheet: one row per line: invoice no., date, customer, GSTIN, item, HSN, qty, unit, rate, discount, taxable, GST %, tax, amount.
- Cancelled invoices appear with status *Cancelled* but are left out of the TOTAL row and the Items sheet.

### 🎨 Invoice Templates (admin-controlled)

Five print designs for invoices and quotations, on screen, in the PDF and on WhatsApp shares:

| Design | Paper | Notes |
|---|---|---|
| **Classic** (default) | A4 | The original layout. Always available; this code path ([`InvoicePaper.tsx`](src/components/Bills/InvoicePaper.tsx), `buildInvoiceDoc` in [`pdf.ts`](src/utils/pdf.ts)) is unchanged. |
| Modern | A4 | Colour header band, meta cards, highlighted total (uses the accent colour) |
| Minimal | A4 | Black-and-white with one accent rule, ink-saving |
| Thermal 3" | 80 mm | Receipt; the PDF page is exactly as tall as the bill |
| Thermal 2" | 58 mm | Same, for small / Bluetooth printers |

- **Control is on the admin side:** on the client's screen (`/#/admin/clients/<uid>` → *Invoice templates*) the admin ticks which designs are available, picks the default and the accent colour, and can let the client choose in their own **Settings → Invoice Template** (off by default). Stored in `accounts/{uid}.invoice`; the client's pick goes to `users/{uid}.invoiceTemplate / invoiceColor`.
- The design in use is resolved by `resolveTemplate()` in [`src/config/invoiceTemplates.ts`](src/config/invoiceTemplates.ts): the client's pick if allowed, otherwise the admin default, otherwise **Classic**, so removing a design never breaks a client.
- New designs: screen in [`InvoiceTemplates.tsx`](src/components/Bills/InvoiceTemplates.tsx), PDFs in [`pdfTemplates.ts`](src/utils/pdfTemplates.ts) (loaded only when used), both fed by [`invoiceView.ts`](src/utils/invoiceView.ts) so totals, GST splits and labels match Classic.

### 🏠 Landing Page

The site root (`https://<username>.github.io/Bill-Counter/`, route `#/`) is a public, modern landing page ([`src/pages/LandingPage.tsx`](src/pages/LandingPage.tsx), loaded only when visited so the app bundle stays small):

- **Header:** section links (Features, Invoice designs, Plans, FAQ), an **EN / हिं** switch (remembered per browser), **Login** → `#/login` and **Start free trial** → `#/register`. Signed-in visitors see **Open Dashboard** instead, and `#/login` / `#/register` send an already signed-in user straight to the dashboard.
- **Look:** white + corporate blue theme; soft blue tinted bands with faint grid lines on the Why, Anywhere and Plans sections; each section title highlights its key words in its own style (gradient, swoosh underline, marker, pill, solid blue; marked with `*…*` in `content.ts`); real app screenshots in laptop and phone frames; dark multi-column footer (Get in touch, Product, Account, Resources with the sample products Excel).
- **Sections:** hero, trust strip, problem → solution, **"Why myBillCounter is the best billing app for small businesses"** (7 numbered items: GST invoicing, share & get paid, payment collection, inventory, quotations, reports & dashboard, online catalog; the active item expands with a progress bar and its phone screen shows on the right; it auto-advances every 6 s while on screen, pauses on hover, and respects reduced-motion), a compact "And much more" grid of 16 features, invoice designs, "Run your business from anywhere" (laptop + phone), how it works, who it's for, plans, FAQ and a final call to action.
- **Plans** are read from `PLANS` / `FEATURES` in [`src/config/features.ts`](src/config/features.ts) (no prices; Basic / Pro show "Contact us for pricing" and email `SUPPORT_EMAIL`).
- **Copy** (English + Hindi) is in [`src/pages/landing/content.ts`](src/pages/landing/content.ts). **Screenshots** are real app pages from demo mode in `public/landing/`; refresh them with `npm run landing-shots` after changing the app.
- **Link previews / SEO:** `index.html` has a description plus Open Graph / Twitter tags with `public/og-image.png` (the wide marketing image), so shared links show a rich card on WhatsApp, Facebook and LinkedIn. If you move to your own domain, update the two absolute URLs (`og:url`, `og:image`) in `index.html`.

### ✏️ Edit & Cancel Invoices

- **Edit:** invoice view → **Edit**, or **⋯ → Edit** on the row. Opens the same editor prefilled; the invoice number is locked and recorded payments are kept (paid amount / status are recomputed against the new total). Payments are still added or removed from the invoice view.
- **Cancel invoice:** keeps the document and its number (no gaps in the GST series) but sets `cancelled: true`. Cancelled invoices show a **Cancelled** pill and tab, are struck through, can't be edited or paid, are left out of KPI tiles, dashboard, customer balances and party statements (see `isLiveBill` in [`src/utils/docs.ts`](src/utils/docs.ts)), and print with a red **CANCELLED** badge. **Restore invoice** undoes it.
- **Delete** still exists and permanently removes the invoice; its confirmation suggests cancelling instead.

### 📦 Stock Tracking

- Per product and optional: **Track stock for this product** in the product form stores `stock` and `lowStock` (alert level). Products without them are not tracked.
- Every stock-changing action writes the stock `increment()`s **in the same Firestore batch** as the invoice, so stock and invoices never drift: save (−qty), edit (−difference, computed per product by `stockDeltas` in [`src/utils/stock.ts`](src/utils/stock.ts)), cancel / delete (+qty back), restore (−qty again). Quotations never touch stock.
- The editor shows **In stock: N** under the quantity (accounting for what the invoice being edited already took) and **Only N in stock** in red when a line asks for more; saving is still allowed.
- Products page: **Stock** column, **Low stock (N)** filter (`/#/products?stock=low`); Dashboard: low-stock alert bar.
- Stock only moves while the client's **Stock Tracking** feature is on.

### 🔔 WhatsApp Payment Reminders

Messages are built in [`src/utils/reminder.ts`](src/utils/reminder.ts) and opened as `wa.me` links (amount due, invoice number and dates, the seller's UPI ID and name). Available on unpaid invoice rows, the invoice view (**Remind**), the dashboard overdue list and the Customers list (party's total outstanding). Not shown for paid or cancelled invoices.

### 📝 Quotations

- **Quotations** page (sidebar, and **New Quotation** in the create menu). Same editor as invoices with `docType="quotation"`: own number series (`QT-0001`, from the `quotations` collection), **Valid Till** instead of Due Date, no payment section or payment QR. PDF / on-screen title is **QUOTATION**.
- **Convert to Invoice** opens `/#/bills?fromQuote=<id>`: a new invoice prefilled with the party and items, today's date and the next invoice number. Saving writes the invoice and marks the quotation `convertedBillId` / `convertedBillNo` in one batch; a converted quotation can't be converted again. Quotations past Valid Till show **Expired**.

### 👥 Client Plans, Trial & Feature Switches

The app is multi-tenant: every client signs up on the same site and sees only their own data. On top of that:

- **Accounts:** the first time a client signs in, an `accounts/{uid}` document is created with a **14-day trial** (`TRIAL_DAYS` in [`src/config/features.ts`](src/config/features.ts)). Clients can read theirs and create only that default trial; every later change is admin-only (Firestore rules).
- **Read-only when expired or blocked:** creating or editing products, bills, quotations and customers requires `status == 'active'` and `validTill > now` — checked in the rules (`hasActivePlan()`), not just the UI. Viewing, downloading and deleting still work. [`PlanBanner`](src/components/shared/PlanBanner.tsx) warns during the trial, in the last 7 days, and after expiry; set `SUPPORT_PHONE` / `SUPPORT_EMAIL` in [`src/config/brand.ts`](src/config/brand.ts) so it says how to renew.
- **Plans and features:** `PLANS` and `FEATURES` in [`src/config/features.ts`](src/config/features.ts). Switchable features: Party Statement, Online Catalog, Bulk Import, Promote Product, Stock Tracking, Quotations. A plan sets the defaults; the admin can override any feature per client. UI code gates with `useFeature('stock')`; nav items and Help Center articles carry a `feature` key and are hidden when it's off. The public catalog honours an admin-set `catalogEnabled` flag mirrored into `publicProfiles`.
- **Clean up / delete a client:** the Clients list (and the *Danger zone* on a client's screen) has **Clean up data** (🧹) and **Delete account** (🗑). Both show a Yes / Cancel confirmation with the exact counts (e.g. "48 invoices, 1 quotation, 8 products, 6 customers").
  - *Clean up data* deletes the client's invoices, quotations, products and customers (dashboard empties, numbering restarts at 0001) and **keeps Business Settings, plan and validity**.
  - *Delete account* deletes all of that plus Business Settings (`users/…`, `publicProfiles/…`) and sets `accounts/{uid}.status = 'deleted'`: the client sees an "account deleted" screen and the same login can't start a new trial. The Firebase **login itself** can't be removed from the browser; delete it in Firebase Console → Authentication if you want. You can't delete your own account.
  - Needs the updated Firestore rules (admins may read and delete client data): `firebase deploy --only firestore:rules`.
- **Admin:** create `admins/<your uid>` (any field) in the Firebase Console, then sign in and open **Admin → Clients** (`/#/admin`). Click a client to open their screen (`/#/admin/clients/<uid>`): plan cards (picking one applies its default features), Valid Till with +1 / +3 / +6 months and +1 year, a feature grid that marks overrides as *Custom* (with *Reset to plan*), Active / Blocked status, private notes, and a summary of plan, validity and access. Changes are saved with **Save changes** (a sticky bar appears while there are unsaved changes; *Discard* reverts). Only the Console can add admins.

> Feature switches are enforced in the UI; plan expiry is enforced by Firestore rules.

### 🖼️ Shareable Feature Guide Images

`npm run guides` produces ready-to-send guide images for clients: one **1080×1350 PNG per feature** (a good size for WhatsApp / Instagram) in **English** (`guides/en/`) and **Hindi** (`guides/hi/`), plus one **PDF per language** with all of them (`guides/myBillCounter-User-Guide-EN.pdf` / `-HI.pdf`).

- Each card has the feature title, a one-line benefit, a **real screenshot** of the app with the key button outlined, four numbered steps, and "where to find it".
- Screenshots come from **demo mode** (sample shop data, never a client's data); the script starts `vite --mode demo` on port 5197 by itself, and the admin menu is hidden from the shots.
- Text lives in [`scripts/guides/content.mjs`](scripts/guides/content.mjs) (16 guides: welcome, create invoice, share, payments, reminders, edit/cancel, export, quotations, stock, customers & statement, products & import, catalog, promote, dashboard, settings, invoice design). Screenshot recipes and the card design are in [`scripts/guides/generate.mjs`](scripts/guides/generate.mjs). The brand name and `SUPPORT_PHONE` / `SUPPORT_EMAIL` come from [`src/config/brand.ts`](src/config/brand.ts) (shown as "Need help?" on every card).
- Re-run after changing the app so the screenshots stay current. `npm run guides -- --only=stock,export` rebuilds just those (PDFs are only rebuilt on a full run). The script warns if any card's text doesn't fit.
- Hindi text uses the system Devanagari font (Nirmala UI on Windows; install Noto Sans Devanagari elsewhere).

### 📣 Marketing Images

`npm run marketing` builds promotional images into `guides/marketing/en/` and `guides/marketing/hi/`: a clean white + corporate blue style (matching the landing page) with real app screenshots in tilted browser / phone frames, floating notification bubbles, gradient headlines and a "Try free for 14 days" call to action.

| Image | Size | Use it for |
|---|---|---|
| `hero`, `whatsapp-invoice`, `reminders`, `stock`, `quotations`, `export`, `catalog`, `templates`, `features`, `free-trial` | 1080×1080 | Instagram / Facebook posts, WhatsApp |
| `hero-story` | 1080×1920 | WhatsApp Status, Instagram Stories / Reels |
| `hero-wide` | 1200×628 | Facebook / LinkedIn link posts, website banner |

- Headlines and copy (English + Hindi) are at the top of [`scripts/guides/marketing.mjs`](scripts/guides/marketing.mjs); layouts follow below them. `npm run marketing -- --only=hero,stock` rebuilds just those.
- The WhatsApp chat and Excel sheet in the images are drawn in HTML; everything else is a real screenshot from demo mode (sample data).
- The script warns if text runs off the canvas or into a mockup, so wording changes can't silently break a design.
- Set `SUPPORT_PHONE` / `SUPPORT_EMAIL` in [`src/config/brand.ts`](src/config/brand.ts) to show your contact on the images that have a footer.
- Screenshot recipes, the demo server and fonts are shared with `npm run guides` in [`scripts/guides/shared.mjs`](scripts/guides/shared.mjs).

## 🎨 Customization

### Theme (colours & font)
The whole UI is driven by a handful of tokens at the top of [`src/index.css`](src/index.css):

- `--color-brand-*` — the indigo primary scale used for buttons, links, focus rings, table headers and badges (classes `bg-brand-600`, `text-brand-700`, …).
- `--color-accent-*` — the orange accent (`.btn-accent`) for a single main call-to-action.
- `--font-sans` — Source Sans 3 (bundled via `@fontsource-variable/source-sans-3`).

Component utilities (`.btn-primary`, `.btn-secondary`, `.btn-accent`, `.card`, `.input-field`) live in the same file, so changing the palette or font is a one-file edit. The public storefront catalog keeps its own per-shop themes in [`src/config/catalogThemes.ts`](src/config/catalogThemes.ts).

### App Name / Branding
The app name (**myBillCounter**) comes from one constant, `BRAND_NAME` in [`src/config/brand.ts`](src/config/brand.ts): the sidebar, top bar, login / register pages, Help Center, invoice PDFs ("Generated with …"), the sample products file name and the guide / marketing images all read it. The only other place is the `<title>` in `index.html`. After renaming, run `npm run guides` and `npm run marketing` to refresh the images. The repository / URL path `Bill-Counter` (`vite.config.ts` `base`) is separate: it is the GitHub Pages address and only changes if you rename the GitHub repository.

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
├── catalogEnabled: boolean (optional) # set by the admin; false hides the storefront
└── updatedAt: timestamp

accounts/{userId}                      # plan & features per client (admin-managed)
├── uid, email, businessName: string
├── plan: 'trial' | 'basic' | 'pro'
├── status: 'active' | 'blocked' | 'deleted'   # deleted = data removed by the admin, app locked
├── validTill: timestamp               # writes blocked after this (rules)
├── features: { partyStatement?, catalog?, bulkImport?, promote?, stock?, quotations?: boolean } (optional overrides)
├── notes: string (optional)           # admin-only memo
├── invoice: { templates[], defaultTemplate, color, clientCanChoose } (optional)  # invoice designs for this client
└── createdAt, updatedAt: timestamp

admins/{userId}                        # presence = admin; created only in the Firebase Console

products/{productId}
├── userId: string
├── name: string
├── price: number
├── imageUrl: string (optional)       # Cloudinary URL
├── hsn: string (optional)            # prefilled onto invoice lines
├── unit: string (optional)           # e.g. PCS, KGS
├── taxRate: number (optional)        # default GST % for this product
├── stock: number (optional)          # present = stock tracked; invoices increment it (−qty); bulk import `stock` column
├── lowStock: number (optional)       # low-stock alert level
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
├── payments: array<{ id, amount, date, method?, note? }> (optional)
├── autoRoundOff: boolean (optional)  # so edits recompute the round-off
├── cancelled: boolean, cancelledAt: timestamp (optional)
├── fromQuotationId, fromQuotationNo: string (optional)   # invoice made from a quotation
├── createdAt: timestamp, updatedAt: timestamp (optional)
└── notes: string (optional)

quotations/{quotationId}              # same shape as bills (docType: 'quotation'), own QT- series
├── …bill fields (no payments; showPaymentQr false; dueDate = Valid Till)
└── convertedBillId, convertedBillNo: string (optional)
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
| `npm run dev:demo` | Dev server with in-memory demo data and a signed-in demo admin (no Firebase needed) |
| `npm run build` | Type-check (`tsc`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run test:ui` | Run all Playwright tests: the dropdown component suite (`vite` on port 5199) and the end-to-end flows (`vite --mode demo` on port 5198); both servers start automatically |
| `npm run test:ui:headed` | Same, with a visible browser |
| `npm run guides` | Generate the shareable feature guide images (English + Hindi PNGs and PDFs) into `guides/` |
| `npm run marketing` | Generate the marketing images (English + Hindi; square, story and wide) into `guides/marketing/` |
| `npm run landing-shots` | Refresh the real app screenshots used on the landing page (`public/landing/*.jpg`) |
| `npm run deploy` | Build and publish `dist/` to the `gh-pages` branch |

## 🧪 UI Tests (Playwright)

The shared dropdown components in [`src/components/ui/Select.tsx`](src/components/ui/Select.tsx) — `Select`, `MultiSelect` and `Combobox` — are covered by a Playwright suite in [`tests/e2e/select.spec.ts`](tests/e2e/select.spec.ts). It exercises a **dev-only harness page** at `/#/__ui-test` ([`src/pages/UiTestPage.tsx`](src/pages/UiTestPage.tsx)), which is mounted only under `vite dev` and never ships in production builds. No Firebase calls are made.

**End-to-end flows** ([`tests/e2e/flows.spec.ts`](tests/e2e/flows.spec.ts)) drive the real pages in demo mode (`vite --mode demo`, in-memory data from [`src/dev/demoDb.ts`](src/dev/demoDb.ts)), so they need no Firebase. Every test starts from the same sample data. Covered: creating, editing (number and payments kept), cancelling / restoring and deleting invoices with the resulting stock; stock hints and over-stock warning; low-stock filter and dashboard alert; stock on new products; WhatsApp reminder links and message text; quotation create → convert → converted status (and no stock change); quotation and cancelled-invoice PDFs; Excel export (period, tab, totals, cancelled excluded); sample products Excel download and import; landing page (Login / Start free trial, Hindi, signed-in redirects, phone fit); admin clean up / delete client; admin feature switches; and a smoke test that every page loads without errors.

```bash
npx playwright install chromium   # one time
npm run test:ui                   # both suites
npx playwright test --project=flows   # end-to-end flows only
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
> - Publish Firestore rules and indexes whenever they change: `firebase deploy --only firestore:rules,firestore:indexes` (the quotations list needs its composite indexes).
> - Add yourself as admin: Firestore → `admins/<your uid>` (any field).
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
