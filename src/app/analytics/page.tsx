"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalProfit: 0,
    customers: 0,
    growth: 0,
    activeOrders: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch current month total profit
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const { data: thisMonthOrders } = await supabase
        .from('orders')
        .select('profit')
        .gte('created_at', firstDayThisMonth) as { data: { profit: number }[] | null };

      const { data: lastMonthOrders } = await supabase
        .from('orders')
        .select('profit')
        .gte('created_at', firstDayLastMonth)
        .lt('created_at', firstDayThisMonth) as { data: { profit: number }[] | null };

      const thisMonthProfit = thisMonthOrders?.reduce((acc, curr) => acc + (curr.profit || 0), 0) || 0;
      const lastMonthProfit = lastMonthOrders?.reduce((acc, curr) => acc + (curr.profit || 0), 0) || 0;

      // Calculate MoM Growth
      const growthPercent = lastMonthProfit === 0 
        ? 100 
        : ((thisMonthProfit - lastMonthProfit) / lastMonthProfit) * 100;

      const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      const { count: activeOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).neq('status', 'Delivered');

      // 2. Fetch last 30 days for chart
      const thirtyDaysAgo = startOfDay(subDays(now, 30)).toISOString();
      const { data: chartOrders } = await supabase
        .from('orders')
        .select('created_at, profit')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true }) as { data: { created_at: string; profit: number }[] | null };

      const dailyData: Record<string, number> = {};
      
      // Initialize last 30 days with 0
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(now, i), 'MMM dd');
        dailyData[d] = 0;
      }

      if (chartOrders) {
        chartOrders.forEach(order => {
          const day = format(new Date(order.created_at), 'MMM dd');
          if (dailyData[day] !== undefined) {
            dailyData[day] += (order.profit || 0);
          }
        });
      }

      const formattedChartData = Object.keys(dailyData).map(date => ({
        date,
        profit: dailyData[date]
      }));

      setChartData(formattedChartData);

      setStats({
        totalProfit: thisMonthProfit,
        customers: customerCount || 0,
        growth: Math.round(growthPercent),
        activeOrders: activeOrdersCount || 0
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-foreground/50">Loading live analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Analytics</h2>
          <p className="text-foreground/70 mt-1">Real-time performance and growth metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-2 text-foreground/70">
            <TrendingUp size={20} className="text-green-500" />
            <h3 className="font-bold">M-o-M Growth</h3>
          </div>
          <p className="text-4xl font-black text-green-500">+{stats.growth}%</p>
          <p className="text-xs text-foreground/50 mt-2">Compared to previous month</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-2 text-foreground/70">
            <DollarSign size={20} className="text-neon-blue" />
            <h3 className="font-bold">MTD Profit</h3>
          </div>
          <p className="text-4xl font-black text-neon-blue">${stats.totalProfit.toLocaleString()}</p>
          <p className="text-xs text-foreground/50 mt-2">Month-to-date total profit</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-2 text-foreground/70">
            <Users size={20} className="text-electric-cyan" />
            <h3 className="font-bold">Total Customers</h3>
          </div>
          <p className="text-4xl font-black">{stats.customers}</p>
          <p className="text-xs text-foreground/50 mt-2">Unique clients in database</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-2 text-foreground/70">
            <Activity size={20} className="text-orange-500" />
            <h3 className="font-bold">Active Orders</h3>
          </div>
          <p className="text-4xl font-black text-orange-500">{stats.activeOrders}</p>
          <p className="text-xs text-foreground/50 mt-2">Orders in transit/posted</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-border h-96">
        <h3 className="text-lg font-bold mb-6 text-foreground/80">Profit (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(10, 15, 30, 0.9)', borderColor: 'rgba(0, 240, 255, 0.2)', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#00f0ff', fontWeight: 'bold' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Profit']}
            />
            <Area type="monotone" dataKey="profit" stroke="#00f0ff" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
