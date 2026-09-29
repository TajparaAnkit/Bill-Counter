// Invoice print designs and how the one in use is chosen.
//
// The admin decides, per client, which designs are available, the default one and the
// accent colour, and whether the client may change them in Settings. Classic (the original
// layout) is always available and is what everyone gets unless the admin says otherwise.

import type { Account, InvoiceTemplateId, UserProfile } from '../types';

export interface TemplateDef {
  id: InvoiceTemplateId;
  label: string;
  description: string;
  paper: 'A4' | '80 mm' | '58 mm';
  usesColor: boolean;
}

export const TEMPLATES: TemplateDef[] = [
  { id: 'classic', label: 'Classic', description: 'The original GST invoice layout.', paper: 'A4', usesColor: false },
  { id: 'modern', label: 'Modern', description: 'Bold colour header band and highlighted total.', paper: 'A4', usesColor: true },
  { id: 'minimal', label: 'Minimal', description: 'Clean black-and-white, ink-saving.', paper: 'A4', usesColor: true },
  { id: 'thermal80', label: 'Thermal 3"', description: 'Receipt for 80 mm thermal printers.', paper: '80 mm', usesColor: false },
  { id: 'thermal58', label: 'Thermal 2"', description: 'Receipt for 58 mm thermal printers.', paper: '58 mm', usesColor: false },
];

export const TEMPLATE_COLORS: { value: string; label: string }[] = [
  { value: '#5b32d6', label: 'Indigo' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#0d9488', label: 'Teal' },
  { value: '#16a34a', label: 'Green' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#dc2626', label: 'Red' },
  { value: '#db2777', label: 'Pink' },
  { value: '#334155', label: 'Slate' },
];

export const DEFAULT_TEMPLATE: InvoiceTemplateId = 'classic';
export const DEFAULT_COLOR = TEMPLATE_COLORS[0].value;

export const getTemplate = (id?: string): TemplateDef => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];

export interface TemplateChoice {
  id: InvoiceTemplateId;
  color: string;
}

// Designs this client may use: Classic plus whatever the admin enabled.
export const allowedTemplates = (account: Account | null): InvoiceTemplateId[] => {
  const extra = (account?.invoice?.templates || []).filter((t) => t !== 'classic' && TEMPLATES.some((d) => d.id === t));
  return ['classic', ...extra];
};

export const clientCanChoose = (account: Account | null) => !!account?.invoice?.clientCanChoose && allowedTemplates(account).length > 1;

const isHex = (c?: string) => !!c && /^#[0-9a-f]{6}$/i.test(c);

// The design and colour to print with. Falls back to Classic whenever anything is missing
// or no longer allowed, so an admin change can never leave a client with a broken choice.
export const resolveTemplate = (account: Account | null, profile: Pick<UserProfile, 'invoiceTemplate' | 'invoiceColor'> | null): TemplateChoice => {
  const allowed = allowedTemplates(account);
  const cfg = account?.invoice;
  const own = clientCanChoose(account) ? profile?.invoiceTemplate : undefined;
  const id = own && allowed.includes(own) ? own : cfg?.defaultTemplate && allowed.includes(cfg.defaultTemplate) ? cfg.defaultTemplate : DEFAULT_TEMPLATE;
  const ownColor = clientCanChoose(account) ? profile?.invoiceColor : undefined;
  const color = isHex(ownColor) ? ownColor! : isHex(cfg?.color) ? cfg!.color! : DEFAULT_COLOR;
  return { id, color };
};
