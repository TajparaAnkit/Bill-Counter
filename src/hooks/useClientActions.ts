import { useState } from 'react';
import { useConfirm } from '../components/ui/confirm';
import { useToast } from './useToast';
import { cleanupClientData, deleteClientAccount, getClientDataCounts, ClientDataCounts } from '../services/db';
import { Account } from '../types';

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-IN')} ${n === 1 ? one : many}`;
const summary = (c: ClientDataCounts) =>
  [plural(c.bills, 'invoice'), plural(c.quotations, 'quotation'), plural(c.products, 'product'), plural(c.customers, 'customer')].join(', ');

// Admin actions on a client, each behind a Yes / Cancel confirmation that says what will go.
export const useClientActions = (onDone: (action: 'cleanup' | 'delete', account: Account) => void) => {
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null); // uid being worked on

  const name = (a: Account) => a.businessName || a.email;

  const cleanup = async (a: Account) => {
    let counts: ClientDataCounts;
    try {
      counts = await getClientDataCounts(a.uid);
    } catch (err) {
      console.error(err);
      toast.error('Could not read this client’s data');
      return;
    }
    const ok = await confirm({
      title: 'Clean up data',
      message: `Permanently delete all data of ${name(a)}: ${summary(counts)}. Their dashboard starts empty and invoice numbers restart at 0001. Business Settings, plan and validity are kept. This cannot be undone.`,
      confirmText: 'Yes, clean up',
      variant: 'danger',
      icon: 'fa-solid fa-broom',
    });
    if (!ok) return;
    try {
      setBusy(a.uid);
      await cleanupClientData(a.uid);
      toast.success(`${name(a)}: data cleaned up`);
      onDone('cleanup', a);
    } catch (err) {
      console.error(err);
      toast.error('Clean up failed. Some data may remain; try again.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (a: Account) => {
    let counts: ClientDataCounts;
    try {
      counts = await getClientDataCounts(a.uid);
    } catch (err) {
      console.error(err);
      toast.error('Could not read this client’s data');
      return;
    }
    const ok = await confirm({
      title: 'Delete account',
      message: `Permanently delete the account of ${name(a)} (${a.email}): ${summary(counts)} and their Business Settings. They will no longer be able to use the app or start a new trial. This cannot be undone.`,
      confirmText: 'Yes, delete account',
      variant: 'danger',
      icon: 'fa-regular fa-trash-can',
    });
    if (!ok) return;
    try {
      setBusy(a.uid);
      await deleteClientAccount(a.uid);
      toast.success(`${name(a)}: account deleted. You can also remove the login in Firebase Console → Authentication.`);
      onDone('delete', a);
    } catch (err) {
      console.error(err);
      toast.error('Delete failed. Some data may remain; try again.');
    } finally {
      setBusy(null);
    }
  };

  return { cleanup, remove, busy };
};
