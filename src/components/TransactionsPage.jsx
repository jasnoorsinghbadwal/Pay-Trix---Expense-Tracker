import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Search, Trash2, Edit2 } from 'lucide-react';
import { getCategory } from '../utils/constants';
import toast from 'react-hot-toast';
import { TransactionModal } from './TransactionModal';
import { isTransactionInPeriod } from '../utils/dateFilters';

export function TransactionsPage() {
  const { state, dispatch } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editModalData, setEditModalData] = useState(null);
  const currency = state.settings.currency;

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      toast.success('Transaction deleted');
    }
  };

  const filteredTransactions = state.transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesPeriod = isTransactionInPeriod(t.date, state.settings.selectedPeriod, state.settings.customStartDate, state.settings.customEndDate);
    return matchesSearch && matchesType && matchesPeriod;
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:h-full flex flex-col pb-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center glass p-3 md:p-4 rounded-2xl shrink-0">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-2 md:py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>
        <div className="flex items-center w-full sm:w-auto">
          <div className="flex items-center w-full sm:w-auto bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl p-1">
            <button onClick={() => setFilterType('all')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${filterType === 'all' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-none' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>All</button>
            <button onClick={() => setFilterType('income')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${filterType === 'income' ? 'bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-none' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Income</button>
            <button onClick={() => setFilterType('expense')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${filterType === 'expense' ? 'bg-white dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm dark:shadow-none' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Expense</button>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="glass rounded-2xl flex-1 overflow-hidden hidden sm:flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-white/5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-charcoal-900/50">
           <div className="col-span-4">Transaction</div>
           <div className="col-span-3">Category</div>
           <div className="col-span-2">Date</div>
           <div className="col-span-2 text-right">Amount</div>
           <div className="col-span-1 text-right"></div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredTransactions.map(t => {
            const cat = getCategory(t.category);
            const Icon = cat.icon;
            const acc = state.accounts?.find(a => a.id === t.accountId);
            const accName = acc ? acc.name : 'Unknown Wallet';
            return (
              <div key={t.id} className="grid grid-cols-12 gap-4 p-3 items-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group">
                 <div className="col-span-4 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white dark:bg-charcoal-800 shadow-sm dark:shadow-none" style={{ color: cat.color }}>
                      <Icon size={18} />
                   </div>
                   <div className="min-w-0">
                     <p className="font-medium text-gray-900 dark:text-white group-hover:text-gold-500 dark:group-hover:text-gold-400 transition-colors truncate">{t.title}</p>
                     <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/5 mt-0.5 inline-block">{accName}</span>
                   </div>
                 </div>
                 <div className="col-span-3 flex items-center">
                   <span className="px-3 py-1 rounded-full bg-gray-200 dark:bg-white/5 text-xs text-gray-600 dark:text-gray-300 capitalize border border-gray-300 dark:border-white/5 truncate">{cat.label}</span>
                 </div>
                 <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">
                   {t.date}
                 </div>
                 <div className={`col-span-2 text-right font-mono font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                   {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </div>
                 <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => setEditModalData(t)} className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                     <Edit2 size={15} />
                   </button>
                   <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/10 transition-colors">
                     <Trash2 size={15} />
                   </button>
                 </div>
              </div>
            );
          })}
          
          {state.transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
               <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                 <Search size={24} className="text-gray-400" />
               </div>
               <p className="text-lg text-gray-900 dark:text-white font-medium">No transactions yet</p>
               <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">Click the + button to add your first transaction.</p>
            </div>
          )}
          
          {state.transactions.length > 0 && filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
               <p className="text-lg">No matches found.</p>
               <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {filteredTransactions.map(t => {
          const cat = getCategory(t.category);
          const Icon = cat.icon;
          const acc = state.accounts?.find(a => a.id === t.accountId);
          const accName = acc ? acc.name : 'Unknown Wallet';
          return (
            <div key={t.id} className="glass p-4 rounded-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white dark:bg-charcoal-800 shadow-sm dark:shadow-none" style={{ color: cat.color }}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{t.title}</p>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t.date}</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{cat.label}</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-[10px] text-gold-600 dark:text-gold-400 font-semibold bg-gold-500/10 dark:bg-gold-500/20 px-1.5 py-0.2 rounded border border-gold-500/20">{accName}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-mono font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                    {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                <button onClick={() => setEditModalData(t)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => handleDelete(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          );
        })}
        
        {state.transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 glass rounded-2xl p-6">
             <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
               <Search size={20} className="text-gray-400" />
             </div>
             <p className="text-base text-gray-900 dark:text-white font-medium">No transactions yet</p>
             <p className="text-xs mt-1 text-gray-500 dark:text-gray-400 text-center">Click the + button to add your first transaction.</p>
          </div>
        )}
        
        {state.transactions.length > 0 && filteredTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 glass rounded-2xl p-6">
             <p className="text-base">No matches found.</p>
             <p className="text-xs mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      <TransactionModal isOpen={!!editModalData} onClose={() => setEditModalData(null)} editData={editModalData} />
    </div>
  );
}
