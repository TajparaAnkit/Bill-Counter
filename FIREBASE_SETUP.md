# 🔥 Firebase Setup Guide

A step-by-step walkthrough to connect **Bill Counter** to your own Firebase project. Takes ~15 minutes. (For a quick tickable version, see [FIREBASE_SETUP_CHECKLIST.md](FIREBASE_SETUP_CHECKLIST.md).)

> **Never commit secrets.** Your Firebase config goes in `.env.local`, which is git-ignored. Do not paste real API keys into documentation or share them publicly.

---

## Step 1 — Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. Give it a name (e.g. `bill-counter`). Google Analytics is optional.
3. When it's ready, open **Project Settings** (gear icon) → **Your apps** → add a **Web app** (`</>`) and copy the config values shown.

---

## Step 2 — Add your config to `.env.local`

In the project folder:

```bash
cp .env.example .env.local
```

Fill in the values from Step 1 (these are **your** project's values, not shared):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Step 3 — Enable Authentication

In **Authentication → Sign-in method**:

1. Enable **Email/Password**.
2. Enable **Google** (needed for the "Continue with Google" button).
   - Under **Settings → Authorized domains**, make sure your domain is listed. `localhost` is included by default; add your production domain when you deploy.

---

## Step 4 — Create the Firestore Database

1. **Firestore Database → Create database**.
2. Choose **Production mode**.
3. Pick a region close to your users (e.g. `asia-south1` (Mumbai) for India).

---

## Step 5 — Publish Firestore Security Rules

Bill Counter uses **flat, top-level collections** where each document carries a `userId` field. In the **Rules** tab, replace everything with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /products/{productId} {
      allow read:           if request.auth != null && resource.data.userId == request.auth.uid;
      allow create:         if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /bills/{billId} {
      allow read:           if request.auth != null && resource.data.userId == request.auth.uid;
      allow create:         if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /customers/{customerId} {
      allow read:           if request.auth != null && resource.data.userId == request.auth.uid;
      allow create:         if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

Click **Publish**.

> ⚠️ Do **not** use nested paths like `products/{userId}/items/{productId}` — the app stores documents in flat collections with a `userId` field, so nested rules would deny all access.

---

## Step 6 — Enable Storage (optional, for product images)

1. **Storage → Get started**, same region as Firestore.
2. In the **Rules** tab:

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

Click **Publish**.

---

## Step 7 — Run the app

```bash
npm install
npm run dev
```

Open the app, register a test account (or use **Continue with Google**), and confirm you land on the Dashboard.

**Verify in the console:** Authentication → Users should show your new account, and Firestore → Data should show a `users/{uid}` document.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `auth/invalid-api-key` on startup | `.env.local` missing or has placeholder values — fill real values, then restart `npm run dev`. |
| Google sign-in popup fails | Enable the **Google** provider (Step 3) and add your domain to **Authorized domains**. |
| `Missing or insufficient permissions` | Publish the rules from Step 5 (including the `customers` block); wait ~30s to propagate. |
| Env vars not loading | Vite reads env only at startup — stop and restart the dev server after editing `.env.local`. |
| Password rejected on register | Must be 6+ characters, with at least one uppercase letter and one number. |

---

Once these steps are done, Bill Counter is fully connected and ready to use. See [USER_GUIDE.md](USER_GUIDE.md) for how to use each feature.
