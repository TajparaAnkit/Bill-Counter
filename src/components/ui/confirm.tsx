import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaIcon } from '../shared/FaIcon';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string; // confirm button label (default "Confirm")
  cancelText?: string; // cancel button label (default "Cancel")
  variant?: 'danger' | 'primary'; // color theme (default "danger")
  icon?: string; // FontAwesome icon (defaults per variant)
  /**
   * If set, the user must type this exact string to enable the confirm button
   * (e.g. "DELETE"). Use for high-stakes / irreversible actions.
   */
  requireText?: string;
}

export interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  icon?: string;
  inputType?: 'text' | 'number';
  min?: number;
  max?: number;
  step?: number;
  prefix?: string; // e.g. "₹" shown inside the input
  /** Return an error string to block submit, or null when valid. */
  validate?: (value: string) => string | null;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
type PromptFn = (options: PromptOptions) => Promise<string | null>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));
const PromptContext = createContext<PromptFn>(() => Promise.resolve(null));

/** Imperative confirm: `const confirm = useConfirm(); if (await confirm({...})) {...}` */
export const useConfirm = (): ConfirmFn => useContext(ConfirmContext);
/** Imperative prompt: `const prompt = usePrompt(); const v = await prompt({...})` (null = cancelled). */
export const usePrompt = (): PromptFn => useContext(PromptContext);

const VARIANTS = {
  danger: {
    icon: 'fa-solid fa-triangle-exclamation',
    iconWrap: 'bg-rose-50 text-rose-500',
    confirmBtn: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm',
    ring: 'focus:ring-rose-500/20 focus:border-rose-400',
  },
  primary: {
    icon: 'fa-solid fa-circle-question',
    iconWrap: 'bg-blue-50 text-blue-500',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    ring: 'focus:ring-blue-500/20 focus:border-blue-400',
  },
};

const Backdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({
  onClose,
  children,
}) =>
  createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        {children}
      </div>
    </div>,
    document.body
  );

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Confirm dialog state
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState('');
  const confirmResolver = useRef<((v: boolean) => void) | null>(null);

  // Prompt dialog state
  const [promptOpts, setPromptOpts] = useState<PromptOptions | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const promptResolver = useRef<((v: string | null) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setConfirmOpts(opts);
    setTyped('');
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
    });
  }, []);

  const prompt = useCallback<PromptFn>((opts) => {
    setPromptOpts(opts);
    setInputValue(opts.defaultValue ?? '');
    setInputError(null);
    return new Promise<string | null>((resolve) => {
      promptResolver.current = resolve;
    });
  }, []);

  const closeConfirm = useCallback((result: boolean) => {
    confirmResolver.current?.(result);
    confirmResolver.current = null;
    setConfirmOpts(null);
    setTyped('');
  }, []);

  const closePrompt = useCallback(
    (value: string | null) => {
      if (value !== null && promptOpts?.validate) {
        const err = promptOpts.validate(value);
        if (err) {
          setInputError(err);
          return;
        }
      }
      promptResolver.current?.(value);
      promptResolver.current = null;
      setPromptOpts(null);
      setInputValue('');
      setInputError(null);
    },
    [promptOpts]
  );

  // Close whichever dialog is open on Escape.
  useEffect(() => {
    if (!confirmOpts && !promptOpts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmOpts) closeConfirm(false);
        if (promptOpts) closePrompt(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmOpts, promptOpts, closeConfirm, closePrompt]);

  const cVariant = VARIANTS[confirmOpts?.variant || 'danger'];
  const needsText = !!confirmOpts?.requireText;
  const canConfirm = !needsText || typed.trim() === confirmOpts?.requireText;

  const pVariant = VARIANTS[promptOpts?.variant || 'primary'];

  return (
    <ConfirmContext.Provider value={confirm}>
      <PromptContext.Provider value={prompt}>
        {children}

        {/* Confirm dialog */}
        {confirmOpts && (
          <Backdrop onClose={() => closeConfirm(false)}>
            <div className="relative p-6 text-center">
              <button
                onClick={() => closeConfirm(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
                aria-label="Close"
              >
                <FaIcon icon="fa-solid fa-xmark" size={18} />
              </button>

              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${cVariant.iconWrap}`}>
                <FaIcon icon={confirmOpts.icon || cVariant.icon} size={24} />
              </div>

              <h3 className="text-lg font-bold text-slate-800">{confirmOpts.title}</h3>
              {confirmOpts.message && (
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{confirmOpts.message}</p>
              )}

              {needsText && (
                <div className="mt-5 text-left">
                  <p className="text-sm text-slate-600 text-center mb-2">
                    To confirm, type{' '}
                    <span className="font-bold text-rose-500">{confirmOpts.requireText}</span> in the box below:
                  </p>
                  <input
                    autoFocus
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canConfirm && closeConfirm(true)}
                    placeholder={`Type ${confirmOpts.requireText} to confirm`}
                    className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all ${cVariant.ring}`}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-center sm:justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => closeConfirm(false)}
                className="px-4 py-2 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {confirmOpts.cancelText || 'Cancel'}
              </button>
              <button
                onClick={() => closeConfirm(true)}
                disabled={!canConfirm}
                className={`px-4 py-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cVariant.confirmBtn}`}
              >
                {confirmOpts.confirmText || 'Confirm'}
              </button>
            </div>
          </Backdrop>
        )}

        {/* Prompt dialog */}
        {promptOpts && (
          <Backdrop onClose={() => closePrompt(null)}>
            <div className="relative p-6">
              <button
                onClick={() => closePrompt(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
                aria-label="Close"
              >
                <FaIcon icon="fa-solid fa-xmark" size={18} />
              </button>

              <div className="flex items-center gap-3 mb-1">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${pVariant.iconWrap}`}>
                  <FaIcon icon={promptOpts.icon || 'fa-solid fa-pen'} size={16} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{promptOpts.title}</h3>
              </div>

              {promptOpts.message && (
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{promptOpts.message}</p>
              )}

              <div className="mt-4 relative">
                {promptOpts.prefix && (
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold pointer-events-none">
                    {promptOpts.prefix}
                  </span>
                )}
                <input
                  autoFocus
                  type={promptOpts.inputType || 'text'}
                  inputMode={promptOpts.inputType === 'number' ? 'decimal' : undefined}
                  min={promptOpts.min}
                  max={promptOpts.max}
                  step={promptOpts.step}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && closePrompt(inputValue)}
                  placeholder={promptOpts.placeholder}
                  className={`w-full ${promptOpts.prefix ? 'pl-8' : 'pl-4'} pr-4 py-2.5 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all ${
                    inputError ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-400' : `border-slate-200 ${pVariant.ring}`
                  }`}
                />
                {inputError && <p className="mt-1.5 text-xs font-medium text-rose-500">{inputError}</p>}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => closePrompt(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {promptOpts.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={() => closePrompt(inputValue)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-colors ${pVariant.confirmBtn}`}
                >
                  {promptOpts.confirmText || 'Save'}
                </button>
              </div>
            </div>
          </Backdrop>
        )}
      </PromptContext.Provider>
    </ConfirmContext.Provider>
  );
};
