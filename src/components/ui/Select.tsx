import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaIcon } from '../shared/FaIcon';

// ---------------------------------------------------------------------------
// App-wide dropdown pattern: white panel, rounded, thin border, soft shadow,
// full-width rows separated by hairlines, brand tint on the active row.
// Rendered through a portal so it is never clipped by overflow-hidden parents
// (table cells, input groups, modals).
// ---------------------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

type OptionInput = SelectOption | string;
const normalize = (opts: OptionInput[]): SelectOption[] =>
  opts.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

interface BaseProps {
  options: OptionInput[];
  placeholder?: string;
  disabled?: boolean;
  /** 'field' = bordered input look; 'embedded' = borderless, for use inside an input group */
  variant?: 'field' | 'embedded';
  size?: 'sm' | 'md';
  /** show a search box at the top of the panel (auto when > 10 options) */
  searchable?: boolean;
  className?: string;
  panelClassName?: string;
  align?: 'start' | 'end';
  'aria-label'?: string;
}

interface SingleProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  /** allow clearing back to '' via an × button (only when a placeholder exists) */
  clearable?: boolean;
}

const triggerBase =
  'flex items-center justify-between gap-2 text-left transition-colors focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none';
const fieldCls = (size: 'sm' | 'md', open: boolean) =>
  `w-full bg-white border rounded-md text-slate-800 ${size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2.5 text-sm'} ${
    open ? 'border-brand-600 ring-2 ring-brand-500/20' : 'border-slate-300 hover:border-slate-400'
  }`;
const embeddedCls = (size: 'sm' | 'md') =>
  `h-full bg-slate-50 text-slate-700 font-semibold ${size === 'sm' ? 'px-2 text-xs' : 'px-2.5 text-sm'}`;

// Positions the panel under (or above) the trigger using fixed coordinates.
// `revision` lets callers force a re-measure when the panel's contents change
// (e.g. the filtered list shrinks), since that can flip it above/below.
const usePanelPosition = (
  open: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  align: 'start' | 'end',
  revision: unknown = 0
) => {
  const [style, setStyle] = useState<React.CSSProperties>({});
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      if (!triggerRef.current) return;
      const r = triggerRef.current!.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.max(r.width, 180);
      const left = align === 'end' ? Math.max(8, Math.min(r.right - width, vw - width - 8)) : Math.max(8, Math.min(r.left, vw - width - 8));
      const spaceBelow = vh - r.bottom;
      const openUp = spaceBelow < 240 && r.top > spaceBelow;
      setStyle({
        position: 'fixed',
        left,
        width,
        ...(openUp ? { bottom: vh - r.top + 4 } : { top: r.bottom + 4 }),
        maxHeight: Math.min(320, (openUp ? r.top : spaceBelow) - 12),
        zIndex: 9999,
      });
    };
    update();
    // Re-measure on the next frame too: focus()/scrollIntoView can move the
    // trigger right after the panel opens.
    const raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    document.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      document.removeEventListener('scroll', update, true);
    };
  }, [open, triggerRef, align, revision]);
  return style;
};

// Only one dropdown may be open at a time: opening one broadcasts this event
// and every other instance closes itself.
const CLOSE_OTHERS = 'bc-select-open';
let selectSeq = 0;
const useCloseOthers = (open: boolean, setOpen: (v: boolean) => void) => {
  const idRef = useRef(0);
  if (!idRef.current) idRef.current = ++selectSeq;
  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent(CLOSE_OTHERS, { detail: idRef.current }));
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== idRef.current) setOpen(false);
    };
    window.addEventListener(CLOSE_OTHERS, onOther);
    return () => window.removeEventListener(CLOSE_OTHERS, onOther);
  }, [open, setOpen]);
};

const Panel: React.FC<{
  style: React.CSSProperties;
  className?: string;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  children: React.ReactNode;
}> = ({ style, className, panelRef, onKeyDown, children }) =>
  createPortal(
    <div
      ref={panelRef}
      style={style}
      onKeyDown={onKeyDown}
      className={`flex flex-col bg-white rounded-lg border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.12)] overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${className || ''}`}
      role="listbox"
    >
      {children}
    </div>,
    document.body
  );

