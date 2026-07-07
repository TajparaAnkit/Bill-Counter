import React from 'react';
import { FaIcon } from '../shared/FaIcon';
import { MetricsCard } from './MetricsCard';

interface DashboardMetricsProps {
  totalProducts: number;
  totalBills: number;
  todaysSales: number;
  averageOrderValue: number;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  totalProducts,
  totalBills,
  todaysSales,
  averageOrderValue,
}) => {
  const metrics = [
    {
      label: 'ACTIVE PRODUCTS',
      value: totalProducts,
      icon: <FaIcon icon="fa-solid fa-box" size={16} />,
      subtext: 'Unique items in inventory',
    },
    {
      label: "TODAY'S SALES",
      value: `₹${Math.round(todaysSales).toLocaleString('en-IN')}`,
      icon: <span className="font-extrabold text-sm">₹</span>,
      subtext: 'vs yesterday',
      trend: { value: 0, isPositive: true },
    },
    {
      label: 'TOTAL INVOICES',
      value: totalBills,
      icon: <FaIcon icon="fa-solid fa-file-invoice" size={16} />,
      subtext: "This month's invoices",
    },
    {
      label: 'AVG ORDER VALUE',
      value: `₹${Math.round(averageOrderValue).toLocaleString('en-IN')}`,
      icon: <FaIcon icon="fa-solid fa-arrow-trend-up" size={16} />,
      subtext: 'Average invoice amount',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <MetricsCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          icon={metric.icon}
          subtext={metric.subtext}
          trend={metric.trend}
        />
      ))}
    </div>
  );
};
