# Bill Counter - SaaS Platform

A modern, scalable SaaS application for managing small business inventory and billing. Built with React 19, Vite, Tailwind CSS, shadcn/ui, and Firebase.

## 🚀 Features

- ✅ User Authentication (Register/Login)
- ✅ Product Management (Add, Edit, Delete, Bulk Import)
- ✅ Invoice/Bill Creation with Line Items
- ✅ Bill Detail View + PDF Export (vector, print-ready A4)
- ✅ QR / Barcode on Invoices (configurable, swappable image)
- ✅ Sales Dashboard with Metrics
- ✅ Business Profile / Settings
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
| Routing | React Router v7 |
| Backend/DB | Firebase (Auth + Firestore + Storage) |
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

**Storage** (optional — only needed if you upload product images):
- Go to Storage > Rules
- Replace with:
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
│   │   │   ├── ProductDetailSidebar.tsx   # slide-out product detail panel
│   │   │   └── BulkImportModal.tsx        # JSON / CSV import
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

1. **Register:** Go to `/register`, create an account with email & business name
2. **Login:** Use those credentials to log in
3. **Products:** Add products individually or via bulk import
4. **Bills:** Create an invoice with line items, then view it and export to PDF
5. **Dashboard:** Review sales metrics
6. **Settings:** Update your business profile (name, address, phone, invoice notes)

> **Navigation:** All pages (Dashboard, Products, New Invoice, Settings) and Logout live in the **user menu** — the avatar dropdown at the top-right of the header.

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

Collections are flat and top-level; each product/bill document stores its owner's `userId`.

```
users/{userId}
├── uid: string
├── email: string
├── businessName: string
├── address: string (optional)
├── phone: string (optional)
├── invoiceNotes: string (optional)
└── createdAt: timestamp

products/{productId}
├── userId: string
├── name: string
├── price: number
├── imageUrl: string (optional)
└── createdAt: timestamp

bills/{billId}
├── userId: string
├── billNo: string
├── billSeqNum: number
├── customerName: string
├── items: array<{ productId?, productName, quantity, price, total }>
├── subtotal: number
├── tax: number
├── total: number
├── createdAt: timestamp
└── notes: string (optional)
```

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
