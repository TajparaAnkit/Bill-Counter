import React, { useEffect, useRef, useState } from 'react';
import { Layout } from '../components/shared/Layout';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getBusinessProfile, updateBusinessProfile, uploadImageToCloudinary } from '../services/db';
import { FaIcon } from '../components/shared/FaIcon';
import { INDIAN_STATES, stateFromGSTIN } from '../utils/tax';
import { validateGSTIN, validatePAN, validateEmail, panFromGSTIN } from '../utils/validators';
import { BUSINESS_TYPES, INDUSTRY_TYPES, REGISTRATION_TYPES } from '../config/business';
import { Select, MultiSelect, Combobox } from '../components/ui/Select';

const label = 'block text-sm font-semibold text-slate-600 mb-1.5';
const field =
  'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition disabled:bg-slate-100 disabled:text-slate-400';
const errCls = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
    <header className="px-5 py-3 border-b border-slate-200 bg-slate-50/60">
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </header>
    <div className="p-5 space-y-5">{children}</div>
  </section>
);

// Downscale an image in the browser before upload so invoices/PDFs stay small.
const downscaleImage = (file: File, maxSide = 600): Promise<File> =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      if (scale === 1) return resolve(file);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, '.png'), { type: 'image/png' }) : file), 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

// Image upload tile (logo / signature)
const ImageUpload: React.FC<{
  title: string;
  hint: string;
  url: string;
  onChange: (url: string) => void;
  aspect?: 'square' | 'wide';
}> = ({ title, hint, url, onChange, aspect = 'square' }) => {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const pick = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    try {
      setBusy(true);
      const small = await downscaleImage(file, aspect === 'square' ? 512 : 800);
      const uploaded = await uploadImageToCloudinary(small);
      onChange(uploaded);
      toast.success(`${title} uploaded`);
    } catch (err: any) {
      toast.error(`Upload failed: ${err?.message || 'unknown error'}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <span className={label}>{title}</span>
      <div
        className={`relative flex items-center justify-center rounded-lg border-2 border-dashed border-brand-300 bg-white overflow-hidden ${
          aspect === 'square' ? 'w-36 h-36' : 'w-56 h-28'
        }`}
      >
        {url ? (
          <img src={url} alt={title} className="max-w-full max-h-full object-contain p-2" />
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-brand-700 text-xs font-semibold p-3">
            <FaIcon icon="fa-solid fa-cloud-arrow-up" size={20} />
            Upload {title.toLowerCase()}
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 bg-white grid place-items-center">
            <FaIcon icon="fa-solid fa-spinner" size={18} className="animate-spin text-brand-600" />
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-xs">
        {url && (
          <>
            <button type="button" onClick={() => onChange('')} className="text-rose-600 font-semibold hover:underline">
              Remove
            </button>
            <button type="button" onClick={() => inputRef.current?.click()} className="text-brand-700 font-semibold hover:underline">
              Change
            </button>
          </>
        )}
        <span className="text-slate-400">{hint}</span>
      </div>
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  // Manage Business
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [gstRegistered, setGstRegistered] = useState(false);
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [industryType, setIndustryType] = useState('');
  const [registrationType, setRegistrationType] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [businessDetails, setBusinessDetails] = useState<{ label: string; value: string }[]>([]);
  const [newDetailLabel, setNewDetailLabel] = useState('');
  const [newDetailValue, setNewDetailValue] = useState('');

  // Invoice defaults
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [upiId, setUpiId] = useState('');
  const [billPrefix, setBillPrefix] = useState('');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [defaultTaxRate, setDefaultTaxRate] = useState('');

  // Bank
  const [bankName, setBankName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const p = await getBusinessProfile(user.uid);
        if (p) {
          setBusinessName(p.businessName || '');
          setPhone(p.phone || '');
          setCompanyEmail(p.companyEmail || '');
          setAddress(p.address || '');
          setState(p.state || '');
          setPincode(p.pincode || '');
          setCity(p.city || '');
          setGstin(p.gstin || '');
          // Legacy profiles: treat a saved GSTIN as "registered"
          setGstRegistered(p.gstRegistered ?? !!p.gstin);
          setPan(p.pan || '');
          setBusinessTypes(p.businessTypes || []);
          setIndustryType(p.industryType || '');
          setRegistrationType(p.registrationType || '');
          setLogoUrl(p.logoUrl || '');
          setSignatureUrl(p.signatureUrl || '');
          setBusinessDetails(p.businessDetails || []);
          setInvoiceNotes(p.invoiceNotes || '');
          setUpiId(p.upiId || '');
          setBillPrefix(p.billPrefix || '');
          setTaxEnabled(!!p.taxEnabled);
          setDefaultTaxRate(p.defaultTaxRate != null ? String(p.defaultTaxRate) : '');
          setBankName(p.bankName || '');
          setBankAccountNo(p.bankAccountNo || '');
          setBankIfsc(p.bankIfsc || '');
          setBankBranch(p.bankBranch || '');
          setBankAccountHolder(p.bankAccountHolder || '');
        }
      } catch (err) {
        toast.error('Failed to load settings profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const clearError = (k: string) =>
    setErrors((e) => {
      if (!e[k]) return e;
      const n = { ...e };
      delete n[k];
      return n;
    });

  const handleGstinChange = (v: string) => {
    const upper = v.toUpperCase();
    setGstin(upper);
    clearError('gstin');
    const guessed = stateFromGSTIN(upper);
    if (guessed && !state) setState(guessed);
    const derived = panFromGSTIN(upper);
    if (derived && !pan) setPan(derived);
  };

  const addDetail = () => {
    const l = newDetailLabel.trim();
    const v = newDetailValue.trim();
    if (!l || !v) {
      toast.warning('Enter both a label and a value');
      return;
    }
    setBusinessDetails((d) => [...d, { label: l, value: v }]);
    setNewDetailLabel('');
    setNewDetailValue('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const errs: Record<string, string> = {};
    if (!businessName.trim()) errs.businessName = 'Business name is required';
    if (companyEmail.trim() && !validateEmail(companyEmail.trim())) errs.companyEmail = 'Enter a valid email';
    if (gstRegistered && !gstin.trim()) errs.gstin = 'GSTIN is required when GST registered';
    if (gstin.trim() && !validateGSTIN(gstin)) errs.gstin = 'Invalid GSTIN format (e.g. 24AORPT2645F1ZN)';
    if (pan.trim() && !validatePAN(pan)) errs.pan = 'Invalid PAN format (e.g. AORPT2645F)';
    if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) errs.pincode = 'Pincode must be 6 digits';
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    try {
      setIsSaving(true);
      await updateBusinessProfile(user.uid, {
        businessName: businessName.trim(),
        phone: phone.trim(),
        companyEmail: companyEmail.trim(),
        address: address.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        city: city.trim(),
        gstRegistered,
        gstin: gstRegistered ? gstin.trim().toUpperCase() : '',
        pan: pan.trim().toUpperCase(),
        businessTypes,
        industryType: industryType.trim(),
        registrationType: registrationType.trim(),
        logoUrl,
        signatureUrl,
        businessDetails,
        invoiceNotes: invoiceNotes.trim(),
        upiId: upiId.trim(),
        billPrefix: billPrefix.trim().toUpperCase(),
        taxEnabled,
        defaultTaxRate: defaultTaxRate.trim() ? Math.max(0, parseFloat(defaultTaxRate) || 0) : 0,
        bankName: bankName.trim(),
        bankAccountNo: bankAccountNo.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
        bankBranch: bankBranch.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
      });
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const SaveButton = (
    <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60">
      {isSaving ? <FaIcon icon="fa-solid fa-spinner" size={14} className="animate-spin" /> : <FaIcon icon="fa-solid fa-floppy-disk" size={14} />}
      Save Changes
    </button>
  );

  return (
    <Layout>
      <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Business Settings</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Manage your business details and everything printed on invoices</p>
          </div>
          {!isLoading && SaveButton}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-brand-500" size={36} />
            <p className="text-slate-500 text-sm font-semibold">Loading business profile...</p>
          </div>
        ) : (
          <>
            {/* ===== Manage Business ===== */}
            <Section title="Manage Business" subtitle="Details below are shown on your invoices and public catalog">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left column */}
                <div className="space-y-5">
                  <div className="flex items-start gap-5">
                    <ImageUpload title="Logo" hint="Square PNG works best. Falls back to the Bill Counter mark." url={logoUrl} onChange={setLogoUrl} />
                    <div className="flex-1">
                      <label className={label}>
                        Business Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => {
                          setBusinessName(e.target.value);
                          clearError('businessName');
                        }}
                        placeholder="e.g. Dwarkadhish Marketing"
                        className={`${field} ${errors.businessName ? errCls : ''}`}
                      />
                      {errors.businessName && <p className="mt-1 text-xs text-rose-600">{errors.businessName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Company Phone Number</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9712717273" className={field} />
                    </div>
                    <div>
                      <label className={label}>Company E-Mail</label>
                      <input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => {
                          setCompanyEmail(e.target.value);
                          clearError('companyEmail');
                        }}
                        placeholder={user?.email || 'name@company.com'}
                        className={`${field} ${errors.companyEmail ? errCls : ''}`}
                      />
                      {errors.companyEmail ? (
                        <p className="mt-1 text-xs text-rose-600">{errors.companyEmail}</p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-400">Leave blank to use your login email ({user?.email}).</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={label}>Billing Address</label>
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, landmark" rows={3} className={field} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={label}>State</label>
                      <Select
                        aria-label="State"
                        searchable
                        clearable
                        placeholder="Select state"
                        options={INDIAN_STATES.map((st) => st.name)}
                        value={state}
                        onChange={setState}
                      />
                      <p className="mt-1 text-xs text-slate-400">Used with Place of Supply to pick CGST+SGST or IGST.</p>
                    </div>
                    <div>
                      <label className={label}>Pincode</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={pincode}
                        onChange={(e) => {
                          setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                          clearError('pincode');
                        }}
                        placeholder="Enter Pincode"
                        className={`${field} ${errors.pincode ? errCls : ''}`}
                      />
                      {errors.pincode && <p className="mt-1 text-xs text-rose-600">{errors.pincode}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={label}>City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter City" className={field} />
                  </div>

                  <div>
                    <label className={label}>Are you GST Registered?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { v: true, t: 'Yes' },
                        { v: false, t: 'No' },
                      ].map((o) => (
                        <button
                          key={o.t}
                          type="button"
                          onClick={() => {
                            setGstRegistered(o.v);
                            clearError('gstin');
                          }}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-semibold transition ${
                            gstRegistered === o.v ? 'border-brand-600 text-slate-800 bg-brand-50/40' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {o.t}
                          <span className={`w-4 h-4 rounded-full border-2 grid place-items-center ${gstRegistered === o.v ? 'border-brand-700' : 'border-slate-300'}`}>
                            {gstRegistered === o.v && <span className="w-2 h-2 rounded-full bg-brand-700" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {gstRegistered && (
                    <div>
                      <label className={label}>
                        GSTIN <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => handleGstinChange(e.target.value)}
                        placeholder="e.g. 24AORPT2645F1ZN"
                        maxLength={15}
                        className={`${field} uppercase font-mono ${errors.gstin ? errCls : ''}`}
                      />
                      {errors.gstin ? <p className="mt-1 text-xs text-rose-600">{errors.gstin}</p> : <p className="mt-1 text-xs text-slate-400">State and PAN are auto-filled from a valid GSTIN.</p>}
                    </div>
                  )}

                  <div>
                    <label className={label}>PAN Number</label>
                    <input
                      type="text"
                      value={pan}
                      onChange={(e) => {
                        setPan(e.target.value.toUpperCase());
                        clearError('pan');
                      }}
                      placeholder="Enter your PAN Number"
                      maxLength={10}
                      className={`${field} uppercase font-mono ${errors.pan ? errCls : ''}`}
                    />
                    {errors.pan && <p className="mt-1 text-xs text-rose-600">{errors.pan}</p>}
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Business Type (Select multiple, if applicable)</label>
                      <MultiSelect options={BUSINESS_TYPES} value={businessTypes} onChange={setBusinessTypes} placeholder="Select business type" />
                    </div>
                    <div>
                      <label className={label}>Industry Type</label>
                      <Select aria-label="Industry type" searchable clearable options={INDUSTRY_TYPES} value={industryType} onChange={setIndustryType} placeholder="Search industry" />
                    </div>
                  </div>
                  <div className="sm:w-1/2 sm:pr-2">
                    <label className={label}>Business Registration Type</label>
                    <Select
                      aria-label="Business registration type"
                      clearable
                      placeholder="Select registration type"
                      options={REGISTRATION_TYPES}
                      value={registrationType}
                      onChange={setRegistrationType}
                    />
                  </div>

                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-600">
                    <strong className="text-slate-700">Note:</strong> Details added below will be shown on your invoices.
                  </div>

                  <ImageUpload title="Signature" hint="Printed above “Authorised Signature”." url={signatureUrl} onChange={setSignatureUrl} aspect="wide" />

                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-200">
                      <p className="text-sm font-bold text-slate-700">Add Business Details</p>
                      <p className="text-xs text-slate-400">Add additional business information such as MSME number, Website etc.</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {businessDetails.length > 0 && (
                        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                          {businessDetails.map((d, i) => (
                            <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                              <span className="font-semibold text-slate-700 w-32 truncate">{d.label}</span>
                              <span className="text-slate-400">=</span>
                              <span className="flex-1 text-slate-600 truncate">{d.value}</span>
                              <button type="button" onClick={() => setBusinessDetails((ds) => ds.filter((_, j) => j !== i))} className="p-1.5 text-slate-400 hover:text-rose-600" title="Remove">
                                <FaIcon icon="fa-solid fa-xmark" size={12} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="sm:flex-1">
                          <Combobox
                            aria-label="Business detail label"
                            options={['Website', 'MSME Number', 'FSSAI', 'Udyam Number', 'CIN', 'Drug License', 'Import Export Code']}
                            value={newDetailLabel}
                            onChange={setNewDetailLabel}
                            placeholder="Website"
                            className={field}
                          />
                        </div>
                        <span className="hidden sm:inline text-slate-400">=</span>
                        <input type="text" value={newDetailValue} onChange={(e) => setNewDetailValue(e.target.value)} placeholder="www.website.com" className={`${field} sm:flex-[1.4]`} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDetail(); } }} />
                        <button type="button" onClick={addDetail} className="px-5 py-2.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold">
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* ===== Invoice defaults ===== */}
            <Section title="Invoice Defaults" subtitle="Numbering, tax and payment defaults for new invoices">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Invoice Number Prefix</label>
                  <input type="text" value={billPrefix} onChange={(e) => setBillPrefix(e.target.value)} placeholder="e.g. INV" maxLength={10} className={`${field} uppercase`} />
                  <p className="mt-1 text-xs text-slate-400">
                    Invoices are numbered like <span className="font-mono">{billPrefix.trim().toUpperCase() || 'INV'}-0001</span>. Editable per invoice.
                  </p>
                </div>
                <div>
                  <label className={label}>UPI ID (for Payment QR)</label>
                  <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. yourname@okhdfcbank" className={field} />
                  <p className="mt-1 text-xs text-slate-400">Generates a scan-to-pay QR on invoices. Leave blank to hide it.</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5 space-y-4">
                <label className="flex items-center justify-between gap-4 cursor-pointer">
                  <span>
                    <span className="block text-sm font-bold text-slate-700">Apply GST on new invoices by default</span>
                    <span className="block text-xs text-slate-400 mt-0.5">Sets the default tax rate on each new line item. You can change the rate per item.</span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={taxEnabled}
                    onClick={() => setTaxEnabled((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${taxEnabled ? 'bg-brand-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${taxEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </label>
                {taxEnabled && (
                  <div className="md:w-1/2 md:pr-2">
                    <label className={label}>Default Tax Rate (%)</label>
                    <input type="number" min="0" step="0.01" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(e.target.value)} placeholder="e.g. 18" className={field} />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-5">
                <label className={label}>Default Terms &amp; Conditions</label>
                <textarea value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} placeholder="e.g. Goods once sold cannot be returned. Payment due within 7 days." rows={3} className={field} />
                <p className="mt-1 text-xs text-slate-400">Prefilled into &quot;Add Terms &amp; Conditions&quot; on new invoices; editable per bill.</p>
              </div>
            </Section>

            {/* ===== Bank ===== */}
            <Section title="Bank Account" subtitle="Optional. Toggle “Add Bank Account” on an invoice to print these details.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Account Holder</label>
                  <input type="text" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} placeholder="e.g. Dwarkadhish Marketing" className={field} />
                </div>
                <div>
                  <label className={label}>Bank Name</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className={field} />
                </div>
                <div>
                  <label className={label}>Account Number</label>
                  <input type="text" value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} placeholder="e.g. 50100123456789" className={field} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={label}>IFSC</label>
                    <input type="text" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} placeholder="HDFC0001234" maxLength={11} className={`${field} uppercase`} />
                  </div>
                  <div>
                    <label className={label}>Branch</label>
                    <input type="text" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} placeholder="e.g. Rajkot" className={field} />
                  </div>
                </div>
              </div>
            </Section>

            <div className="flex justify-end pt-1">{SaveButton}</div>
          </>
        )}
      </form>
    </Layout>
  );
};
