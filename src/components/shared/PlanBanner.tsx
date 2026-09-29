import { FaIcon } from './FaIcon';
import { useAccount } from '../../hooks/useAccount';
import { daysLeft, getPlan } from '../../config/features';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../../config/brand';

const WARN_DAYS = 7;

const contact = [SUPPORT_PHONE && `call / WhatsApp ${SUPPORT_PHONE}`, SUPPORT_EMAIL && `email ${SUPPORT_EMAIL}`].filter(Boolean).join(' or ');
const renewHint = contact ? `To renew, ${contact}.` : 'Contact us to renew.';

// Trial / expiry notice above every page. Nothing shows while the plan is healthy.
export const PlanBanner: React.FC = () => {
  const { account, failed } = useAccount();

  if (failed) {
    return <Bar tone="red" icon="fa-solid fa-triangle-exclamation" text="We couldn't load your plan. Please refresh the page." />;
  }
  if (!account) return null;

  const date = account.validTill.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const left = daysLeft(account);

  if (account.status === 'blocked') {
    return <Bar tone="red" icon="fa-solid fa-lock" text={`Your account is on hold. You can view your data but can't create or edit anything. ${renewHint}`} />;
  }
  if (left <= 0) {
    return (
      <Bar
        tone="red"
        icon="fa-solid fa-lock"
        text={`Your ${getPlan(account.plan).label} plan expired on ${date}. You can view your data but can't create or edit anything. ${renewHint}`}
      />
    );
  }
  if (account.plan === 'trial' || left <= WARN_DAYS) {
    const what = account.plan === 'trial' ? 'Free trial' : `${getPlan(account.plan).label} plan`;
    return <Bar tone="amber" icon="fa-regular fa-clock" text={`${what} ends in ${left} day${left === 1 ? '' : 's'} (${date}). ${renewHint}`} />;
  }
  return null;
};

const Bar: React.FC<{ tone: 'red' | 'amber'; icon: string; text: string }> = ({ tone, icon, text }) => (
  <div
    role="status"
    className={`flex items-start gap-2.5 px-4 py-2.5 text-sm border-b ${
      tone === 'red' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'
    }`}
  >
    <FaIcon icon={icon} size={14} className="mt-0.5 shrink-0" />
    <span>{text}</span>
  </div>
);