const SearchBox: React.FC<{ value: string; onChange: (v: string) => void; inputRef: React.RefObject<HTMLInputElement | null> }> = ({ value, onChange, inputRef }) => (
  <div className="p-2 border-b border-slate-100 shrink-0">
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        <FaIcon icon="fa-solid fa-magnifying-glass" size={11} />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search…"
        className="w-full pl-7 pr-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-brand-500 focus:bg-white"
      />
    </div>
  </div>
);

// Scroll a row into view *within the panel's own list* — never via
// element.scrollIntoView(), which would scroll the page under a fixed panel.
const revealRow = (panel: HTMLElement | null, index: number) => {
  if (!panel || index < 0) return;
  const row = panel.querySelectorAll<HTMLElement>('[data-row]')[index];
  const list = row?.parentElement;
  if (!row || !list) return;
  const top = row.offsetTop;
  const bottom = top + row.offsetHeight;
  if (top < list.scrollTop) list.scrollTop = top;
  else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
};

const rowCls = (active: boolean, highlighted: boolean) =>
  `w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left border-b border-slate-100 last:border-0 transition-colors ${
    active ? 'bg-brand-50/70 font-semibold text-slate-800' : highlighted ? 'bg-slate-50 text-slate-800' : 'text-slate-600 hover:bg-slate-50'
  }`;

