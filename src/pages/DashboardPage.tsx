import React, { useEffect, useState } from 'react';
import { Layout } from '../components/shared/Layout';
import { BillDetailModal } from '../components/Bills/BillDetailModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getBills, getProducts, getBusinessProfile } from '../services/db';
import { Bill, Product, UserProfile } from '../types';
import { FaIcon } from '../components/shared/FaIcon';
import { getAmountDue, getPaymentStatus } from '../utils/payment';
import { formatDate, toMillis } from '../utils/format';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [businessProfile, setBusinessProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal actions
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const [billsData, productsData, profileData] = await Promise.all([
          getBills(user.uid),
          getProducts(user.uid),
          getBusinessProfile(user.uid),
        ]);
        setBills(billsData);
        setProducts(productsData);
        setBusinessProfile(profileData);
      } catch (err) {
        toast.error('Failed to load dashboard metrics');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Statistics calculation
  const totalProducts = products.length;
  const totalBills = bills.length;

  const getStartOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const todaysSales = bills
    .filter((b) => toMillis(b.createdAt) >= getStartOfToday())
    .reduce((sum, b) => sum + b.total, 0);

  const averageOrderValue = totalBills > 0
    ? bills.reduce((sum, b) => sum + b.total, 0) / totalBills
    : 0;

  // Receivables
  const outstanding = bills.reduce((sum, b) => sum + getAmountDue(b), 0);
  const paidCount = bills.filter((b) => getPaymentStatus(b) === 'paid').length;
  const unpaidCount = bills.filter((b) => getPaymentStatus(b) !== 'paid').length;

  // Last 7 days sales trend (for the mini bar chart)
  const last7Days = (() => {
    const days: { label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      const end = start + 86400000;
      const total = bills
        .filter((b) => {
          const t = toMillis(b.createdAt);
          return t >= start && t < end;
        })
        .reduce((s, b) => s + b.total, 0);
      days.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), total });
    }
    return days;
  })();
  const maxDay = Math.max(1, ...last7Days.map((d) => d.total));
  const sevenDayTotal = last7Days.reduce((s, d) => s + d.total, 0);

  // Recent Bills (Top 5)
  const recentBills = bills.slice(0, 5);

  // Top Products calculation
  const getTopProducts = () => {
    const productCounts: { [name: string]: { qty: number; totalSales: number } } = {};

    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        if (!productCounts[item.productName]) {
          productCounts[item.productName] = { qty: 0, totalSales: 0 };
        }
        productCounts[item.productName].qty += item.quantity;
        productCounts[item.productName].totalSales += item.total;
      });
    });

    return Object.entries(productCounts)
      .map(([name, stats]) => ({
        name,
        qty: stats.qty,
        totalSales: stats.totalSales,
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4); // Show top 4 items like the screenshot
  };

  const topProductsList = getTopProducts();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-500 font-semibold">Loading dashboard overview...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="metric-card slide-in-up relative" style={{ animationDelay: '0s' }}>
            <div className="absolute top-3 right-3 metric-icon">
              <FaIcon icon="fa-solid fa-box" size={16} className="text-blue-600" />
            </div>
            <div className="label">TOTAL PRODUCTS</div>
            <div className="value">{totalProducts}</div>
            <div className="text-sm text-slate-500 mt-2">Active inventory</div>
          </div>

          <div className="metric-card slide-in-up relative" style={{ animationDelay: '0.08s' }}>
            <div className="absolute top-3 right-3 metric-icon">
              <FaIcon icon="fa-solid fa-arrow-trend-up" size={16} className="text-sky-500" />
            </div>
            <div className="label">TODAY'S SALES</div>
            <div className="value">₹{todaysSales.toFixed(0)}</div>
            <div className="flex items-center mt-2 gap-2 text-sm">
              <span className="text-emerald-500 font-semibold">+0%</span>
              <span className="text-slate-500">vs yesterday</span>
            </div>
          </div>

          <div className="metric-card slide-in-up relative" style={{ animationDelay: '0.16s' }}>
            <div className="absolute top-3 right-3 metric-icon">
              <FaIcon icon="fa-solid fa-file-invoice" size={16} className="text-violet-500" />
            </div>
            <div className="label">TOTAL BILLS</div>
            <div className="value">{totalBills}</div>
            <div className="text-sm text-slate-500 mt-2">This month</div>
          </div>

          <div className="metric-card slide-in-up relative" style={{ animationDelay: '0.24s' }}>
            <div className="absolute top-3 right-3 metric-icon">
              <FaIcon icon="fa-solid fa-indian-rupee-sign" size={16} className="text-amber-500" />
            </div>
            <div className="label">AVG ORDER VALUE</div>
            <div className="value">₹{averageOrderValue.toFixed(0)}</div>
            <div className="text-sm text-slate-500 mt-2">Per transaction</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            {/* Last 7 days sales trend */}
            <div className="trading-card p-5">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-lg font-bold">LAST 7 DAYS</h3>
                <span className="text-xs font-bold text-blue-700">₹{sevenDayTotal.toFixed(0)}</span>
              </div>
              <p className="text-xs text-slate-400 mb-5">Daily sales trend</p>
              <div className="flex items-end justify-between gap-2">
                {last7Days.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full h-28 flex items-end justify-center">
                      <div
                        className="w-6 rounded-t-lg bg-gradient-to-t from-blue-700 to-blue-500 transition-all duration-300 group-hover:from-blue-800 group-hover:to-blue-600"
                        style={{ height: `${Math.max(4, (d.total / maxDay) * 112)}px` }}
                        title={`₹${d.total.toFixed(0)}`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="trading-card p-4">
              <h3 className="text-lg font-bold mb-4">STORE STATUS</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-500 font-bold">ONLINE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last Sync</span>
                  <span className="font-mono text-sm text-slate-700">{new Date().toLocaleTimeString('en-US', { hour12: true })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Records</span>
                  <span className="text-sky-500 font-semibold">{totalProducts + totalBills}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="recent-card">
              <div className="recent-card-header">
                <h3 className="text-lg font-bold">RECENT TRANSACTIONS</h3>
                <div className="text-sm text-slate-400">Live Feed</div>
              </div>

              <div className="space-y-4">
                {recentBills.length > 0 ? (
                  recentBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="grid h-12 w-12 place-items-center rounded-3xl bg-blue-50 text-blue-700">
                          <FaIcon icon="fa-solid fa-file-invoice" size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">{bill.billNo}</p>
                          <p className="mt-1 text-xs text-slate-500">{bill.customerName} • {formatDate(bill.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-slate-950">₹{bill.total.toFixed(2)}</p>
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setIsDetailOpen(true);
                          }}
                          className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-blue-700"
                          title="View Invoice"
                        >
                          <FaIcon icon="fa-solid fa-eye" size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="recent-empty">
                    <div className="text-5xl text-slate-300">
                      <FaIcon icon="fa-solid fa-file-invoice" />
                    </div>
                    <p className="text-base font-semibold text-slate-500">No recent transactions</p>
                    <p className="text-sm text-slate-400">Start adding bills to see your live feed here.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="trading-card p-4">
                <h3 className="text-lg font-bold mb-4">TOP PRODUCTS</h3>
                <div className="space-y-3">
                  {topProductsList.length > 0 ? (
                    topProductsList.map((item) => {
                      const matchingProd = products.find(p => p.name === item.name);
                      return (
                        <div key={item.name} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-white border border-slate-200">
                              {matchingProd?.imageUrl ? (
                                <img src={matchingProd.imageUrl} alt={item.name} className="h-10 w-10 object-cover rounded-2xl" />
                              ) : (
                                <span className="text-sm">🧶</span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-950">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.qty} sold</p>
                            </div>
                          </div>
                          <p className="text-sm font-extrabold text-slate-950">₹{item.totalSales.toFixed(0)}</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-slate-400 py-8">
                      <div className="text-2xl mb-2 text-slate-300">🧶</div>
                      <p className="text-sm">No products yet</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="trading-card p-4">
                <h3 className="text-lg font-bold mb-4">PAYMENTS</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outstanding Dues</span>
                    <span className="text-rose-500 font-bold">₹{outstanding.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paid Invoices</span>
                    <span className="text-emerald-500 font-bold">{paidCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unpaid / Partial</span>
                    <span className="text-amber-500 font-bold">{unpaidCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
