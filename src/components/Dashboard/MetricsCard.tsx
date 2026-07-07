interface MetricsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtext?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  label,
  value,
  icon,
  subtext,
  trend,
}) => {
  // Extract color patterns based on label to give tailored color gradients to icons
  const getIconContainerStyle = (labelStr: string) => {
    const l = labelStr.toLowerCase();
    if (l.includes('sales') || l.includes('revenue') || l.includes('today')) {
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    }
    if (l.includes('bill') || l.includes('invoice') || l.includes('total')) {
      return 'bg-purple-50 text-purple-600 border border-purple-100';
    }
    if (l.includes('product') || l.includes('inventory') || l.includes('active')) {
      return 'bg-teal-50 text-teal-650 border border-teal-100';
    }
    return 'bg-sky-50 text-sky-600 border border-sky-100';
  };

  return (
    <div className="group overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-bold">{label}</p>
          <p className="text-3xl font-extrabold text-slate-950 tracking-tight">{value}</p>
          {subtext && <p className="text-sm text-slate-500">{subtext}</p>}
        </div>
        {icon && (
          <div className={`grid h-14 w-14 place-items-center rounded-3xl text-slate-900 shadow-sm ${getIconContainerStyle(label)}`}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </span>
          <span className="text-slate-400">Compared to previous period</span>
        </div>
      )}
    </div>
  );
};
