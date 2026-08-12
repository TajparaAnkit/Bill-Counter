# Bill Counter — Billing & Invoicing Platform

A modern, multi-user SaaS application for small businesses to manage products, customers, and invoices — with payment tracking, GST/tax support, UPI scan-to-pay QR codes, and one-tap WhatsApp sharing. Built with React 19, Vite, Tailwind CSS v4, shadcn/ui, and Firebase.

> 📘 Looking for a plain-English overview of what the app does and how to use it? See **[USER_GUIDE.md](USER_GUIDE.md)** — a customer-friendly feature walkthrough.

## 🚀 Features

**Authentication**
- Email/password sign-up & login
- **Google sign-in** (one click)
- **Forgot password** (email reset link)
- Protected routes with auth guards

**Products**
- Add / edit / delete with image upload
- **Bulk import** via JSON or CSV
- Search + pagination

**Customers**
- Customer directory (add / edit / delete)
- Search, and **autocomplete on invoices** (auto-fills phone)

**Invoices**
- Line-item invoices with sequential, **configurable numbering** (e.g. `INV-0001`)
- **Optional discount** (flat ₹ or %) and **optional GST/tax** with GSTIN on the invoice
- Vector, print-ready **A4 PDF export**
- **UPI scan-to-pay QR** generated per invoice (from your UPI ID)
- **Share to WhatsApp** (sends the PDF)
- Delete with confirmation
- Search + pagination

**Payments**
- **Paid / Partial / Unpaid** status per invoice
- Amount-paid and **outstanding-dues** tracking
- Mark-as controls in the invoice view

