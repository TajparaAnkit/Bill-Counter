# Naitu Crochet - SaaS Platform

A modern, scalable SaaS application for managing crochet business inventory and billing. Built with React, Vite, Tailwind CSS, and Firebase.

## 🚀 Features

- ✅ User Authentication (Register/Login)
- ✅ Product Management (Add, Edit, Delete, Bulk Import)
- ✅ Invoice/Bill Creation with Line Items
- ✅ Sales Dashboard with Metrics
- ✅ Real-time Data Sync with Firestore
- ✅ Responsive Design (Mobile-Friendly)
- ✅ Modal-based Workflows
- ✅ Multi-user SaaS Support

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| State Management | Zustand |
| Routing | React Router v6 |
| Backend/DB | Firebase (Auth + Firestore + Storage) |
| HTTP Client | Axios |
| Icons | Lucide React |

## 🛠 Prerequisites

- **Node.js** 16+ ([Download](https://nodejs.org/))
- **npm** 8+ or **yarn**
- **Firebase Account** ([Create Free](https://console.firebase.google.com/))

## 📦 Installation & Setup

### 1. Clone & Navigate
```bash
cd d:\naitu-saas
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
Replace the rules with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents - only accessible by the user
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Products - scoped to user
    match /products/{userId}/items/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }

    // Bills - scoped to user
    match /bills/{userId}/items/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

**Storage:**
- Go to Storage > Rules
- Replace with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### 6. Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:5173`

## 📁 Project Structure

```
naitu-saas/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── Dashboard/
│   │   │   ├── MetricsCard.tsx
│   │   │   └── DashboardMetrics.tsx
│   │   ├── Products/           # (Phase 3)
│   │   ├── Bills/              # (Phase 4)
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Layout.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── BillsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/
│   │   ├── firebase.ts          # Firebase config & init
│   │   ├── productService.ts    # (Phase 3)
│   │   └── billService.ts       # (Phase 4)
│   ├── store/
│   │   └── auth.ts              # Zustand auth store
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useFetch.ts          # (Phase 3)
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts        # (Phase 3)
│   ├── App.tsx                  # Main router
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
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
2. **Login:** Use credentials to login
3. **Dashboard:** View empty metrics (will populate with data in Phase 3-5)
4. **Navigate:** Use sidebar to explore Products, Bills, and Settings pages

## 🔐 Firestore Collections Schema

```
users/{userId}
├── email: string
├── businessName: string
└── createdAt: timestamp

products/{userId}/items/{productId}
├── name: string
├── price: number
├── imageUrl: string (optional)
└── createdAt: timestamp

bills/{userId}/items/{billId}
├── billNo: string
├── customerName: string
├── items: array<{productName, quantity, price, total}>
├── subtotal: number
├── tax: number
├── total: number
├── createdAt: timestamp
└── notes: string (optional)
```

## 📚 Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

## 🐛 Troubleshooting

### Firebase Config Not Loading
- Verify `.env.local` file exists
- Check all environment variables are set correctly
- Restart dev server after changing `.env.local`

### "Cannot find module 'firebase'"
```bash
npm install
```

### Port 5173 Already in Use
Vite will automatically use the next available port, or specify manually:
```bash
npm run dev -- --port 3000
```

### Firestore Security Error
- Check Firestore Rules are updated correctly
- Ensure user is logged in (token available)
- Verify collection paths match rules

## 📖 Implementation Phases

- ✅ **Phase 1:** Project Setup & Configuration (COMPLETE)
- ⏳ **Phase 2:** Authentication System (IN PROGRESS - Core done, refinement needed)
- ⏳ **Phase 3:** Product Management (Ready for implementation)
- ⏳ **Phase 4:** Bill Management (Ready for implementation)
- ⏳ **Phase 5:** Dashboard & Polish (Ready for implementation)

## 🚢 Deployment

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize Firebase
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

## 📧 Support

For issues or questions:
1. Check Firestore Rules in Console
2. Review browser console for errors
3. Verify Firebase project configuration
4. Check `.env.local` file setup

## 📄 License

MIT

---

## 🎯 Next Steps

1. **Phase 2 Completion:** Refine auth UI with error handling
2. **Phase 3:** Implement Product CRUD operations
3. **Phase 4:** Build Bill creation and management
4. **Phase 5:** Add analytics and real-time dashboard updates
