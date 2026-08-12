# 🔥 Firebase Setup Guide - Complete Walkthrough

## Current Status
✅ Firebase config added to `.env.local`  
✅ React app running on http://localhost:5173  
⏳ Firebase services need to be enabled

---

## Step 1: Enable Firebase Authentication

### Go to Firebase Console
1. Visit: https://console.firebase.google.com/
2. Select your project: **naitu-saas**
3. In the left sidebar, find **Authentication** under "Build"

### Enable Email/Password Provider
1. Click **Authentication**
2. Click **Sign-in method** tab
3. Look for **Email/Password** option
4. Click on it
5. Toggle **Enable** (switch to ON)
6. Click **Save**

**Screenshot Path:** Authentication → Sign-in method → Email/Password → Enable

---

## Step 2: Create Firestore Database

### Navigate to Firestore
1. In left sidebar, find **Firestore Database** under "Build"
2. Click **Create database**

### Configuration
1. **Mode:** Select **Production mode** (important for security rules)
2. **Location:** Choose your region
   - For India: Select **asia-south1 (Mumbai)** or **asia-southeast1**
   - This affects data latency and pricing
3. Click **Create**

Wait for database to initialize (2-3 minutes)

---

## Step 3: Set Firestore Security Rules

### Update Security Rules
1. In Firestore Database, click **Rules** tab
2. Replace all text with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents - only user can read/write their own
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Products - scoped to user
    match /products/{userId}/items/{productId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Bills - scoped to user
    match /bills/{userId}/items/{billId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**

---

## Step 4: Enable Firebase Storage (for images)

### Create Storage Bucket
1. In left sidebar, find **Storage** under "Build"
2. Click **Get started**
3. Choose region (same as Firestore: asia-south1)
4. Click **Done**

### Update Storage Rules
1. Click **Rules** tab
2. Replace with:

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

3. Click **Publish**

---

## Step 5: Verify Environment Variables

### Check `.env.local` file
Located at: `d:\naitu-saas\.env.local`

Should contain:
```env
VITE_FIREBASE_API_KEY=AIzaSyBmV4DxgCLLSmB3I0lVwRg8ZlX_iFu7eRQ
VITE_FIREBASE_AUTH_DOMAIN=naitu-saas.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=naitu-saas
VITE_FIREBASE_STORAGE_BUCKET=naitu-saas.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=649847775364
VITE_FIREBASE_APP_ID=1:649847775364:web:b6d654b4c03dc1ea52e2d1
VITE_FIREBASE_MEASUREMENT_ID=G-455627FCW8
```

✅ If all values are present, your config is ready!

---

## Step 6: Restart Dev Server

After enabling services in Firebase, restart the app:

```bash
# Terminal 1: Stop current server
Ctrl+C

# Restart
npm run dev
```

---

## Testing the Setup

### Test Registration
1. Open http://localhost:5173/register
2. Fill form:
   - Business Name: `Test Shop`
   - Email: `test@example.com`
   - Password: `Test@123456`
   - Confirm: `Test@123456`
3. Click Register

### Expected Results
- ✅ User created in Firebase Auth
- ✅ User document saved in Firestore
- ✅ Redirected to Dashboard
- ✅ No errors in browser console

### Verify in Firebase Console
1. Go to **Authentication**
2. Should see new user with email: `test@example.com`

---

## Troubleshooting

### "Configuration not found" Error
**Cause:** Authentication not enabled  
**Fix:** Follow Step 1 above to enable Email/Password

### "Permission denied" Error
**Cause:** Firestore rules not set correctly  
**Fix:** 
- Check rules are published (blue "Publish" button should not appear)
- Verify rule syntax matches code above
- Wait 30 seconds for rules to propagate

### "Quota exceeded" Error
**Cause:** Too many API calls  
**Fix:** Free tier allows 1000s per day. This is normal in development. Not a real issue.

### Env variables not loading
**Cause:** `.env.local` not reloaded  
**Fix:**
1. Stop dev server: Ctrl+C
2. Restart: npm run dev
3. Clear browser cache: Ctrl+Shift+Delete

### Form not submitting
**Cause:** Password mismatch or weak password  
**Requirement:** Password must be 6+ characters

---

## Firebase Console Navigation

**Quick Access:**
- Authentication: https://console.firebase.google.com/u/0/project/naitu-saas/authentication/users
- Firestore: https://console.firebase.google.com/u/0/project/naitu-saas/firestore/data
- Storage: https://console.firebase.google.com/u/0/project/naitu-saas/storage/files
- Settings: https://console.firebase.google.com/u/0/project/naitu-saas/settings/general

---

## Timeline
- **Step 1 (Auth):** 2-3 minutes
- **Step 2 (Firestore):** 3-5 minutes (includes initialization wait)
- **Step 3 (Rules):** 2 minutes
- **Step 4 (Storage):** 3-5 minutes
- **Step 5 (Verify):** 1 minute
- **Total:** 15-20 minutes

---

## What's Next

Once Firebase is fully set up:
1. ✅ Test registration flow
2. ✅ Test login flow
3. ✅ Test dashboard access
4. ✅ Start Phase 2 implementation

All Phase 2 enhancements are ready to go!

---

## Questions?

If you hit any issues:
1. Check Firebase Console for error messages
2. Look at browser console (F12) for detailed errors
3. Verify all steps completed in order
4. Restart dev server after each Firebase change

**Current App Status:** Ready for Firebase setup ✅  
**Firebase Status:** Awaiting your setup (in progress)
