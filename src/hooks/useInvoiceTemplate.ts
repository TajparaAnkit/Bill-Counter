import { useAccount } from './useAccount';
import { resolveTemplate, TemplateChoice } from '../config/invoiceTemplates';
import { UserProfile } from '../types';

// The invoice design + colour for the signed-in client (Classic unless the admin set otherwise).
export const useInvoiceTemplate = (profile: Pick<UserProfile, 'invoiceTemplate' | 'invoiceColor'> | null): TemplateChoice => {
  const { account } = useAccount();
  return resolveTemplate(account, profile);
};
