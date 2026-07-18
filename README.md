# Bill Counter - SaaS Platform

A modern, scalable SaaS application for managing small business inventory and billing. Built with React 19, Vite, Tailwind CSS, shadcn/ui, and Firebase.

## 🚀 Features

- ✅ User Authentication (Register / Login + **Google Sign-In**)
- ✅ Product Management (Add, Edit, Delete, **Bulk Delete**)
- ✅ **Bulk Import from Excel / CSV** with image upload (matched by filename)
- ✅ Product image hosting via **Cloudinary** (no billing / Blaze plan needed)
- ✅ Slide-out Product Detail panel (right-side drawer)
- ✅ **Customer Directory** (add/edit, reuse on invoices)
- ✅ Invoice/Bill Creation with Line Items, **Discount & Tax/GST**
- ✅ **Payment Tracking** (Paid / Partial / Unpaid + method: cash, UPI, card, bank)
- ✅ Bill Detail View + PDF Export (vector, print-ready A4)
- ✅ **UPI Scan-to-Pay QR** on Invoices (generated from your UPI ID)
- ✅ Sales Dashboard with Metrics
- ✅ Business Profile / Settings (invoice prefix, notes, tax, UPI)
- ✅ **In-app Knowledge Base** (feature docs & help)
- ✅ Real-time Data Sync with Firestore
- ✅ Responsive Design (Mobile-Friendly)
- ✅ Modal & Drawer-based Workflows
- ✅ Toast Notifications & Error Boundary
- ✅ Multi-user SaaS Support

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TypeScript |
| UI / Styling | Tailwind CSS v4, shadcn/ui (built on Radix UI primitives) |
| State Management | Zustand |
| Routing | React Router v7 (`HashRouter` for GitHub Pages) |
| Backend/DB | Firebase (Auth + Firestore) |
| Image Hosting | Cloudinary (unsigned browser uploads) |
| Spreadsheet Parsing | SheetJS (`xlsx`) for Excel/CSV import |
| Icons | FontAwesome |
| PDF Export | jsPDF + jspdf-autotable (loaded on demand from CDN) |

## 🛠 Prerequisites

