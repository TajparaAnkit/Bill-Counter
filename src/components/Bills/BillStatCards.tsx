import { FaIcon } from '../shared/FaIcon';
import { formatCurrency } from '../../utils/format';

export interface BillStats {
  count: number;
  totalRevenue: number;
  thisMonth: number;
  avg: number;
}

/** The four summary KPI cards shown above the invoices table. */
export const BillStatCards: React.FC<{ stats: BillStats }> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Invoices',
      value: stats.count.toString(),
      icon: 'fa-solid fa-file-invoice',
      tint: 'from-blue-700 to-blue-500',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: 'fa-solid fa-indian-rupee-sign',
      tint: 'from-sky-500 to-blue-500',
    },
    {
      label: 'This Month',
      value: formatCurrency(stats.thisMonth),
      icon: 'fa-solid fa-calendar-day',
      tint: 'from-violet-500 to-purple-500',
    },
    {
      label: 'Avg. Invoice',
      value: formatCurrency(stats.avg),
      icon: 'fa-solid fa-chart-line',
      tint: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group bg-white rounded-2xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(37,99,235,0.08)] hover:-translate-y-0.5"
        >
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.tint} flex items-center justify-center shadow-md shadow-slate-900/5`}>
            <FaIcon icon={card.icon} size={16} className="text-white" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">{card.label}</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1 tracking-tight truncate">{card.value}</p>
        </div>
      ))}
    </div>
  );
};
