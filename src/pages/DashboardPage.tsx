import React, { useEffect, useState } from 'react';
import { Layout } from '../components/shared/Layout';
import { BillDetailModal } from '../components/Bills/BillDetailModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { getBills, getProducts, getBusinessProfile } from '../services/db';
import { Bill, Product, UserProfile } from '../types';
import { Loader2, Eye, FileText, ShoppingBag, Plus, PackageOpen, TrendingUp, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  const getTimestampMs = (createdAt: any) => {
    if (!createdAt) return 0;
    if (createdAt.seconds) return createdAt.seconds * 1000;
    return new Date(createdAt).getTime();
  };

  const todaysSales = bills
    .filter((b) => getTimestampMs(b.createdAt) >= getStartOfToday())
    .reduce((sum, b) => sum + b.total, 0);

  const averageOrderValue = totalBills > 0
    ? bills.reduce((sum, b) => sum + b.total, 0) / totalBills
    : 0;

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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-IN');
    }
    return new Date(timestamp).toLocaleDateString('en-IN');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
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
              <PackageOpen size={16} className="text-emerald-600" />
            </div>
            <div className="label">TOTAL PRODUCTS</div>
            <div className="value">{totalProducts}</div>
            <div className="text-sm text-slate-500 mt-2">Active inventory</div>
          </div>

          <div className="metric-card slide-in-up relative" style={{ animationDelay: '0.08s' }}>
            <div className="absolute top-3 right-3 metric-icon">
              <TrendingUp size={16} className="text-sky-500" />
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
              <FileText size={16} className="text-violet-500" />
            </div>
            <div className="label">TOTAL BILLS</div>
            <div className="value">{totalBills}</div>
            <div className="text-sm text-slate-500 mt-2">This month</div>
          </div>

          <div className="metric-card slide-in-up relative" style={{ animationDelay: '0.24s' }}>
            <div className="absolute top-3 right-3 metric-icon">
              <DollarSign size={16} className="text-amber-500" />
            </div>
            <div className="label">AVG ORDER VALUE</div>
            <div className="value">₹{averageOrderValue.toFixed(0)}</div>
            <div className="text-sm text-slate-500 mt-2">Per transaction</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="trading-card p-4">
              <h3 className="text-lg font-bold mb-4 text-center">TRADING ACTIONS</h3>
              <div className="space-y-4">
                <Link to="/bills" state={{ create: true }} className="block">
                  <div className="action-btn action-new hover:brightness-95">
                    <div className="action-icon">
                      <Plus size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">NEW BILL</div>
                      <div className="text-xs text-emerald-100">Create transaction</div>
                    </div>
                  </div>
                </Link>

                <Link to="/products" className="block">
                  <div className="action-btn action-add hover:brightness-95">
                    <div className="action-icon">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">ADD PRODUCT</div>
                      <div className="text-xs text-sky-100">Update inventory</div>
                    </div>
                  </div>
                </Link>

                <Link to="/dashboard" className="block">
                  <div className="action-btn action-dashboard hover:brightness-95">
                    <div className="action-icon">
                      <PackageOpen size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">DASHBOARD</div>
                      <div className="text-xs text-violet-100">View analytics</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="trading-card p-4">
              <h3 className="text-lg font-bold mb-4">MARKET STATUS</h3>
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
                  <span className="text-slate-400">Data Points</span>
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
                      className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="grid h-12 w-12 place-items-center rounded-3xl bg-emerald-50 text-emerald-700">
                          <FileText size={18} />
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
                          className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-emerald-700"
                          title="View Invoice"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="recent-empty">
                    <div className="text-5xl text-slate-300">
                      <FileText />
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
                <h3 className="text-lg font-bold mb-4">QUICK STATS</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Success Rate</span>
                    <span className="text-emerald-500 font-bold">100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Processing</span>
                    <span className="text-sky-500 font-bold">2.3s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Sessions</span>
                    <span className="text-violet-500 font-bold">1</span>
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
