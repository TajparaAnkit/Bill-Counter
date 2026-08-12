# ✅ Firebase Setup Checklist

Complete these steps in order to enable Firebase services:

## Phase 1: Authentication Setup (5 mins)

- [ ] **1.1** Go to Firebase Console: https://console.firebase.google.com/
- [ ] **1.2** Select project: **naitu-saas**
- [ ] **1.3** Click **Authentication** in left sidebar
- [ ] **1.4** Click **Sign-in method** tab
- [ ] **1.5** Find and click **Email/Password**
- [ ] **1.6** Toggle **Enable** switch to ON
- [ ] **1.7** Click **Save**

✅ **Result:** Email/Password provider enabled

---

## Phase 2: Firestore Database Setup (10 mins)

- [ ] **2.1** In left sidebar, click **Firestore Database**
- [ ] **2.2** Click **Create database**
- [ ] **2.3** Select Mode: **Production mode** (NOT test mode)
- [ ] **2.4** Choose Region: **asia-south1** (Mumbai) for India
- [ ] **2.5** Click **Create**
- [ ] **2.6** Wait 2-3 minutes for initialization

✅ **Result:** Firestore database created

---

## Phase 3: Firestore Security Rules (3 mins)

- [ ] **3.1** In Firestore Database, click **Rules** tab
- [ ] **3.2** Select all existing text: Ctrl+A
- [ ] **3.3** Delete all text
- [ ] **3.4** Paste this code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /products/{userId}/items/{productId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /bills/{userId}/items/{billId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

- [ ] **3.5** Click **Publish** button (should be blue)
- [ ] **3.6** Confirm dialog appears: Click **Publish**

✅ **Result:** Firestore rules updated and published

---

## Phase 4: Firebase Storage Setup (5 mins)

- [ ] **4.1** In left sidebar, click **Storage**
- [ ] **4.2** Click **Get started**
- [ ] **4.3** Choose Region: Same as before - **asia-south1**
- [ ] **4.4** Click **Done**
- [ ] **4.5** Wait for bucket to initialize (1-2 minutes)

---

## Phase 5: Storage Security Rules (3 mins)

- [ ] **5.1** In Storage, click **Rules** tab
- [ ] **5.2** Select all existing text: Ctrl+A
- [ ] **5.3** Delete all text
- [ ] **5.4** Paste this code:

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

- [ ] **5.5** Click **Publish** button
- [ ] **5.6** Confirm: Click **Publish**

✅ **Result:** Storage rules updated

---

## Phase 6: Verify Environment Variables (1 min)

File: `d:\naitu-saas\.env.local`

- [ ] **6.1** Check file exists
- [ ] **6.2** Verify all 7 values are present:
  - [ ] VITE_FIREBASE_API_KEY
  - [ ] VITE_FIREBASE_AUTH_DOMAIN
  - [ ] VITE_FIREBASE_PROJECT_ID
  - [ ] VITE_FIREBASE_STORAGE_BUCKET
  - [ ] VITE_FIREBASE_MESSAGING_SENDER_ID
  - [ ] VITE_FIREBASE_APP_ID
  - [ ] VITE_FIREBASE_MEASUREMENT_ID

✅ **Result:** All environment variables configured

---

## Phase 7: Restart Development Server (1 min)

- [ ] **7.1** Stop current server: Press **Ctrl+C** in terminal
- [ ] **7.2** Start server again: `npm run dev`
- [ ] **7.3** Wait for "ready in X ms" message
- [ ] **7.4** Open browser: http://localhost:5173

✅ **Result:** Dev server running with Firebase loaded

---

## Testing

### Test 1: Registration Flow

- [ ] **T1.1** Go to http://localhost:5173/register
- [ ] **T1.2** Fill form:
  ```
  Business Name: Test Crochet
  Email: test123@example.com
  Password: TestPass@123
  Confirm: TestPass@123
  ```
- [ ] **T1.3** Click **Register** button
- [ ] **T1.4** Should redirect to **Dashboard** (no errors)

### Test 2: Verify in Firebase Console

- [ ] **T2.1** Go to Firebase Console
- [ ] **T2.2** Click **Authentication**
- [ ] **T2.3** Should see new user: `test123@example.com`
- [ ] **T2.4** Click **Firestore Database**
- [ ] **T2.5** Click **Data** tab
- [ ] **T2.6** Should see `users` collection with new user document

### Test 3: Login Flow

- [ ] **T3.1** Click **Logout** button (or go to http://localhost:5173/login)
- [ ] **T3.2** Fill login form:
  ```
  Email: test123@example.com
  Password: TestPass@123
  ```
- [ ] **T3.3** Click **Login**
- [ ] **T3.4** Should redirect to **Dashboard**
- [ ] **T3.5** See sidebar with navigation items

✅ **Result:** Authentication working end-to-end!

---

## Summary

| Task | Status | Time |
|------|--------|------|
| Authentication | - | 5 min |
| Firestore Database | - | 10 min |
| Firestore Rules | - | 3 min |
| Storage | - | 5 min |
| Storage Rules | - | 3 min |
| Verify Config | - | 1 min |
| Restart Server | - | 1 min |
| **Total** | - | **~30 mins** |

---

## 🚀 Next Steps After Setup

1. ✅ Complete Firebase setup above
2. ⏳ Test registration/login flows
3. ⏳ Start **Phase 2** implementation (auth refinement)
4. ⏳ Build **Phase 3** (Product management)
5. ⏳ Build **Phase 4** (Bill management)
6. ⏳ Build **Phase 5** (Dashboard & deployment)

---

## 🆘 If Something Goes Wrong

**Error: "Configuration not found"**
- Check Step 1 (Authentication enabled?)
- Restart server: Ctrl+C, then `npm run dev`

**Error: "Permission denied"**
- Check Step 3 (Firestore rules published?)
- Rules take 30 seconds to propagate

**Registration form not working**
- Check browser console: F12 → Console tab
- Look for error messages
- Verify `.env.local` has all values

**Can't see user in Firebase Console**
- Wait 10 seconds for sync
- Refresh Firebase Console
- Check correct project is selected: **naitu-saas**

---

**Status:** Ready for Firebase setup  
**Estimated Time:** ~30 minutes  
**Difficulty:** Easy (no coding required)

Let me know once you've completed all steps! 🎉
