import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Target, AlertCircle, Plus, X, Building2 } from 'lucide-react';
import { CATEGORIES, getCategory } from '../utils/constants';
import toast from 'react-hot-toast';

export function BudgetPlanner() {
  const { state, dispatch } = useFinance();
  const currency = state.settings.currency;
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  const budgetsWithSpending = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const spending = {};
    state.transactions.forEach(t => {
      if (t.type === 'expense') {
        const tDate = new Date(t.date);
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
          spending[t.category] = (spending[t.category] || 0) + t.amount;
        }
      }
    });

    return Object.keys(state.budgets).map(catId => {
      const catInfo = getCategory(catId);
      const budgetObj = state.budgets[catId];
      // handle fallback for older state where budget was just a number
      const amount = typeof budgetObj === 'number' ? budgetObj : budgetObj.amount;
      const linkedAccountId = typeof budgetObj === 'object' ? budgetObj.accountId : null;
      const linkedAccount = state.accounts?.find(a => a.id === linkedAccountId);

      return {
        id: catId,
        label: catInfo.label,
        icon: catInfo.icon,
        color: catInfo.color,
        budget: amount,
        spent: spending[catId] || 0,
        linkedAccount
      };
    });
  }, [state.budgets, state.transactions, state.accounts]);

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) return;
    
    dispatch({ 
      type: 'SET_BUDGET', 
      payload: { 
        category: selectedCat, 
        amount: parseFloat(budgetAmount),
        accountId: selectedAccount || (state.accounts?.[0]?.id || '')
      } 
    });
    
    toast.success('Budget saved');
    setIsAdding(false);
    setBudgetAmount('');
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
          <h2 className="text-lg md:text-xl font-semibold mb-1 text-gray-900 dark:text-white">Monthly Budgets</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Track your spending limits across categories</p>
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
            <h3 className="font-semibold text-gray-900 dark:text-white">Set New Budget Limit</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"><X size={18} /></button>
          </div>
          <form onSubmit={handleSaveBudget} className="flex flex-col md:flex-row gap-4 md:items-end">
             <div className="flex-1">
               <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Category</label>
               <select 
                 value={selectedCat} 
                 onChange={(e) => setSelectedCat(e.target.value)}
                 className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 focus:border-gold-500/50 outline-none text-sm appearance-none text-gray-900 dark:text-white"
               >
                 <option value="" disabled>Select a category...</option>
                 {CATEGORIES.filter(c => c.id !== 'income').map(c => (
                   <option key={c.id} value={c.id}>{c.label}</option>
                 ))}
               </select>
             </div>
             <div className="flex-1">
               <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Funding Account</label>
               <select 
                 value={selectedAccount} 
                 onChange={(e) => setSelectedAccount(e.target.value)}
                 className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 focus:border-gold-500/50 outline-none text-sm appearance-none text-gray-900 dark:text-white font-medium"
               >
                 {state.accounts.map(a => (
                   <option key={a.id} value={a.id}>{a.name}</option>
                 ))}
               </select>
             </div>
             <div className="flex-1">
               <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Monthly Limit ({currency})</label>
               <input 
                 type="number"
                 step="0.01"
                 min="0"
                 value={budgetAmount}
                 onChange={(e) => setBudgetAmount(e.target.value)}
                 placeholder="0.00"
                 className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 focus:border-gold-500/50 outline-none text-sm font-mono text-gray-900 dark:text-white"
                 required
               />
             </div>
             <button type="submit" className="w-full md:w-auto py-3 px-6 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-colors shrink-0">
                Save
             </button>
          </form>
        </div>
      )}

      {budgetsWithSpending.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 md:h-64 text-gray-500 glass rounded-2xl p-6 text-center">
           <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
             <Target size={24} className="text-gray-400" />
           </div>
           <p className="text-base md:text-lg text-gray-900 dark:text-white font-medium">No budgets set</p>
           <p className="text-xs md:text-sm mt-1 text-gray-500 dark:text-gray-400">Click "Add Budget" to start tracking limits.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {budgetsWithSpending.map(cat => {
            const percentage = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
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
            const Icon = cat.icon;

            return (
              <div key={cat.id} className="glass p-5 md:p-6 rounded-2xl hover:border-gray-300 dark:hover:border-white/20 transition-colors group relative">
                <button 
                  onClick={() => { 
                    setSelectedCat(cat.id); 
                    setBudgetAmount(cat.budget.toString()); 
                    if(cat.linkedAccount) setSelectedAccount(cat.linkedAccount.id);
                    setIsAdding(true); 
                  }}
                  className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100"
                >
                  <Target size={16} />
                </button>
                <div className="flex justify-between items-center mb-4 pr-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-charcoal-800 flex items-center justify-center shadow-sm dark:shadow-none" style={{ color: cat.color }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{cat.label}</h3>
                        {cat.linkedAccount && (
                          <span className="flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                            <Building2 size={10} /> {cat.linkedAccount.name}
                          </span>
                        )}
                      </div>
                      {isOverBudget && (
                        <span className="flex items-center gap-1 text-[10px] md:text-xs text-rose-600 dark:text-rose-400 mt-0.5 md:mt-1 font-medium">
                          <AlertCircle size={10} className="md:w-3 md:h-3" /> Over budget
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-base md:text-lg font-bold text-gray-900 dark:text-white">{currency}{cat.spent.toLocaleString(undefined, { minimumFractionDigits: 0 })}</div>
                    <div className="text-[10px] md:text-xs text-gray-500">of {currency}{cat.budget.toLocaleString()}</div>
                  </div>
                </div>

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
                     {isOverBudget ? `Exceeded by ${currency}${(cat.spent - cat.budget).toLocaleString()}` : `${currency}${(cat.budget - cat.spent).toLocaleString()} left`}
                   </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
