import React, { useEffect, useState } from 'react';
import { Layout } from '../components/shared/Layout';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getBusinessProfile, updateBusinessProfile } from '../services/db';
import { FaIcon } from '../components/shared/FaIcon';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const profile = await getBusinessProfile(user.uid);
        if (profile) {
          setBusinessName(profile.businessName || '');
          setAddress(profile.address || '');
          setPhone(profile.phone || '');
          setInvoiceNotes(profile.invoiceNotes || '');
        }
      } catch (err) {
        toast.error('Failed to load settings profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!businessName.trim()) {
      toast.error('Business name is required');
      return;
    }

    try {
      setIsSaving(true);
      await updateBusinessProfile(user.uid, {
        businessName: businessName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        invoiceNotes: invoiceNotes.trim(),
      });
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl animate-slide-up">
        <div className="border-b border-slate-100 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center space-x-2.5 font-display">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FaIcon icon="fa-solid fa-gear" size={24} />
            </div>
            <span>Settings</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Customize your business identity and default invoice footer terms
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-emerald-500" size={36} />
            <p className="text-slate-500 text-sm font-semibold">Loading business profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card-glass space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Business / Brand Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Naitu Crochet"
                className="input-field"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Email (Account)
                </label>
                <input
                  type="text"
                  value={user?.email || ''}
                  className="input-field bg-slate-100/50 text-slate-400 cursor-not-allowed border-slate-200"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Business Address (Appears on Invoices)
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 123 Crochet Street, Guwahati, Assam, India"
                rows={3}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Default Invoice Footer Terms
              </label>
              <textarea
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="e.g. Goods once sold cannot be returned. Thank you for your support!"
                rows={3}
                className="input-field"
              />
            </div>

            <div className="border-t border-slate-100 pt-5 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex items-center space-x-2 py-2.5 px-5"
              >
                {isSaving ? (
                  <>
                    <FaIcon icon="fa-solid fa-spinner" size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaIcon icon="fa-solid fa-floppy-disk" size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};
