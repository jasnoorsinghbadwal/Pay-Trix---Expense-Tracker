import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Search, Trash2, Edit2, Plus } from 'lucide-react';
import { getCategory } from '../utils/constants';
import toast from 'react-hot-toast';
import { TransactionModal } from './TransactionModal';

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
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-4">
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
          <div className="flex items-center w-full sm:w-auto bg-gray-100 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl p-1 overflow-x-auto">
            <button onClick={() => setFilterType('all')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${filterType === 'all' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-none' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>All</button>
            <button onClick={() => setFilterType('income')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${filterType === 'income' ? 'bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-none' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Income</button>
            <button onClick={() => setFilterType('expense')} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${filterType === 'expense' ? 'bg-white dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm dark:shadow-none' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Expense</button>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 border-b border-gray-200 dark:border-white/5 text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-charcoal-900/50">
           <div className="col-span-7 sm:col-span-4">Transaction</div>
           <div className="col-span-3 sm:col-span-3 hidden sm:block">Category</div>
           <div className="col-span-4 sm:col-span-2 hidden sm:block">Date</div>
           <div className="col-span-5 sm:col-span-2 text-right">Amount</div>
           <div className="hidden sm:block sm:col-span-1 text-right"></div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 md:space-y-2">
          {filteredTransactions.map(t => {
            const cat = getCategory(t.category);
            const Icon = cat.icon;
            return (
              <div key={t.id} className="grid grid-cols-12 gap-2 md:gap-4 p-2 md:p-3 items-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group">
                 <div className="col-span-7 sm:col-span-4 flex items-center gap-3">
                   <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 bg-white dark:bg-charcoal-800 shadow-sm dark:shadow-none" style={{ color: cat.color }}>
                      <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                   </div>
                   <div className="min-w-0">
                     <p className="font-medium text-gray-900 dark:text-white group-hover:text-gold-500 dark:group-hover:text-gold-400 transition-colors truncate text-sm md:text-base">{t.title}</p>
                     <p className="text-xs text-gray-500 sm:hidden truncate">{t.date}</p>
                   </div>
                 </div>
                 <div className="col-span-3 sm:col-span-3 hidden sm:flex items-center">
                   <span className="px-2 md:px-3 py-1 rounded-full bg-gray-200 dark:bg-white/5 text-[10px] md:text-xs text-gray-600 dark:text-gray-300 capitalize border border-gray-300 dark:border-white/5 truncate">{cat.label}</span>
                 </div>
                 <div className="col-span-4 sm:col-span-2 hidden sm:block text-xs md:text-sm text-gray-500 dark:text-gray-400">
                   {t.date}
                 </div>
                 <div className={`col-span-5 sm:col-span-2 text-right font-mono font-medium text-sm md:text-base ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                   {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                 </div>
                 
                 {/* Actions */}
                 <div className="col-span-12 sm:col-span-1 flex sm:flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-gray-200 dark:border-white/5 sm:border-0">
                   <button onClick={() => setEditModalData(t)} className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex-1 sm:flex-none flex justify-center">
                     <Edit2 size={16} />
                   </button>
                   <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/10 transition-colors flex-1 sm:flex-none flex justify-center">
                     <Trash2 size={16} />
                   </button>
                 </div>
              </div>
            );
          })}
          
          {state.transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 md:h-64 text-gray-500">
               <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                 <Search size={24} className="text-gray-400" />
               </div>
               <p className="text-base md:text-lg text-gray-900 dark:text-white font-medium">No transactions yet</p>
               <p className="text-xs md:text-sm mt-1 text-gray-500 dark:text-gray-400 text-center px-4">Click the + button to add your first transaction.</p>
            </div>
          )}
          
          {state.transactions.length > 0 && filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 md:h-64 text-gray-500">
               <p className="text-base md:text-lg">No matches found.</p>
               <p className="text-xs md:text-sm mt-1 text-gray-500 dark:text-gray-600">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      <TransactionModal isOpen={!!editModalData} onClose={() => setEditModalData(null)} editData={editModalData} />
    </div>
  );
}
