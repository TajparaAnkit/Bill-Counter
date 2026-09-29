import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { Account } from '../types';
import { getOrCreateAccount, isAdminUser } from '../services/db';

interface AccountState {
  account: Account | null;
  isAdmin: boolean;
  loadedFor: string | null; // uid the state belongs to
  failed: boolean;
  load: (user: User) => Promise<void>;
}

// Shared by every component that calls useAccount, so concurrent mounts fetch once.
let inflight: { uid: string; promise: Promise<void> } | null = null;

export const useAccountStore = create<AccountState>((set) => ({
  account: null,
  isAdmin: false,
  loadedFor: null,
  failed: false,
  load: (user) => {
    if (inflight?.uid === user.uid) return inflight.promise;
    const promise = (async () => {
      try {
        const [account, isAdmin] = await Promise.all([
          getOrCreateAccount(user.uid, user.email || '', user.displayName || ''),
          isAdminUser(user.uid),
        ]);
        set({ account, isAdmin, loadedFor: user.uid, failed: false });
      } catch (err) {
        console.error('Error loading account:', err);
        set({ account: null, isAdmin: false, loadedFor: user.uid, failed: true });
      } finally {
        inflight = null;
      }
    })();
    inflight = { uid: user.uid, promise };
    return promise;
  },
}));
