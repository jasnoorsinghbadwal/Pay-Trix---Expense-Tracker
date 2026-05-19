import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, Building2, CreditCard, Plus, Edit2, Trash2, X, Check, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { CATEGORIES } from '../utils/constants';

export function AccountsPage() {
  const { state, dispatch } = useFinance();
  const currency = state.settings.currency;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedInsightsAccount, setSelectedInsightsAccount] = useState(null);

  // Handle background scroll lock
  React.useEffect(() => {
    if (isModalOpen || selectedInsightsAccount) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, selectedInsightsAccount]);

  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [initialBalance, setInitialBalance] = useState('');

  const openModal = (account = null) => {
    if (account) {
      setEditData(account);
      setName(account.name);
      setType(account.type);
      setInitialBalance(account.initialBalance.toString());
    } else {
      setEditData(null);
      setName('');
      setType('bank');
      setInitialBalance('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim() || initialBalance === '') return;

    const account = {
      id: editData ? editData.id : Date.now().toString(),
      name: name.trim(),
      type,
      initialBalance: parseFloat(initialBalance)
    };

    if (editData) {
      dispatch({ type: 'EDIT_ACCOUNT', payload: account });
      toast.success('Account updated');
    } else {
      dispatch({ type: 'ADD_ACCOUNT', payload: account });
      toast.success('Account created');
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this account?')) {
      dispatch({ type: 'DELETE_ACCOUNT', payload: id });
      toast.success('Account deleted');
    }
  };

  const getAccountBalance = (accountId) => {
    const account = state.accounts.find(a => a.id === accountId);
    if (!account) return 0;
    
    let balance = account.initialBalance;
    state.transactions.forEach(t => {
      if (t.accountId === accountId) {
        if (t.type === 'income') balance += t.amount;
        else balance -= t.amount;
      }
    });
    return balance;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bank': return <Building2 size={24} className="text-blue-500" />;
      case 'cash': return <Wallet size={24} className="text-emerald-500" />;
      case 'credit': return <CreditCard size={24} className="text-purple-500" />;
      default: return <Wallet size={24} className="text-gray-500" />;
    }
  };

  const totalBalance = (state.accounts || []).reduce((sum, a) => sum + getAccountBalance(a.id), 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full pb-4">
      <div className="glass p-5 md:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-1 text-gray-900 dark:text-white">Your Accounts & Wallets</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Manage your funding sources</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="w-full sm:w-auto px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
        >
          <Plus size={16} /> Add Account
        </button>
      </div>

      {(state.accounts || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 md:h-64 text-gray-500 glass rounded-2xl p-6 text-center">
           <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
             <Wallet size={24} className="text-gray-400" />
           </div>
           <p className="text-base md:text-lg text-gray-900 dark:text-white font-medium">No accounts yet</p>
           <p className="text-xs md:text-sm mt-1 text-gray-500 dark:text-gray-400">Add a bank account or cash wallet to start tracking balances.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {state.accounts.map(account => {
            const currentBalance = getAccountBalance(account.id);
            return (
              <div key={account.id} className="glass p-5 md:p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300 relative group overflow-hidden">
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => openModal(account)} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(account.id)} className="p-2 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-charcoal-800 flex items-center justify-center shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5">
                    {getTypeIcon(account.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg">{account.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{account.type}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-charcoal-900/50 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Balance</p>
                   <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white">
                     {currency}{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </p>
                </div>

                <button
                  onClick={() => setSelectedInsightsAccount(account)}
                  className="w-full mt-4 py-2.5 bg-gold-500/10 hover:bg-gold-500/20 text-gold-600 dark:text-gold-400 font-bold rounded-xl text-xs transition-all active:scale-98 flex items-center justify-center gap-1.5 border border-gold-500/10"
                >
                  <TrendingUp size={14} /> View Wallet Insights
                </button>
              </div>
            );
          })}
          
          <div className="glass p-5 md:p-6 rounded-2xl border-dashed border-2 border-gray-300 dark:border-white/10 bg-transparent flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors" onClick={() => openModal()}>
            <div className="w-12 h-12 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center mb-3">
              <Plus size={24} />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">Add New Account</p>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 dark:bg-navy-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeModal}></div>
          <div className="relative w-full max-w-md glass rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 fade-in duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{editData ? 'Edit Account' : 'New Account'}</h3>
                <button onClick={closeModal} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><X size={20} /></button>
             </div>
             
             <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Account Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chase Checking" className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 focus:border-gold-500/50 outline-none text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Account Type</label>
                  <div className="flex gap-2">
                    {['bank', 'cash', 'credit'].map(t => (
                      <button key={t} type="button" onClick={() => setType(t)} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors capitalize ${type === t ? 'border-gold-500 bg-gold-500/10 text-gold-600 dark:text-gold-400' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Initial Balance ({currency})</label>
                  <input type="number" step="0.01" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} placeholder="0.00" className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 focus:border-gold-500/50 outline-none font-mono text-gray-900 dark:text-white" required />
                </div>
                <button type="submit" className="w-full py-3.5 mt-4 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl shadow-lg flex justify-center items-center gap-2">
                  <Check size={18} strokeWidth={3} /> Save Account
                </button>
             </form>
          </div>
        </div>
      )}

      {selectedInsightsAccount && (() => {
        const acc = selectedInsightsAccount;
        const currentBalance = getAccountBalance(acc.id);
        const walletTransactions = state.transactions.filter(t => t.accountId === acc.id);
        
        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryTotals = {};
        
        walletTransactions.forEach(t => {
          if (t.type === 'income') {
            totalIncome += t.amount;
          } else {
            totalExpenses += t.amount;
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
          }
        });

        // Sorted Categories
        const sortedCategories = Object.keys(categoryTotals).map(catId => {
          const cat = CATEGORIES.find(c => c.id === catId);
          const label = cat ? cat.label : 'Others';
          const color = cat ? cat.color : '#8395a7';

          return {
            id: catId,
            label,
            color,
            amount: categoryTotals[catId],
            pct: totalExpenses > 0 ? Math.round((categoryTotals[catId] / totalExpenses) * 100) : 0
          };
        }).sort((a, b) => b.amount - a.amount);

        const recentWalletTxns = [...walletTransactions]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/55 dark:bg-navy-950/85 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedInsightsAccount(null)}></div>
            <div className="relative w-full max-w-xl glass rounded-3xl p-5 md:p-6 shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 fade-in duration-300 max-h-[72vh] md:max-h-[80vh] flex flex-col">
               
               {/* Modal Header */}
               <div className="flex justify-between items-center mb-5 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center shrink-0">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{acc.name} Insights</h3>
                      <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 capitalize">{acc.type} Wallet Analytics</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedInsightsAccount(null)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"><X size={20} /></button>
               </div>

               {/* Scrollable Content */}
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 md:pr-2 space-y-6">
                 {/* Balance Metrics Grid */}
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-charcoal-900/50 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 col-span-2 md:col-span-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Balance</p>
                    <p className="font-mono text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {currency}{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/10">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Total Incomes</p>
                    <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <ArrowUpRight size={14} />
                      {currency}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-rose-500/5 dark:bg-rose-500/10 p-3.5 rounded-2xl border border-rose-500/10">
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Total Expenses</p>
                    <p className="font-mono text-base font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <ArrowDownRight size={14} />
                      {currency}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
               </div>

               {/* Spending Breakdown */}
               <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Where Spent (Category Breakdown)</h4>
                  {sortedCategories.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-xs bg-gray-50 dark:bg-charcoal-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-white/5">
                      No expense transactions recorded from this wallet yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedCategories.map(cat => (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                              {cat.label}
                            </span>
                            <span className="font-mono font-semibold text-gray-900 dark:text-white">
                              {currency}{cat.amount.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">({cat.pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-charcoal-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: cat.color, width: `${cat.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               {/* Recent Transactions List */}
               <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Recent Transactions ({acc.name})</h4>
                  {recentWalletTxns.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-xs bg-gray-50 dark:bg-charcoal-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-white/5">
                      No transactions recorded.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recentWalletTxns.map(t => {
                        let catLabel = t.category;
                        let catColor = '#6b7280';
                        if (t.category === 'food') { catLabel = 'Food & Dining'; catColor = '#FF9F43'; }
                        else if (t.category === 'shopping') { catLabel = 'Shopping'; catColor = '#48DBFB'; }
                        else if (t.category === 'bills') { catLabel = 'Bills & Utilities'; catColor = '#FF6B6B'; }
                        else if (t.category === 'entertainment') { catLabel = 'Entertainment'; catColor = '#1DD1A1'; }
                        else if (t.category === 'transport') { catLabel = 'Travel & Commute'; catColor = '#5f27cd'; }
                        else if (t.category === 'health') { catLabel = 'Medical & Fitness'; catColor = '#ff9ff3'; }
                        else if (t.category === 'education') { catLabel = 'Education'; catColor = '#00d2d3'; }
                        else if (t.category === 'other') { catLabel = 'Others'; catColor = '#8395a7'; }
                        else if (t.category === 'income') { catLabel = 'Salary & Income'; catColor = '#10b981'; }

                        return (
                          <div key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-xs">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{t.title}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                <span>{t.date}</span>
                                <span>·</span>
                                <span className="capitalize font-semibold" style={{ color: catColor }}>{catLabel}</span>
                              </div>
                            </div>
                            <span className={`font-mono font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                              {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>

               </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
