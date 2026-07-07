import React, { useEffect, useState } from 'react';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { BillForm } from '../components/Bills/BillForm';
import { BillDetailModal } from '../components/Bills/BillDetailModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { 
  getBills, 
  getProducts, 
  getBusinessProfile, 
  addBill 
} from '../services/db';
import { Bill, Product, UserProfile, BillItem } from '../types';

export const BillsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [businessProfile, setBusinessProfile] = useState<UserProfile | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  
  // Selection
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [billsData, productsData, profileData] = await Promise.all([
        getBills(user.uid),
        getProducts(user.uid),
        getBusinessProfile(user.uid)
      ]);
      setBills(billsData);
      setProducts(productsData);
      setBusinessProfile(profileData);
    } catch (err) {
      toast.error('Failed to load invoicing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleSaveBill = async (
    customerName: string, 
    items: BillItem[], 
    notes?: string
  ) => {
    if (!user) return;
    try {
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const total = subtotal; // Assuming 0% tax for simplicity

      // Calculate sequential bill details
      const q = await import('../services/db');
      const next = await q.getNextBillNumber(user.uid);

      const billData = {
        billNo: next.billNo,
        billSeqNum: next.billSeqNum,
        customerName,
        items,
        subtotal,
        tax: 0,
        total,
        notes
      };

      const newBill = await addBill(user.uid, billData);
      toast.success('Invoice saved successfully');
      
      // Update local state and show detail modal
      setBills([newBill, ...bills]);
      setSelectedBill(newBill);
      setIsDetailOpen(true);
      setViewMode('list');
    } catch (err) {
      toast.error('Failed to save bill');
      throw err;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up">
        {/* Top bar */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
              {viewMode === 'create' ? 'New Invoice' : 'Bills & Invoices'}
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              {viewMode === 'create' 
                ? 'Generate customer invoice' 
                : 'Create and manage client transactions'
              }
            </p>
          </div>

          <div>
            {viewMode === 'create' ? (
              <button 
                onClick={() => setViewMode('list')}
                className="btn-secondary flex items-center space-x-2 py-2.5 px-4.5"
              >
                <FaIcon icon="fa-solid fa-arrow-left" size={16} />
                <span>Back to List</span>
              </button>
            ) : (
              <button 
                onClick={() => setViewMode('create')}
                className="btn-primary flex items-center space-x-2 py-2.5 px-4.5"
              >
                <FaIcon icon="fa-solid fa-plus" size={16} />
                <span>New Bill</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-emerald-500" size={40} />
            <p className="text-slate-500 font-semibold">Loading invoices...</p>
          </div>
        ) : viewMode === 'create' ? (
          <BillForm 
            userId={user?.uid || ''}
            products={products}
            onSave={handleSaveBill}
            onCancel={() => setViewMode('list')}
          />
        ) : (
          /* List Mode Table */
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 w-44">Invoice No</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Total</th>
                    <th className="p-4 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {bills.length > 0 ? (
                    bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-4 font-bold text-slate-800 flex items-center space-x-2.5 font-mono">
                          <FaIcon icon="fa-solid fa-file-invoice" size={16} className="text-teal-650" />
                          <span>{bill.billNo}</span>
                        </td>
                        <td className="p-4 font-bold text-slate-700">
                          {bill.customerName}
                        </td>
                        <td className="p-4 text-slate-400 font-semibold text-xs">
                          {formatDate(bill.createdAt)}
                        </td>
                        <td className="p-4 font-extrabold text-emerald-700 font-mono">
                          ₹{bill.total.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => {
                                setSelectedBill(bill);
                                setIsDetailOpen(true);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                              title="View Invoice"
                            >
                              <FaIcon icon="fa-solid fa-eye" size={14} />
                              <span>View</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-16 text-center text-slate-400 font-semibold">
                        No bills created yet. Click "New Bill" to generate your first invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bill Detail Modal */}
      <BillDetailModal 
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
        businessProfile={businessProfile}
      />
    </Layout>
  );
};
