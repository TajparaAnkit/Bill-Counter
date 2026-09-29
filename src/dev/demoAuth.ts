// DEV-ONLY stand-in for src/hooks/useAuth.ts (swapped in by vite.config.ts
// when BC_DEMO=1): always "signed in" as a fake demo user.
import type { User } from 'firebase/auth';

const DEMO_USER = { uid: 'demo-user', email: 'owner@demo.shop', displayName: 'Demo Owner', photoURL: null } as unknown as User;

// sessionStorage 'demo.signedOut' = '1' previews the app as a visitor who is not logged in
// (landing page, login / register); used by the e2e tests.
const signedOut = () => {
  try {
    return sessionStorage.getItem('demo.signedOut') === '1';
  } catch {
    return false;
  }
};

export const useAuth = () => ({ user: signedOut() ? null : DEMO_USER, loading: false });