// ---------------------------------------------------------------------------
// Single select
// ---------------------------------------------------------------------------
export const Select: React.FC<SingleProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select',
  disabled,
  variant = 'field',
  size = 'md',
  searchable,
  clearable,
  className,
  panelClassName,
  align = 'start',
  'aria-label': ariaLabel,
}) => {
  const opts = useMemo(() => normalize(options), [options]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useCloseOthers(open, setOpen);
  const showSearch = searchable ?? opts.length > 10;

  const selected = opts.find((o) => o.value === value);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? opts.filter((o) => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t)) : opts;
  }, [opts, q]);
  const style = usePanelPosition(open, triggerRef, align, list.length);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setHi(Math.max(0, opts.findIndex((o) => o.value === value)));
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    const onDown = (e: MouseEvent) => {
      const el = e.target as Node;
      if (triggerRef.current?.contains(el) || panelRef.current?.contains(el)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // keep highlighted row visible
  useEffect(() => {
    if (open) revealRow(panelRef.current, hi);
  }, [hi, open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((h) => Math.min(list.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (list[hi]) pick(list[hi].value);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`${triggerBase} ${variant === 'field' ? fieldCls(size, open) : embeddedCls(size)} ${className || ''}`}
      >
        <span className={`truncate ${selected ? '' : 'text-slate-400 font-normal'}`}>{selected ? selected.label : placeholder}</span>
        <span className="flex items-center gap-1 shrink-0">
          {clearable && selected && !disabled && (
            <span
              role="button"
              aria-label="Clear"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="text-slate-400 hover:text-rose-600 p-0.5"
            >
              <FaIcon icon="fa-solid fa-xmark" size={11} />
            </span>
          )}
          <FaIcon icon="fa-solid fa-chevron-down" size={11} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <Panel style={style} className={panelClassName} panelRef={panelRef} onKeyDown={onKeyDown}>
          {showSearch && <SearchBox value={q} onChange={(v) => { setQ(v); setHi(0); }} inputRef={searchRef} />}
          <div className="overflow-y-auto">
            {list.map((o, i) => (
              <button
                key={o.value}
                type="button"
                data-row
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setHi(i)}
                onClick={() => pick(o.value)}
                className={rowCls(o.value === value, i === hi)}
              >
                <span className="truncate">
                  {o.label}
                  {o.hint && <span className="block text-[11px] text-slate-400 font-normal">{o.hint}</span>}
                </span>
                {o.value === value && <FaIcon icon="fa-solid fa-check" size={11} className="text-brand-600 shrink-0" />}
              </button>
            ))}
            {list.length === 0 && <div className="px-4 py-3 text-xs text-slate-400">No match</div>}
          </div>
        </Panel>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Multi select (checkbox rows) — same panel styling
// ---------------------------------------------------------------------------
interface MultiProps extends BaseProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const MultiSelect: React.FC<MultiProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select',
  disabled,
  variant = 'field',
  size = 'md',
  searchable,
  className,
  panelClassName,
  align = 'start',
  'aria-label': ariaLabel,
}) => {
  const opts = useMemo(() => normalize(options), [options]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useCloseOthers(open, setOpen);
  const showSearch = searchable ?? opts.length > 10;

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? opts.filter((o) => o.label.toLowerCase().includes(t)) : opts;
  }, [opts, q]);
  const style = usePanelPosition(open, triggerRef, align, list.length);

  useEffect(() => {
    if (!open) return;
    setQ('');
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    const onDown = (e: MouseEvent) => {
      const el = e.target as Node;
      if (triggerRef.current?.contains(el) || panelRef.current?.contains(el)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const labels = opts.filter((o) => value.includes(o.value)).map((o) => o.label);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`${triggerBase} ${variant === 'field' ? fieldCls(size, open) : embeddedCls(size)} ${className || ''}`}
      >
        <span className={`truncate ${labels.length ? 'font-semibold' : 'text-slate-400 font-normal'}`}>{labels.length ? labels.join(', ') : placeholder}</span>
        <FaIcon icon="fa-solid fa-chevron-down" size={11} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <Panel style={style} className={panelClassName} panelRef={panelRef}>
          {showSearch && <SearchBox value={q} onChange={setQ} inputRef={searchRef} />}
          <div className="overflow-y-auto">
            {list.map((o) => {
              const on = value.includes(o.value);
              return (
                <button key={o.value} type="button" role="option" aria-selected={on} onClick={() => toggle(o.value)} className={rowCls(on, false)}>
                  <span className="truncate">{o.label}</span>
                  <span className={`w-4 h-4 rounded border grid place-items-center shrink-0 ${on ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'}`}>
                    {on && <FaIcon icon="fa-solid fa-check" size={9} />}
                  </span>
                </button>
              );
            })}
            {list.length === 0 && <div className="px-4 py-3 text-xs text-slate-400">No match</div>}
          </div>
        </Panel>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Combobox — free-text input with typeahead suggestions in the same panel.
// Replaces native <datalist>, whose browser popup ignores app styling.
// ---------------------------------------------------------------------------
interface ComboboxProps {
  options: OptionInput[];
  value: string;
  /** fired on every keystroke and on pick (with the option's value) */
  onChange: (value: string, option?: SelectOption) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  panelClassName?: string;
  align?: 'start' | 'end';
  autoFocus?: boolean;
  'aria-label'?: string;
  /** max rows to render in the panel */
  limit?: number;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  panelClassName,
  align = 'start',
  autoFocus,
  'aria-label': ariaLabel,
  limit = 50,
}) => {
  const opts = useMemo(() => normalize(options), [options]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useCloseOthers(open, setOpen);

  const list = useMemo(() => {
    const t = value.trim().toLowerCase();
    const filtered = t ? opts.filter((o) => o.label.toLowerCase().includes(t)) : opts;
    return filtered.slice(0, limit);
  }, [opts, value, limit]);
  const style = usePanelPosition(open, inputRef, align, list.length);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = e.target as Node;
      if (inputRef.current?.contains(el) || panelRef.current?.contains(el)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) revealRow(panelRef.current, hi);
  }, [hi, open]);

  const pick = (o: SelectOption) => {
    onChange(o.value, o);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setHi((h) => Math.min(list.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      if (open && list[hi]) {
        e.preventDefault();
        pick(list[hi]);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setHi(0);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={className}
      />
      {open && list.length > 0 && (
        <Panel style={style} className={panelClassName} panelRef={panelRef}>
          <div className="overflow-y-auto">
            {list.map((o, i) => (
              <button
                key={o.value}
                type="button"
                data-row
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setHi(i)}
                onMouseDown={(e) => e.preventDefault() /* keep input focus */}
                onClick={() => pick(o)}
                className={rowCls(o.value === value, i === hi)}
              >
                <span className="truncate">{o.label}</span>
                {o.hint && <span className="text-xs text-slate-500 shrink-0">{o.hint}</span>}
              </button>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
};
