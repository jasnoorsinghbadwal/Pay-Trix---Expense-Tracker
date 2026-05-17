import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Target, AlertCircle, Plus, X, Building2, Trash2, Calendar, Award } from 'lucide-react';
import { CATEGORIES, getCategory } from '../utils/constants';
import { getBudgetStatus } from '../utils/dateFilters';
import toast from 'react-hot-toast';

export function BudgetPlanner() {
  const { state, dispatch } = useFinance();
  const currency = state.settings.currency;
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const budgetsWithSpending = useMemo(() => {
    return (state.budgets || [])
      .filter(b => !b.dismissed)
      .map(b => {
        const catInfo = getCategory(b.category);
        const linkedAccount = state.accounts?.find(a => a.id === b.accountId);
        const status = getBudgetStatus(b, state.transactions);

        return {
          ...b,
          label: catInfo.label,
          icon: catInfo.icon,
          color: catInfo.color,
          linkedAccount,
          ...status
        };
      });
  }, [state.budgets, state.transactions, state.accounts]);

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) return;
    if (!selectedCat) {
      toast.error('Please select a category');
      return;
    }
    if (budgetPeriod === 'custom' && (!startDate || !endDate)) {
      toast.error('Please select start and end dates');
      return;
    }
    
    const newBudget = {
      id: `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: selectedCat,
      amount: parseFloat(budgetAmount),
      accountId: selectedAccount || (state.accounts?.[0]?.id || ''),
      period: budgetPeriod,
      startDate: budgetPeriod !== 'ongoing' ? startDate : '',
      endDate: budgetPeriod === 'custom' ? endDate : '',
      dismissed: false
    };

    dispatch({ 
      type: 'ADD_BUDGET', 
      payload: newBudget
    });
    
    toast.success('Budget saved');
    setIsAdding(false);
    setBudgetAmount('');
    setSelectedCat('');
  };

  const openAddForm = () => {
    if (state.accounts?.length === 0) {
      toast.error('Please create an Account first!');
      return;
    }
    setSelectedAccount(state.accounts[0].id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
      <div className="glass p-5 md:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-1 text-gray-900 dark:text-white">Budgets & Limiters</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Track your spending limits dynamically with flexible periods</p>
        </div>
        {!isAdding && (
          <button 
            onClick={openAddForm}
            className="w-full sm:w-auto px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
          >
            <Plus size={16} /> Add Budget
          </button>
        )}
      </div>

      {isAdding && (
        <div className="glass p-5 md:p-6 rounded-2xl border border-gold-500/30 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Set Budget Limit</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"><X size={18} /></button>
          </div>
          <form onSubmit={handleSaveBudget} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Category</label>
                 <select 
                   value={selectedCat} 
                   onChange={(e) => setSelectedCat(e.target.value)}
                   className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 focus:border-gold-500/50 outline-none text-sm text-gray-900 dark:text-white appearance-none"
                   required
                 >
                   <option value="" disabled>Select category...</option>
                   {CATEGORIES.filter(c => c.id !== 'income').map(c => (
                     <option key={c.id} value={c.id}>{c.label}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Funding Account</label>
                 <select 
                   value={selectedAccount} 
                   onChange={(e) => setSelectedAccount(e.target.value)}
                   className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 focus:border-gold-500/50 outline-none text-sm text-gray-900 dark:text-white appearance-none font-medium"
                 >
                   {state.accounts.map(a => (
                     <option key={a.id} value={a.id}>{a.name}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Budget Period</label>
                 <select 
                   value={budgetPeriod} 
                   onChange={(e) => setBudgetPeriod(e.target.value)}
                   className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 focus:border-gold-500/50 outline-none text-sm text-gray-900 dark:text-white appearance-none font-medium"
                 >
                   <option value="monthly">Calendar Month</option>
                   <option value="weekly">Calendar Week</option>
                   <option value="custom">Custom Date Range</option>
                   <option value="ongoing">Ongoing (No Limit)</option>
                 </select>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
               {budgetPeriod !== 'ongoing' && (
                 <div>
                   <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Start Date</label>
                   <input 
                     type="date"
                     value={startDate}
                     onChange={(e) => setStartDate(e.target.value)}
                     className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 focus:border-gold-500/50 outline-none text-sm text-gray-900 dark:text-white dark:color-scheme-dark"
                     required
                   />
                 </div>
               )}

               {budgetPeriod === 'custom' && (
                 <div>
                   <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">End Date</label>
                   <input 
                     type="date"
                     value={endDate}
                     onChange={(e) => setEndDate(e.target.value)}
                     className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 focus:border-gold-500/50 outline-none text-sm text-gray-900 dark:text-white dark:color-scheme-dark"
                     required
                   />
                 </div>
               )}

               <div>
                 <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Limit ({currency})</label>
                 <input 
                   type="number"
                   step="0.01"
                   min="0.1"
                   value={budgetAmount}
                   onChange={(e) => setBudgetAmount(e.target.value)}
                   placeholder="0.00"
                   className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 focus:border-gold-500/50 outline-none text-sm font-mono text-gray-900 dark:text-white"
                   required
                 />
               </div>
             </div>

             <div className="flex justify-end gap-2 pt-2">
               <button 
                 type="button" 
                 onClick={() => setIsAdding(false)} 
                 className="px-5 py-2.5 bg-gray-100 dark:bg-charcoal-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors text-sm hover:bg-gray-200 dark:hover:bg-charcoal-900"
               >
                 Cancel
               </button>
               <button 
                 type="submit" 
                 className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-colors text-sm"
               >
                 Save Budget
               </button>
             </div>
          </form>
        </div>
      )}

      {budgetsWithSpending.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 md:h-64 text-gray-500 glass rounded-2xl p-6 text-center">
           <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
             <Target size={24} className="text-gray-400" />
           </div>
           <p className="text-base md:text-lg text-gray-900 dark:text-white font-medium">No active budgets set</p>
           <p className="text-xs md:text-sm mt-1 text-gray-500 dark:text-gray-400">Click "Add Budget" to start tracking limits dynamically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {budgetsWithSpending.map(cat => {
            const Icon = cat.icon;

            // Render special Expiry Notification Card if ended
            if (cat.hasEnded) {
              return (
                <div key={cat.id} className="glass p-5 md:p-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/2 transition-colors relative flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-charcoal-800 flex items-center justify-center shadow-sm dark:shadow-none shrink-0" style={{ color: cat.color }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{cat.label} Budget</h3>
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium mt-0.5 capitalize">
                          <Calendar size={10} /> ended ({cat.period})
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this budget completely?')) {
                          dispatch({ type: 'DELETE_BUDGET', payload: cat.id });
                          toast.success('Budget deleted');
                        }
                      }}
                      className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="my-4 p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200/50 dark:border-white/5">
                    {cat.saved >= 0 ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Award size={14} /> Saved Successfully!
                        </p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                          Awesome job! You saved <span className="font-semibold">{currency}{cat.saved.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> of your limit.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle size={14} /> Over Budget!
                        </p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                          Limit exceeded by <span className="font-semibold">{currency}{Math.abs(cat.saved).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> (spent {currency}{cat.spent.toLocaleString()} of {currency}{cat.amount}).
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      dispatch({ type: 'DISMISS_BUDGET', payload: cat.id });
                      toast.success('Budget result dismissed');
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-navy-900 font-bold rounded-xl text-xs transition-colors shadow-md"
                  >
                    Okay, Dismiss
                  </button>
                </div>
              );
            }

            // Normal active budget card
            const percentage = cat.percentage;
            let colorClass = 'bg-emerald-500';
            let textColor = 'text-emerald-600 dark:text-emerald-400';
            if (percentage >= 70 && percentage <= 90) {
               colorClass = 'bg-amber-500';
               textColor = 'text-amber-600 dark:text-amber-400';
            } else if (percentage > 90) {
               colorClass = 'bg-rose-500';
               textColor = 'text-rose-600 dark:text-rose-400';
            }

            const isOverBudget = percentage > 100;

            return (
              <div key={cat.id} className="glass p-5 md:p-6 rounded-2xl hover:border-gray-300 dark:hover:border-white/20 transition-colors group relative flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-charcoal-800 flex items-center justify-center shadow-sm dark:shadow-none shrink-0" style={{ color: cat.color }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{cat.label}</h3>
                          {cat.linkedAccount && (
                            <span className="flex items-center gap-1 text-[9px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                              <Building2 size={8} /> {cat.linkedAccount.name}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[9px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 px-1.5 py-0.5 rounded font-medium mt-1 capitalize">
                          <Calendar size={8} /> {cat.period}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this budget completely?')) {
                          dispatch({ type: 'DELETE_BUDGET', payload: cat.id });
                          toast.success('Budget deleted');
                        }
                      }}
                      className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex justify-between items-end mb-3">
                    <div>
                      {isOverBudget && (
                        <span className="flex items-center gap-1 text-[10px] md:text-xs text-rose-600 dark:text-rose-400 font-medium">
                          <AlertCircle size={10} className="md:w-3 md:h-3" /> Limit Exceeded
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-base md:text-lg font-bold text-gray-900 dark:text-white">{currency}{cat.spent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                      <div className="text-[10px] md:text-xs text-gray-500">of {currency}{cat.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="h-2.5 md:h-3 w-full bg-gray-200 dark:bg-charcoal-900 rounded-full overflow-hidden border border-gray-300/50 dark:border-white/5">
                     <div 
                       className={`h-full ${colorClass} transition-all duration-1000 ease-out relative`}
                       style={{ width: `${Math.min(percentage, 100)}%` }}
                     >
                       <div className="absolute inset-0 bg-white/20"></div>
                     </div>
                  </div>
                  <div className="mt-2 md:mt-3 flex justify-between text-[10px] md:text-xs font-medium">
                     <span className="text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}% used</span>
                     <span className={textColor}>
                       {isOverBudget ? `Exceeded by ${currency}${(cat.spent - cat.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `${currency}${(cat.amount - cat.spent).toLocaleString(undefined, { maximumFractionDigits: 0 })} left`}
                     </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