**Dashboard**
- KPI cards (products, today's sales, total bills, avg. order value)
- **7-day sales trend** mini bar chart
- Recent transactions, top products, and a **receivables** summary

**Settings**
- Business profile (name, address, phone) shown on invoices
- **UPI ID**, **invoice-number prefix**, and **GST config** (toggle, default rate, GSTIN)
- Default invoice footer terms

**Platform / UX**
- Corporate navy theme, Plus Jakarta Sans headings
- Reusable confirm & prompt dialogs, toast notifications, global error boundary
- Real-time Firestore sync · responsive / mobile-friendly

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TypeScript |
| UI / Styling | Tailwind CSS v4, shadcn/ui (Radix UI primitives) |
| Fonts | Inter (body) + Plus Jakarta Sans (headings), self-hosted via `@fontsource` |
| State Management | Zustand |
| Routing | React Router v7 |
| Backend / DB | Firebase (Auth + Firestore + Storage) |
| Icons | FontAwesome |
| PDF Export | jsPDF + jspdf-autotable (loaded on demand from CDN) |
| QR Codes | qrcodejs (UPI payment QR, loaded on demand from CDN) |

## 🛠 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ or **yarn**
- **Firebase Account** ([Create Free](https://console.firebase.google.com/))

## 📦 Installation & Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Firebase project
1. Go to the [Firebase Console](https://console.firebase.google.com/) → **Add Project**
2. Finish setup (Google Analytics optional)
3. Open **Project Settings** (gear icon) and copy your web-app config values

### 3. Configure environment variables

> ⚠️ **Required.** Without a valid `.env.local`, the app throws `FirebaseError: auth/invalid-api-key` on startup.

```bash
cp .env.example .env.local
```

Fill `.env.local` with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Enable Firebase services

**Authentication** — Authentication → Sign-in method:
- Enable **Email/Password**
- Enable **Google** (required for the "Continue with Google" button; add your domain under *Authorized domains* — `localhost` is included by default)

**Firestore Database** — create a database in *production mode* and pick your region.

**Firestore Security Rules** — all collections are flat and top-level, each document carrying a `userId` field (queries filter with `where('userId', '==', uid)`). Publish these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile — only the owner
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Products — owner-scoped via the userId field
    match /products/{productId} {
      allow read:           if request.auth != null && resource.data.userId == request.auth.uid;
      allow create:         if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    // Bills — owner-scoped via the userId field
    match /bills/{billId} {
      allow read:           if request.auth != null && resource.data.userId == request.auth.uid;
      allow create:         if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    // Customers — owner-scoped via the userId field
    match /customers/{customerId} {
      allow read:           if request.auth != null && resource.data.userId == request.auth.uid;
      allow create:         if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

**Storage** (optional — only for product images) — Storage → Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Start the dev server
```bash
npm run dev
```
Opens at `http://localhost:5173` (Vite picks the next free port if busy).

## 📁 Project Structure

```
Bill-Counter/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx           # email/password login + forgot-password
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── GoogleButton.tsx        # Firebase Google sign-in
│   │   │   ├── AuthArt.tsx             # decorative split-screen panel
│   │   │   └── ProtectedRoute.tsx
│   │   ├── Products/
│   │   │   ├── ProductTable.tsx        # search + pagination
│   │   │   ├── ProductFormModal.tsx
│   │   │   ├── ProductDetailSidebar.tsx
│   │   │   └── BulkImportModal.tsx     # JSON / CSV import
│   │   ├── Customers/
│   │   │   └── CustomerFormModal.tsx
│   │   ├── Bills/
│   │   │   ├── BillForm.tsx            # line items + discount/tax + customer autocomplete
│   │   │   └── BillDetailModal.tsx     # invoice preview, PDF, UPI QR, WhatsApp, payment status
│   │   ├── shared/
│   │   │   ├── Header.tsx              # logo + clock + user menu
│   │   │   ├── Layout.tsx
│   │   │   ├── UserMenu.tsx            # dropdown holding all navigation + logout
│   │   │   ├── FaIcon.tsx
│   │   │   ├── ToastContainer.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── ui/
│   │       ├── dropdown-menu.tsx       # shadcn/ui dropdown (Radix-based)
│   │       ├── Pagination.tsx          # reusable table pagination
│   │       └── confirm.tsx             # useConfirm() + usePrompt() dialogs
│   ├── pages/
│   │   ├── LoginPage.tsx  RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx  CustomersPage.tsx
│   │   ├── BillsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/
│   │   ├── firebase.ts                 # Firebase config & init
│   │   └── db.ts                       # Firestore access (products, bills, customers, profile)
│   ├── store/                          # Zustand: auth.ts, toast.ts
│   ├── hooks/                          # useAuth.ts, useToast.ts
│   ├── types/index.ts                  # TypeScript interfaces
│   ├── utils/
│   │   ├── validators.ts               # validation + Firebase error mapping
│   │   ├── pdf.ts                      # jsPDF invoice export
│   │   ├── upiQr.ts                    # UPI payment-QR generator
│   │   └── payment.ts                  # payment-status helpers
│   ├── assets/qr.ts                    # fallback invoice QR (swappable placeholder)
│   ├── lib/utils.ts                    # cn() class-name helper
│   ├── App.tsx  main.tsx  index.css
├── public/  index.html
├── package.json  vite.config.ts  tailwind.config.js  postcss.config.js
├── components.json  tsconfig.json  .env.example
├── README.md  USER_GUIDE.md  FIREBASE_SETUP.md  FIREBASE_SETUP_CHECKLIST.md
```

## 🔐 Firestore Collections Schema

```
users/{userId}
├── uid, email, businessName
├── address, phone            (optional)
├── invoiceNotes              (optional — default invoice footer)
├── upiId                     (optional — powers the payment QR)
├── billPrefix                (optional — e.g. "INV")
├── taxEnabled, defaultTaxRate, gstin   (optional — GST config)
└── createdAt

products/{productId}
├── userId, name, price
├── imageUrl                  (optional)
└── createdAt

customers/{customerId}
├── userId, name
├── phone, email, address     (optional)
└── createdAt

bills/{billId}
├── userId, billNo, billSeqNum
├── customerName
├── customerId, customerPhone (optional — links to a saved customer)
├── items: array<{ productId?, productName, quantity, price, total }>
├── subtotal
├── discount, taxRate         (optional — 0 when unused)
├── tax, total
├── paymentStatus             ('paid' | 'partial' | 'unpaid')
├── amountPaid, paymentMethod, paidAt
├── notes                     (optional)
└── createdAt
```

## 🎨 Customization

**App name / branding** — the name **Bill Counter** appears in the header, auth pages, and browser tab. To rename, edit `src/components/shared/Header.tsx`, `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`, and the `<title>` in `index.html`. The business name printed on invoices comes from **Settings** per user (falls back to `'Bill Counter'` in `BillDetailModal.tsx` and `utils/pdf.ts`).

**Theme colors** — the corporate navy/blue palette lives in the shared classes in `src/index.css` (`.btn-primary`, `.card`, `.input-field`, action buttons). Adjust those tokens to re-theme globally.

**Fonts** — imported in `src/index.css` via `@fontsource`; the `--font-display` token controls headings.

**Payment QR** — invoices generate a real **UPI** scan-to-pay QR from the **UPI ID** set in Settings (`src/utils/upiQr.ts`). If no UPI ID is set, a decorative placeholder from `src/assets/qr.ts` is used instead — replace `INVOICE_QR` there with your own image (data URL / hosted URL / imported file) to customize it.

## 📚 Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check (`tsc`) + production build |
| `npm run preview` | Preview the production build |

## 🐛 Troubleshooting

- **`auth/invalid-api-key` on startup** — `.env.local` missing/placeholder; fill real values and restart the dev server.
- **Google sign-in fails** — enable the Google provider in Firebase Auth and add your domain to *Authorized domains*.
- **`Missing or insufficient permissions`** — publish the Firestore rules above (including the `customers` block).
- **`Cannot find module 'firebase'`** — run `npm install`.
- **Port 5173 in use** — `npm run dev -- --port 3000`.

## 🚢 Deployment

**Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # set "dist" as the public directory
npm run build
firebase deploy
```

**Vercel** — `npm i -g vercel && vercel`. Set the `VITE_FIREBASE_*` env vars in your host's dashboard.

## 📄 License

MIT
