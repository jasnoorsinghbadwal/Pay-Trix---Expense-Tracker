import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Sparkles, Target, Receipt, Shield } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import { isTransactionInPeriod, getPeriodDates, parseLocalDate } from '../utils/dateFilters';
import { Forecaster } from './Forecaster';

export function Analytics() {
  const { state } = useFinance();
  const currency = state.settings.currency;
  const isDark = state.settings.theme === 'dark';
  const [activeSubTab, setActiveSubTab] = useState('stats');
  const [breakdownType, setBreakdownType] = useState('category'); // 'category' or 'type'

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
    let totalSpent = 0;

    if (breakdownType === 'category') {
      const totals = {};
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
          color: cat ? cat.color : '#6B7280',
          icon: cat ? cat.icon : Sparkles
        };
      }).sort((a, b) => b.value - a.value);

      return { data, totalSpent };
    } else {
      // breakdownType === 'type'
      let subTotal = 0;
      let savingsTotal = 0;
      let budgetedTotal = 0;
      let oneoffTotal = 0;

      const activeBudgetedCategories = new Set(
        (state.budgets || []).filter(b => !b.dismissed).map(b => b.category)
      );

      state.transactions.forEach(t => {
        if (t.type === 'expense') {
          const isInPeriod = isTransactionInPeriod(t.date, state.settings.selectedPeriod, state.settings.customStartDate, state.settings.customEndDate);
          if (isInPeriod) {
            totalSpent += t.amount;

            // 1. Subscription check
            if (t.subscriptionId || t.title.includes('(Recurring)')) {
              subTotal += t.amount;
            }
            // 2. Savings check
            else if (t.goalId || t.title.startsWith('Goal Allocation:') || t.title.startsWith('Goal Contribution:')) {
              savingsTotal += t.amount;
            }
            // 3. Budgeted check
            else if (activeBudgetedCategories.has(t.category)) {
              budgetedTotal += t.amount;
            }
            // 4. One-off check
            else {
              oneoffTotal += t.amount;
            }
          }
        }
      });

      const data = [
        { name: 'Subscriptions & Bills', value: subTotal, color: '#06B6D4', icon: Receipt },
        { name: 'Savings Goals', value: savingsTotal, color: '#10B981', icon: Target },
        { name: 'Budgeted Expenses', value: budgetedTotal, color: '#8B5CF6', icon: Shield },
        { name: 'One-Off Expenses', value: oneoffTotal, color: '#F5A623', icon: Sparkles }
      ]
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);

      return { data, totalSpent };
    }
  }, [state.transactions, state.budgets, state.settings.selectedPeriod, state.settings.customStartDate, state.settings.customEndDate, breakdownType]);

  // Check if we are on a mobile/touch viewport dynamically for tooltip activation
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-4 h-full">
      {/* Sub-tab segmented control for mobile screens & unified analytics view */}
      <div className="flex bg-gray-100 dark:bg-charcoal-800 p-1 rounded-2xl max-w-md border border-gray-200 dark:border-white/5 shadow-sm">
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-xl transition-all ${activeSubTab === 'stats' ? 'bg-gold-500 text-navy-900 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
        >
          📈 Analytics & Reports
        </button>
        <button
          onClick={() => setActiveSubTab('forecast')}
          className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-xl transition-all ${activeSubTab === 'forecast' ? 'bg-gold-500 text-navy-900 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
        >
          🔮 Cash Forecaster
        </button>
      </div>

      {activeSubTab === 'stats' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in fade-in duration-300">
          
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
            <div className="flex flex-row items-center justify-between gap-3 mb-4 md:mb-6 shrink-0 min-w-0">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold tracking-wide text-gray-900 dark:text-white truncate">Expense Breakdown</h3>
              
              <div className="flex bg-gray-100 dark:bg-charcoal-800 p-0.5 rounded-lg border border-gray-200 dark:border-white/5 shadow-inner flex-shrink-0">
                <button
                  onClick={() => setBreakdownType('category')}
                  className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${breakdownType === 'category' ? 'bg-white dark:bg-charcoal-700 text-gold-500 dark:text-gold-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  📁 Categories
                </button>
                <button
                  onClick={() => setBreakdownType('type')}
                  className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${breakdownType === 'type' ? 'bg-white dark:bg-charcoal-700 text-gold-500 dark:text-gold-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  ⚡ Types
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              {pieData.data.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <p className="text-sm md:text-base">No expenses in this period</p>
                </div>
              ) : (
                <div className="flex flex-row items-center gap-4 h-full min-h-0">
                  {/* Donut Chart Container */}
                  <div className="relative w-[38%] sm:w-[45%] h-[120px] sm:h-[220px] flex-shrink-0 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData.data}
                          cx="50%"
                          cy="50%"
                          innerRadius={isMobile ? 35 : 55}
                          outerRadius={isMobile ? 48 : 75}
                          paddingAngle={0}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text for Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">Spent</span>
                       <span className="text-xs sm:text-lg font-mono font-bold text-gray-900 dark:text-white mt-0.5">{currency}{pieData.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  {/* Detailed Categories List */}
                  <div className="flex-1 w-full overflow-y-auto max-h-[220px] pr-1 space-y-2.5 sm:space-y-3 custom-scrollbar">
                    {pieData.data.map((entry, index) => {
                      const pct = pieData.totalSpent > 0 ? ((entry.value / pieData.totalSpent) * 100).toFixed(1) : 0;
                      const IconComponent = entry.icon || Sparkles;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center text-[11px] sm:text-xs">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700 dark:text-gray-300 font-medium min-w-0">
                              <span className="p-1 rounded bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center flex-shrink-0" style={{ color: entry.color }}>
                                <IconComponent size={12} />
                              </span>
                              <span className="truncate max-w-[80px] sm:max-w-[120px] text-xs sm:text-sm">{entry.name}</span>
                              <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-mono font-bold flex-shrink-0">{pct}%</span>
                            </div>
                            <span className="font-mono font-bold text-gray-900 dark:text-white flex-shrink-0 text-xs">{currency}{entry.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                          {/* Visual Progress Bar */}
                          <div className="h-1 sm:h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: entry.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <Forecaster />
        </div>
      )}
    </div>
  );
}

export default Analytics;
