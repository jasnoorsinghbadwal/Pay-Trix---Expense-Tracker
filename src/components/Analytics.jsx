import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CATEGORIES } from '../utils/constants';
import { isTransactionInPeriod, getPeriodDates, parseLocalDate } from '../utils/dateFilters';

export function Analytics() {
  const { state } = useFinance();
  const currency = state.settings.currency;
  const isDark = state.settings.theme === 'dark';

  const periodLabel = useMemo(() => {
    const { selectedPeriod, customStartDate, customEndDate } = state.settings;
    return getPeriodDates(selectedPeriod, customStartDate, customEndDate).label;
  }, [state.settings.selectedPeriod, state.settings.customStartDate, state.settings.customEndDate]);

  // Dynamic Income vs Expenses Bar Chart depending on the selected Period!
  const barData = useMemo(() => {
    const { selectedPeriod, customStartDate, customEndDate } = state.settings;
    const { start, end } = getPeriodDates(selectedPeriod, customStartDate, customEndDate);
    const data = [];
    
    // Filter transactions in the active period
    const transactionsInPeriod = state.transactions.filter(t => 
      isTransactionInPeriod(t.date, selectedPeriod, customStartDate, customEndDate)
    );

    if (selectedPeriod === 'this-week') {
      // Daily breakdown (7 days Mon-Sun)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        let income = 0;
        let expense = 0;
        transactionsInPeriod.forEach(t => {
          if (t.date === dateStr) {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
          }
        });
        
        data.push({ name: days[i], income, expense });
      }
    } else if (selectedPeriod === 'this-month' || selectedPeriod === 'last-month') {
      // Weekly breakdown of that specific month (4 parts: 1-7, 8-14, 15-21, 22-31)
      const weekRanges = [
        { label: '1-7', startDay: 1, endDay: 7 },
        { label: '8-14', startDay: 8, endDay: 14 },
        { label: '15-21', startDay: 15, endDay: 21 },
        { label: '22+', startDay: 22, endDay: 31 }
      ];

      weekRanges.forEach(w => {
        let income = 0;
        let expense = 0;
        
        transactionsInPeriod.forEach(t => {
          const tDate = parseLocalDate(t.date);
          const day = tDate.getDate();
          if (day >= w.startDay && day <= w.endDay) {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
          }
        });

        data.push({ name: `Days ${w.label}`, income, expense });
      });
    } else {
      // Default: Last 6 calendar months (All-Time / Custom)
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
        const currentMonth = d.getMonth();
        const currentYear = d.getFullYear();

        let income = 0;
        let expense = 0;

        state.transactions.forEach(t => {
          const tDate = parseLocalDate(t.date);
          if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
          }
        });

        data.push({ name: monthStr, income, expense });
      }
    }
    return data;
  }, [state.transactions, state.settings.selectedPeriod, state.settings.customStartDate, state.settings.customEndDate]);

  const barChartTitle = useMemo(() => {
    const { selectedPeriod } = state.settings;
    if (selectedPeriod === 'this-week') return 'Income vs Expenses (This Week)';
    if (selectedPeriod === 'this-month' || selectedPeriod === 'last-month') return `Income vs Expenses (${periodLabel})`;
    return 'Income vs Expenses (6-Month Trend)';
  }, [state.settings.selectedPeriod, periodLabel]);

  const pieData = useMemo(() => {
    const totals = {};
    let totalSpent = 0;

    state.transactions.forEach(t => {
      if (t.type === 'expense') {
        const isInPeriod = isTransactionInPeriod(t.date, state.settings.selectedPeriod, state.settings.customStartDate, state.settings.customEndDate);
        if (isInPeriod) {
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
  }, [state.transactions, state.settings.selectedPeriod, state.settings.customStartDate, state.settings.customEndDate]);

  // Check if we are on a mobile/touch viewport dynamically for tooltip activation
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Income vs Expenses Bar Chart */}
        <div className="glass p-5 md:p-6 rounded-2xl h-[350px] md:h-[400px] flex flex-col relative">
          <h3 className="text-base md:text-lg font-semibold tracking-wide mb-4 md:mb-6 text-gray-900 dark:text-white">{barChartTitle}</h3>
          <div className="flex-1 w-full relative">
            {state.transactions.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <p className="text-sm md:text-base">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke={isDark ? "#6B7280" : "#9CA3AF"} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDark ? "#6B7280" : "#9CA3AF"} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(1)+'k' : value}`} />
                  <Tooltip 
                    trigger={isMobile ? "click" : "hover"}
                    wrapperStyle={{ pointerEvents: 'none' }}
                    contentStyle={{ backgroundColor: isDark ? '#121212' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: isDark ? '#fff' : '#000' }}
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                    formatter={(value) => [`${currency}${value.toLocaleString()}`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" name="Expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {isMobile && state.transactions.length > 0 && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">Tap bars to view values • Tap outside to clear</p>
          )}
        </div>

        {/* Expenses Breakdown Pie Chart */}
        <div className="glass p-5 md:p-6 rounded-2xl h-[350px] md:h-[400px] flex flex-col relative">
          <h3 className="text-base md:text-lg font-semibold tracking-wide mb-4 md:mb-6 text-gray-900 dark:text-white truncate">Expense Breakdown ({periodLabel})</h3>
          <div className="flex-1 w-full relative">
            {pieData.data.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <p className="text-sm md:text-base">No expenses in this period</p>
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
                       trigger={isMobile ? "click" : "hover"}
                       wrapperStyle={{ pointerEvents: 'none' }}
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
          {isMobile && pieData.data.length > 0 && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">Tap segments to view values</p>
          )}
        </div>

      </div>
    </div>
  );
}

export default Analytics;