- **Node.js** 18+ recommended ([Download](https://nodejs.org/))
- **npm** 9+ or **yarn**
- **Firebase Account** ([Create Free](https://console.firebase.google.com/))

## 📦 Installation & Setup

### 1. Navigate to the Project
```bash
cd d:\Bill-Counter
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

**Firestore Database:**
- Go to Firestore Database
- Click "Create Database"
- Choose "Start in production mode"
- Select your region

**Firestore Security Rules:**

This app stores products and bills in **flat top-level collections**, each document carrying a `userId` field (queries filter with `where('userId', '==', uid)`). Use rules that scope access by that field:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile documents - only accessible by the owner
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Products - owner-scoped via the userId field
    match /products/{productId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Bills - owner-scoped via the userId field
    match /bills/{billId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

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
│   │   │   └── ProtectedRoute.tsx
│   │   ├── Products/
│   │   │   ├── ProductTable.tsx
│   │   │   ├── ProductFormModal.tsx
│   │   │   ├── ProductDetailSidebar.tsx   # slide-out product detail panel (portal)
│   │   │   └── BulkImportModal.tsx        # Excel/CSV import + Cloudinary images
│   │   ├── Bills/
│   │   │   ├── BillForm.tsx
│   │   │   └── BillDetailModal.tsx        # invoice preview + PDF download (portal-based)
│   │   ├── shared/
│   │   │   ├── Header.tsx                 # logo + clock + user menu
│   │   │   ├── Layout.tsx
│   │   │   ├── UserMenu.tsx               # dropdown holding all navigation + logout
│   │   │   ├── FaIcon.tsx
│   │   │   ├── ToastContainer.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── ui/
│   │       └── dropdown-menu.tsx          # shadcn/ui dropdown (Radix-based)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── BillsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/
│   │   ├── firebase.ts          # Firebase config & init
│   │   └── db.ts                # Firestore data access (products, bills, profile)
│   ├── store/
│   │   ├── auth.ts              # Zustand auth store
│   │   └── toast.ts             # Zustand toast store
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   ├── validators.ts        # email/password validation + Firebase error mapping
│   │   └── pdf.ts               # jsPDF-based invoice export
│   ├── assets/
│   │   └── qr.ts                # invoice QR / barcode image (swappable sample)
│   ├── lib/
│   │   └── utils.ts             # cn() class-name helper (clsx + tailwind-merge)
│   ├── App.tsx                  # Main router
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
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
3. **Products:** Add products individually, **bulk import** from a spreadsheet, or **bulk delete** with row checkboxes
4. **Customers:** Build a customer directory to reuse on invoices
5. **Bills:** Create an invoice with line items, discount & tax, track payment, then export to PDF
6. **Dashboard:** Review sales metrics
7. **Settings:** Update your business profile (name, address, phone, UPI ID, invoice prefix, tax, notes)
8. **Knowledge Base:** In-app help explaining every feature

> **Navigation:** All pages (Dashboard, Products, Customers, Bills, Knowledge Base, Settings) and Logout live in the **user menu** — the avatar dropdown at the top-right of the header.

### 📥 Bulk Import Products (Excel / CSV)

From the **Products** page → **Import**:

1. **Prepare a sheet** with columns `name`, `price`, and optionally `image`
   (headers are flexible: `productname`/`title`, `amount`/`cost`, `imageurl`/`link`):
   ```csv
   name,price,image
   T-Shirt,450,https://example.com/tshirt.jpg
   Coffee Mug,299,
   ```
2. **Images on your computer:** a browser can't read local paths (`C:\pics\mug.jpg`).
   Click **Upload Product Images**, select the actual files — they upload to Cloudinary
   and are matched to products by the **filename in the sheet's image column**
   (falls back to matching the product name if there's no image column).
3. **Upload the `.xlsx` / `.csv`** — products are created with images attached where matched.

## 🎨 Customization

### App Name / Branding
The app name (**Bill Counter**) appears in the header, login/register pages, and browser tab. To rename, update the text in `src/components/shared/Header.tsx`, `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`, and the `<title>` in `index.html`. The business name shown on invoices comes from **Settings** (per user), and falls back to `'Bill Counter'` in `src/components/Bills/BillDetailModal.tsx` and `src/utils/pdf.ts`.

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
└── createdAt: timestamp

products/{productId}
├── userId: string
├── name: string
├── price: number
├── imageUrl: string (optional)       # Cloudinary URL
└── createdAt: timestamp

customers/{customerId}
├── userId: string
├── name: string
├── phone: string (optional)
├── email: string (optional)
├── address: string (optional)
└── createdAt: timestamp

bills/{billId}
├── userId: string
├── billNo: string
├── billSeqNum: number
├── customerName: string
├── customerId: string (optional)
├── customerPhone: string (optional)
├── items: array<{ productId?, productName, quantity, price, total }>
├── subtotal: number
├── discount: number (optional)
├── taxRate: number (optional)        # % applied
├── tax: number                       # computed tax amount
├── total: number
├── paymentStatus: 'paid' | 'partial' | 'unpaid'
├── amountPaid: number
├── paymentMethod: 'cash'|'upi'|'card'|'bank'|'other' (optional)
├── paidAt: timestamp (optional)
├── createdAt: timestamp
└── notes: string (optional)
```

> The `customers` collection is queried by `userId` only (sorted client-side) to
> avoid needing a composite index. Firestore rules should scope every collection
> by the `userId` field, the same way `products` and `bills` are scoped above.

## 📚 Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server (default port 5173) |
| `npm run build` | Type-check (`tsc`) and build for production |
| `npm run preview` | Preview the production build locally |

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

## 📧 Support

For issues or questions:
1. Check Firestore Rules in the Console
2. Review the browser console for errors
3. Verify Firebase project configuration
4. Check `.env.local` file setup

## 📄 License

MIT
