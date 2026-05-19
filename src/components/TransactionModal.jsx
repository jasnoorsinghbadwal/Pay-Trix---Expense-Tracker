import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CATEGORIES } from '../utils/constants';
import toast from 'react-hot-toast';

export function TransactionModal({ isOpen, onClose, editData = null }) {
  const { state, dispatch } = useFinance();
  const [type, setType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');

  // Handle background scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setType(editData.type);
        setTitle(editData.title);
        setAmount(editData.amount.toString());
        setCategory(editData.category);
        setDate(editData.date);
        setAccountId(editData.accountId || (state.accounts?.[0]?.id || ''));
      } else {
        setType('expense');
        setTitle('');
        setAmount('');
        setCategory(CATEGORIES[0].id);
        setDate(new Date().toISOString().split('T')[0]);
        setAccountId(state.accounts?.[0]?.id || '');
      }
    }
  }, [isOpen, editData, state.accounts]);

  // Smart auto-select funding account when category changes
  useEffect(() => {
    if (isOpen && !editData && state.budgets[category] && state.budgets[category].accountId) {
      setAccountId(state.budgets[category].accountId);
    }
  }, [category, editData, isOpen, state.budgets]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    
    if (state.accounts.length === 0) {
      toast.error('Please create an account first!');
      return;
    }

    const transaction = {
      id: editData ? editData.id : Date.now().toString(),
      type,
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      date,
      accountId,
      timestamp: editData ? editData.timestamp : Date.now()
    };

    if (editData) {
      dispatch({ type: 'EDIT_TRANSACTION', payload: transaction });
      toast.success('Transaction updated');
    } else {
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      toast.success('Transaction added');
    }
    
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/55 dark:bg-navy-950/85 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg glass rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{editData ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {state.accounts.length === 0 ? (
          <div className="text-center p-6 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/20 mb-4">
            <p className="text-rose-600 dark:text-rose-400 font-medium">No Accounts Found</p>
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">You need to create a Wallet or Bank Account first before adding transactions.</p>
          </div>
        ) : (
          <>
            <div className="flex p-1 bg-gray-100 dark:bg-charcoal-900 rounded-xl mb-6 border border-gray-200 dark:border-white/5 shrink-0">
              <button 
                type="button"
                onClick={() => { setType('expense'); if (category === 'income') setCategory('food'); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'expense' ? 'bg-white dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >Expense</button>
              <button 
                type="button"
                onClick={() => { setType('income'); setCategory('income'); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'income' ? 'bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >Income</button>
            </div>

            <form className="space-y-4 md:space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-lg"></span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-8 pr-4 font-mono text-xl focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What was this for?"
                  className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ maxWidth: '100%' }}
                    className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-sm text-gray-900 dark:text-white dark:color-scheme-dark box-border"
                    required
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-sm text-gray-900 dark:text-white appearance-none"
                  >
                    {CATEGORIES.filter(c => type === 'income' ? c.id === 'income' : c.id !== 'income').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Funding Account</label>
                <select 
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-sm text-gray-900 dark:text-white appearance-none font-medium"
                  required
                >
                  {state.accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 mt-6 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl shadow-lg shadow-gold-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} strokeWidth={3} />
                {editData ? 'Update Transaction' : 'Save Transaction'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
