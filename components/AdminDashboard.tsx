
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell
} from 'recharts';
import { Order, Product, Payment } from '../types';
import { AdjustmentsIcon } from './Icons';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  payments: Payment[];
  onNavigateToManager: () => void;
}

const COLORS = ['#0d9488', '#0891b2', '#2563eb', '#7c3aed', '#db2777'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, products, payments, onNavigateToManager }) => {
  // Aggregate sales by product
  const productSalesMap = new Map<string, number>();
  orders.forEach(order => {
    order.items.forEach(item => {
      productSalesMap.set(item.name, (productSalesMap.get(item.name) || 0) + item.quantity);
    });
  });

  const topProductsData = Array.from(productSalesMap.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const revenueTrendData = [
    { date: 'Mon', total: 120000 },
    { date: 'Tue', total: 150000 },
    { date: 'Wed', total: 98000 },
    { date: 'Thu', total: 210000 },
    { date: 'Fri', total: 185000 },
    { date: 'Sat', total: 320000 },
    { date: 'Sun', total: 280000 },
  ];

  const totalRevenue = payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingOrdersCount = orders.filter(o => o.status === 'interest').length;

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">Operational Overview</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Real-time market analytics</p>
        </div>
        <button 
          onClick={onNavigateToManager}
          className="bg-teal-600 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-teal-100 hover:bg-teal-700 transition-all active:scale-95"
        >
          <AdjustmentsIcon className="w-5 h-5" />
          Manage Market Rates & Stock
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Interest Logs', value: pendingOrdersCount, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'SKUs Active', value: products.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Sales Volume', value: payments.filter(p => p.status === 'success').length, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-6 rounded-3xl border border-white shadow-sm transition-transform hover:scale-105`}>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <h3 className="font-black text-gray-800 text-xl mb-8 tracking-tight">Weekly Sales Velocity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₦${v / 1000}k`} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  formatter={(v: any) => [`₦${v.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                />
                <Line type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={4} dot={{ r: 6, fill: '#0d9488', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <h3 className="font-black text-gray-800 text-xl mb-8 tracking-tight">Procurement Leaders</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontSize: '10px', fontWeight: 800, fill: '#64748b', textTransform: 'uppercase' }} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                />
                <Bar dataKey="qty" radius={[0, 10, 10, 0]} barSize={30}>
                  {topProductsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
