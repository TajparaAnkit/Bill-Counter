# 🚀 Quick Start Guide

## Getting Started in 5 Minutes

### ✅ What's Done
- React + Vite + Tailwind project created
- Firebase integration configured
- Authentication UI built
- Routing setup complete
- Dev server running

### 📝 Verify Setup

1. **Check if dev server is running:**
   - Open browser: http://localhost:5173
   - Should see login page with "Naitu Crochet" branding

2. **Test Navigation:**
   - Click "Register here" link → Should go to register page
   - Fill form → Should create user in Firebase
   - After register → Should redirect to dashboard
   - Click "Logout" → Should go back to login

### 🔧 Before Testing Auth

1. **Create Firebase Project**
   ```
   Go to: https://console.firebase.google.com/
   Click: Add Project
   Name: naitu-saas (or any name)
   Finish setup (no Google Analytics needed)
   ```

2. **Enable Authentication**
   ```
   In Firebase Console:
   → Authentication
   → Sign-in method
   → Enable "Email/Password"
   ```

3. **Create Firestore Database**
   ```
   In Firebase Console:
   → Firestore Database
   → Create Database
   → Choose "Production mode"
   → Select your region (India recommended)
   ```

4. **Copy Firebase Config**
   ```
   Settings (gear icon) → Project Settings
   Copy config values
   ```

5. **Create .env.local file**
   ```
   Copy from .env.example:
   cp .env.example .env.local
   
   Then paste Firebase config values
   ```

6. **Restart Dev Server**
   ```
   Ctrl+C to stop
   npm run dev to start
   ```

### ✨ Test the App

1. **Register**
   - Go to: http://localhost:5173/register
   - Fill: Business Name, Email, Password, Confirm Password
   - Click: Register
   - Check Firebase Console → Authentication → Should see new user

2. **Login**
   - Go to: http://localhost:5173/login
   - Use registered email/password
   - Click: Login
   - Should see Dashboard

3. **Dashboard**
   - Click sidebar items: Products, Bills, Settings
   - Click "Logout" → Back to login

### 📁 Project Files

Key files for Phase 2:

- `src/components/Auth/LoginForm.tsx` - Login UI (needs Firebase hook)
- `src/components/Auth/RegisterForm.tsx` - Register UI (has Firebase code)
- `src/services/firebase.ts` - Firebase config (needs .env setup)
- `.env.example` - Copy to `.env.local` and fill with Firebase values

### 🎯 Phase 2 Tasks

After Phase 1 setup, Phase 2 will:
- ✅ Connect Firebase Auth to forms
- ✅ Handle registration & login
- ✅ Store user data in Firestore
- ✅ Add error handling
- ✅ Add loading states

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot GET /" | Dev server may have crashed. Run: `npm run dev` |
| Blank page | Check browser console (F12) for errors |
| Firebase error | Check `.env.local` file - all values needed |
| "Module not found" | Run: `npm install` |

---

## Next Steps

1. ✅ Verify Phase 1 setup works
2. ⏳ Set up Firebase (15 mins)
3. ⏳ Start Phase 2 (Authentication testing)

Ready to proceed? Let me know once Firebase is set up!
