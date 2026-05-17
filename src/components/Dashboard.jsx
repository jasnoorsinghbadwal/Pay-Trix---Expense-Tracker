import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowUpRight, ArrowDownRight, Wallet, Plus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { getCategory } from '../utils/constants';
import { isTransactionInPeriod, getPeriodDates } from '../utils/dateFilters';

export function Dashboard() {
  const { state } = useFinance();
  const currency = state.settings.currency;
  const isDark = state.settings.theme === 'dark';
  const [timeRange, setTimeRange] = useState(7);

  // Period label
  const periodLabel = useMemo(() => {
    const { selectedPeriod, customStartDate, customEndDate } = state.settings;
    return getPeriodDates(selectedPeriod, customStartDate, customEndDate).label;
  }, [state.settings.selectedPeriod, state.settings.customStartDate, state.settings.customEndDate]);

  // Filter transactions for the selected period
  const periodTransactions = useMemo(() => {
    const { selectedPeriod, customStartDate, customEndDate } = state.settings;
    return state.transactions.filter(t => 
      isTransactionInPeriod(t.date, selectedPeriod, customStartDate, customEndDate)
    );
  }, [state.transactions, state.settings.selectedPeriod, state.settings.customStartDate, state.settings.customEndDate]);

  // Net balance (always global) & Period-based Income/Expenses
  const { netBalance, incomeInPeriod, expensesInPeriod } = useMemo(() => {
    let net = (state.accounts || []).reduce((sum, a) => sum + a.initialBalance, 0);
    let incVal = 0;
    let expVal = 0;

    // Global balance calculation
    state.transactions.forEach(t => {
      if (t.type === 'income') {
        net += t.amount;
      } else {
        net -= t.amount;
      }
    });

    // Period-specific totals
    periodTransactions.forEach(t => {
      if (t.type === 'income') {
        incVal += t.amount;
      } else {
        expVal += t.amount;
      }
    });

    return { netBalance: net, incomeInPeriod: incVal, expensesInPeriod: expVal };
  }, [state.transactions, periodTransactions, state.accounts]);

  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const daySpend = periodTransactions
        .filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short', month: timeRange > 7 ? 'short' : undefined, day: timeRange > 7 ? 'numeric' : undefined }),
        spend: daySpend
      });
    }
    return data;
  }, [periodTransactions, timeRange]);

  const recentTransactions = periodTransactions.slice(0, 5);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="glass p-5 md:p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Net Balance</p>
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gold-500 dark:text-gold-400">
              <Wallet size={20} />
            </div>
          </div>
          <h3 className="text-3xl md:text-4xl font-mono font-bold text-gray-900 dark:text-white tracking-tight">{currency}{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="glass p-5 md:p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Income ({periodLabel})</p>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight">{currency}{incomeInPeriod.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="glass p-5 md:p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">Expenses ({periodLabel})</p>
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-mono font-semibold text-rose-600 dark:text-rose-400 tracking-tight">{currency}{expensesInPeriod.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
         <div className="xl:col-span-2 space-y-6 md:space-y-8">
            <div className="glass p-5 md:p-6 rounded-2xl h-[350px] md:h-[400px] flex flex-col relative overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-semibold tracking-wide text-gray-900 dark:text-white">Spending Trend ({periodLabel})</h3>
                 <select 
                   value={timeRange}
                   onChange={(e) => setTimeRange(Number(e.target.value))}
                   className="bg-gray-100 dark:bg-charcoal-800 border border-gray-200 dark:border-white/10 rounded-lg px-2 md:px-3 py-1.5 text-xs md:text-sm outline-none focus:border-gold-500/50 transition-colors cursor-pointer text-gray-800 dark:text-white"
                 >
                   <option value={7}>Last 7 Days</option>
                   <option value={30}>Last 30 Days</option>
                 </select>
               </div>
               <div className="flex-1 w-full relative">
                 {periodTransactions.length === 0 ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                     <p>No data available in this period</p>
                     <p className="text-xs mt-1">Add transactions to see your trends.</p>
                   </div>
                 ) : (
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData}>
                       <defs>
                         <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#F5A623" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <Tooltip 
                         contentStyle={{ backgroundColor: isDark ? '#121212' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: isDark ? '#fff' : '#000' }}
                         itemStyle={{ color: '#F5A623', fontFamily: 'JetBrains Mono' }}
                         formatter={(value) => [`${currency}${value}`, 'Spent']}
                       />
                       <Area type="monotone" dataKey="spend" stroke="#F5A623" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 )}
               </div>
            </div>
         </div>

         <div className="space-y-6 md:space-y-8">
            <div className="glass p-5 md:p-6 rounded-2xl flex flex-col h-[350px] md:h-[400px]">
               <div className="flex justify-between items-center mb-4 md:mb-6">
                 <h3 className="text-lg font-semibold tracking-wide text-gray-900 dark:text-white">Recent ({periodLabel})</h3>
               </div>
               <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {recentTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
                        <Plus size={20} className="text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white mb-1">No transactions in this period</p>
                      <p className="text-xs">Click the + button below to get started.</p>
                    </div>
                  ) : (
                    recentTransactions.map(t => {
                      const cat = getCategory(t.category);
                      const Icon = cat.icon;
                      return (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                           <div className="flex items-center gap-3 md:gap-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-white dark:bg-charcoal-800 shadow-sm dark:shadow-none" style={{ color: cat.color }}>
                                 <Icon size={18} />
                              </div>
                              <div className="min-w-0">
                                 <p className="font-medium text-gray-900 dark:text-white group-hover:text-gold-500 dark:group-hover:text-gold-400 transition-colors truncate">{t.title}</p>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.date}</p>
                              </div>
                           </div>
                           <span className={`font-mono font-medium shrink-0 ml-2 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                             {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                           </span>
                        </div>
                      );
                    })
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
