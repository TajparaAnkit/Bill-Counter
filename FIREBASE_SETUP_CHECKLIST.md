# ✅ Firebase Setup Checklist

A quick, tickable version of [FIREBASE_SETUP.md](FIREBASE_SETUP.md). No coding required — ~15 minutes.

## 1. Project & config
- [ ] Create a project in the [Firebase Console](https://console.firebase.google.com/)
- [ ] Add a **Web app** and copy its config values
- [ ] `cp .env.example .env.local` and fill in **your** values (never commit real keys)

## 2. Authentication
- [ ] Authentication → Sign-in method → enable **Email/Password**
- [ ] Enable **Google**
- [ ] Authentication → Settings → **Authorized domains** includes your domain (`localhost` is default)

## 3. Firestore database
- [ ] Firestore Database → **Create database**
- [ ] Choose **Production mode**
- [ ] Pick a region (e.g. `asia-south1` Mumbai for India)

## 4. Firestore rules
- [ ] Firestore → **Rules** tab → replace all with the rules below → **Publish**

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

> Use flat collections with a `userId` field (as above) — **not** nested `products/{userId}/items/...` paths.

## 5. Storage (optional — product images)
- [ ] Storage → **Get started** (same region)
- [ ] Rules tab → paste → **Publish**:

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

## 6. Verify `.env.local`
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`

## 7. Run & test
- [ ] `npm install` then `npm run dev`
- [ ] Register a test account (e.g. `Test Shop` / `test@example.com` / `TestPass@123`) **or** use **Continue with Google**
- [ ] You're redirected to the **Dashboard** with no console errors
- [ ] In the console: Authentication → Users shows the account, and Firestore → Data shows a `users/{uid}` document

## If something goes wrong
- **`auth/invalid-api-key`** → fill `.env.local` and restart the dev server
- **`Missing or insufficient permissions`** → publish the rules from step 4 (incl. `customers`)
- **Google sign-in fails** → enable the Google provider and check Authorized domains
- **Password rejected** → needs 6+ chars, 1 uppercase, 1 number

✅ Done — Bill Counter is connected. See [USER_GUIDE.md](USER_GUIDE.md) to start billing.
