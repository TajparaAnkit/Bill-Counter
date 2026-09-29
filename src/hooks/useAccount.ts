import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useAccountStore } from '../store/account';
import { canWrite, hasFeature } from '../config/features';
import { FeatureKey } from '../types';

// The signed-in client's plan, validity and feature flags.
export const useAccount = () => {
  const { user } = useAuth();
  const { account, isAdmin, loadedFor, failed, load } = useAccountStore();
  const current = !!user && loadedFor === user.uid;

  useEffect(() => {
    if (user && loadedFor !== user.uid) load(user);
  }, [user, loadedFor, load]);

  return {
    account: current ? account : null,
    isAdmin: current && isAdmin,
    loading: !!user && !current,
    failed: current && failed,
    canWrite: current && canWrite(account),
  };
};

export const useFeature = (key: FeatureKey): boolean => {
  const { account } = useAccount();
  return hasFeature(account, key);
};
