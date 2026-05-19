"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

type ChartData = {
  name: string;
  sales: number;
};

export function SalesChart({ data }: { data: ChartData[] }) {
  // If no data provided, show a placeholder empty state array
  const displayData = data && data.length > 0 ? data : [
    { name: "No Data", sales: 0 }
  ];

  return (
    <div className="w-full h-full min-h-[300px]">
      <div className="mb-6">
        <h3 className="text-lg font-bold">Monthly Revenue</h3>
        <p className="text-sm text-foreground/60">Revenue generated over the past year</p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--foreground)', opacity: 0.5, fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--foreground)', opacity: 0.5, fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              cursor={{ fill: 'var(--foreground)', opacity: 0.05 }}
              contentStyle={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => [`$${value}`, 'Revenue']}
            />
            <Bar 
              dataKey="sales" 
              fill="#00f0ff" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
