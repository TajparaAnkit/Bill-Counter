import { Bill } from '../../types';
import { PAYMENT_META, getPaymentStatus } from '../../utils/payment';
import { FaIcon } from './FaIcon';

/**
 * Small pill showing a bill's payment status (Paid / Partial / Unpaid) with the
 * matching colour and icon. Colours/labels come from `PAYMENT_META` so the
 * status styling stays consistent everywhere it appears.
 */
export const PaymentBadge: React.FC<{ bill: Bill; className?: string }> = ({
  bill,
  className = '',
}) => {
  const meta = PAYMENT_META[getPaymentStatus(bill)];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${meta.badgeClass} ${className}`}
    >
      <FaIcon icon={meta.icon} size={11} />
      {meta.label}
    </span>
  );
};
