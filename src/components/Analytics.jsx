import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CATEGORIES } from '../utils/constants';

export function Analytics() {
  const { state } = useFinance();
  const currency = state.settings.currency;
  const isDark = state.settings.theme === 'dark';

  const barData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      const currentMonth = d.getMonth();
      const currentYear = d.getFullYear();

      let income = 0;
      let expense = 0;

      state.transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
          if (t.type === 'income') income += t.amount;
          else expense += t.amount;
        }
      });

      data.push({ name: monthStr, income, expense });
    }
    return data;
  }, [state.transactions]);

  const pieData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totals = {};
    let totalSpent = 0;

    state.transactions.forEach(t => {
      if (t.type === 'expense') {
        const tDate = new Date(t.date);
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
          totals[t.category] = (totals[t.category] || 0) + t.amount;
          totalSpent += t.amount;
        }
      }
    });

    const data = Object.keys(totals).map(catId => {
      const cat = CATEGORIES.find(c => c.id === catId);
      return {
        name: cat ? cat.label : 'Other',
        value: totals[catId],
        color: cat ? cat.color : '#6B7280'
      };
    }).sort((a, b) => b.value - a.value);

    return { data, totalSpent };
  }, [state.transactions]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Income vs Expenses Bar Chart */}
        <div className="glass p-5 md:p-6 rounded-2xl h-[350px] md:h-[400px] flex flex-col relative">
          <h3 className="text-base md:text-lg font-semibold tracking-wide mb-4 md:mb-6 text-gray-900 dark:text-white">Income vs Expenses (6 Months)</h3>
          <div className="flex-1 w-full relative">
            {state.transactions.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <p className="text-sm md:text-base">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke={isDark ? "#6B7280" : "#9CA3AF"} fontSize={10} md:fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDark ? "#6B7280" : "#9CA3AF"} fontSize={10} md:fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(1)+'k' : value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#121212' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: isDark ? '#fff' : '#000' }}
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                    formatter={(value) => [`${currency}${value.toLocaleString()}`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={isDark ? 20 : 16} />
                  <Bar dataKey="expense" name="Expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={isDark ? 20 : 16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses Breakdown Pie Chart */}
        <div className="glass p-5 md:p-6 rounded-2xl h-[350px] md:h-[400px] flex flex-col relative">
          <h3 className="text-base md:text-lg font-semibold tracking-wide mb-4 md:mb-6 text-gray-900 dark:text-white">Expense Breakdown (This Month)</h3>
          <div className="flex-1 w-full relative">
            {pieData.data.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <p className="text-sm md:text-base">No expenses this month</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: isDark ? '#121212' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: isDark ? '#fff' : '#000' }}
                       itemStyle={{ color: isDark ? '#fff' : '#000', fontFamily: 'JetBrains Mono' }}
                       formatter={(value) => [`${currency}${value.toLocaleString()}`, '']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text for Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                   <span className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400">Total Spent</span>
                   <span className="text-lg md:text-2xl font-mono font-bold text-gray-900 dark:text-white">{currency}{pieData.totalSpent.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
