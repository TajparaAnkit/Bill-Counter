import { FaIcon } from '../shared/FaIcon';

export type DatePreset = 'all' | '15d' | '30d' | 'month' | 'custom';

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  all: 'All time',
  '15d': 'Last 15 days',
  '30d': 'Last 30 days',
  month: 'This month',
  custom: 'Custom range',
};

interface DateRangeFilterProps {
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

/**
 * Date filter for the invoices list: a preset dropdown (All time / Last 15 days
 * / Last 30 days / This month / Custom) plus two date inputs shown only when
 * "Custom range" is selected. Purely presentational — the parent turns these
 * values into an actual date range.
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  preset,
  onPresetChange,
  from,
  to,
  onFromChange,
  onToChange,
}) => {
  const inputCls =
    'h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <FaIcon icon="fa-solid fa-calendar-days" size={13} />
        </span>
        <select
          value={preset}
          onChange={(e) => onPresetChange(e.target.value as DatePreset)}
          className={`${inputCls} pl-8 pr-8 font-medium cursor-pointer`}
        >
          {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((key) => (
            <option key={key} value={key}>
              {DATE_PRESET_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => onFromChange(e.target.value)}
            className={inputCls}
            aria-label="From date"
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => onToChange(e.target.value)}
            className={inputCls}
            aria-label="To date"
          />
        </div>
      )}
    </div>
  );
};
