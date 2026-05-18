import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, Calendar, Check, AlertCircle, Sparkles, X, Edit2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export function SubscriptionsTracker() {
  const { state, dispatch } = useFinance();
  const currency = state.settings.currency;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [category, setCategory] = useState('bills');

  // Pay Confirmation Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedSubToPay, setSelectedSubToPay] = useState(null);
  const [payAccountId, setPayAccountId] = useState('');

  // Compute Total Subscription Overhead
  const metrics = useMemo(() => {
    const subs = state.subscriptions || [];
    let monthlyTotal = 0;
    
    subs.forEach(s => {
      const amt = parseFloat(s.amount) || 0;
      if (s.billingCycle === 'monthly') {
        monthlyTotal += amt;
      } else if (s.billingCycle === 'yearly') {
        monthlyTotal += amt / 12;
      }
    });

    return {
      monthlyOverhead: monthlyTotal,
      activeCount: subs.length
    };
  }, [state.subscriptions]);

  const openModal = (sub = null) => {
    if (sub) {
      setEditData(sub);
      setName(sub.name);
      setAmount(sub.amount);
      setBillingCycle(sub.billingCycle || 'monthly');
      setNextBillingDate(sub.nextBillingDate || '');
      setCategory(sub.category || 'bills');
    } else {
      setEditData(null);
      setName('');
      setAmount('');
      setBillingCycle('monthly');
      const today = new Date().toISOString().split('T')[0];
      setNextBillingDate(today);
      setCategory('bills');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !amount || !nextBillingDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editData && editData.paidUntil && nextBillingDate < editData.paidUntil) {
      alert('Bill Already Paid for this date/cycle.');
      toast.error(`Bill Already Paid for this date/cycle.`);
      return;
    }

    const payload = {
      id: editData ? editData.id : `sub-${Date.now()}`,
      name,
      amount: parseFloat(amount),
      billingCycle,
      nextBillingDate,
      category,
      paidUntil: editData ? editData.paidUntil || '' : '',
      active: true
    };

    if (editData) {
      dispatch({ type: 'EDIT_SUBSCRIPTION', payload });
      toast.success('Subscription updated successfully!');
    } else {
      dispatch({ type: 'ADD_SUBSCRIPTION', payload });
      toast.success('Subscription registered successfully!');
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      dispatch({ type: 'DELETE_SUBSCRIPTION', payload: id });
      toast.success('Subscription deleted');
    }
  };

  // Pay triggers
  const startMarkAsPaid = (sub) => {
    setSelectedSubToPay(sub);
    setPayAccountId(state.accounts[0]?.id || '');
    setPayModalOpen(true);
  };

  const confirmMarkAsPaid = () => {
    if (!selectedSubToPay) return;
    if (!payAccountId) {
      toast.error('Please select a payment wallet');
      return;
    }

    // 1. Add Transaction to Ledger
    const transactionId = `txn-${Date.now()}`;
    const txnPayload = {
      id: transactionId,
      title: `${selectedSubToPay.name} (Recurring)`,
      amount: selectedSubToPay.amount,
      type: 'expense',
      category: selectedSubToPay.category,
      accountId: payAccountId,
      date: new Date().toISOString().split('T')[0],
      notes: `Automated subscription payment via PayTrix scheduler.`
    };
    dispatch({ type: 'ADD_TRANSACTION', payload: txnPayload });

    // 2. Roll Forward Next Billing Date
    const currentBillingDate = new Date(selectedSubToPay.nextBillingDate);
    if (selectedSubToPay.billingCycle === 'monthly') {
      currentBillingDate.setMonth(currentBillingDate.getMonth() + 1);
    } else {
      currentBillingDate.setFullYear(currentBillingDate.getFullYear() + 1);
    }

    const updatedSub = {
      ...selectedSubToPay,
      paidUntil: selectedSubToPay.nextBillingDate,
      nextBillingDate: currentBillingDate.toISOString().split('T')[0]
    };
    dispatch({ type: 'EDIT_SUBSCRIPTION', payload: updatedSub });

    toast.success(`Registered payment for ${selectedSubToPay.name}! Next billing rolled forward.`);
    setPayModalOpen(false);
    setSelectedSubToPay(null);
  };

  // Calculate days remaining helper
  const getRemainingDays = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-4">
      {/* Top Banner */}
      <div className="glass p-5 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-gold-500" size={24} />
            Smart Subscriptions & Recurring Bills
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">Track fixed commitments, control subscription leaks, and pay with one click</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="w-full md:w-auto px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 shrink-0 self-start md:self-auto"
        >
          <Plus size={16} /> Add Subscription
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass p-5 rounded-2xl border border-gray-200 dark:border-white/5">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Monthly Overhead</p>
          <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {currency}{metrics.monthlyOverhead.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Weighted monthly total including annualized subscriptions</p>
        </div>
        <div className="glass p-5 rounded-2xl border border-gray-200 dark:border-white/5">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Commitments</p>
          <p className="font-mono text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {metrics.activeCount} Active
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Regularly scheduled recurring billing plans</p>
        </div>
      </div>

      {/* Subscriptions List Grid */}
      {(state.subscriptions || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 md:h-64 text-gray-500 glass rounded-2xl p-6 text-center border-dashed border-2 border-gray-300 dark:border-white/5">
          <Calendar size={32} className="text-gray-400 mb-3" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">No active subscriptions yet</p>
          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400 max-w-xs">Track commitments like Netflix, rent, utilities, and more to see them in your budget.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {state.subscriptions.map(sub => {
            const daysLeft = getRemainingDays(sub.nextBillingDate);
            const isOverdue = daysLeft < 0;
            const isDueSoon = daysLeft >= 0 && daysLeft <= 3;
            
            let statusColorClass = 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5';
            if (isOverdue) {
              statusColorClass = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/10 animate-pulse';
            } else if (isDueSoon) {
              statusColorClass = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/10';
            }

            return (
              <div key={sub.id} className="glass p-5 rounded-2xl relative group overflow-hidden flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                {/* Actions overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => openModal(sub)} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(sub.id)} className="p-2 text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div>
                  {/* Title & Status Indicator */}
                  <div className="flex justify-between items-start mb-4 pr-12">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate max-w-[140px]">{sub.name}</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold capitalize mt-0.5">{sub.billingCycle}</p>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColorClass}`}>
                      {isOverdue ? 'Overdue' : isDueSoon ? `In ${daysLeft} days` : `In ${daysLeft} days`}
                    </div>
                  </div>

                  {/* Cost Container */}
                  <div className="bg-gray-50 dark:bg-charcoal-900/50 rounded-xl p-3 border border-gray-100 dark:border-white/5 mb-4">
                     <p className="text-[10px] text-gray-400 uppercase font-semibold">Cost</p>
                     <p className="font-mono text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                       {currency}{sub.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                     </p>
                  </div>
                </div>

                {/* Details / Payment buttons */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs text-gray-500 border-b border-gray-100 dark:border-white/5 pb-2">
                    <span className="flex items-center gap-1"><Calendar size={12} /> Next Bill:</span>
                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{sub.nextBillingDate}</span>
                  </div>

                  {/* Quick pay Action */}
                  <button 
                    onClick={() => startMarkAsPaid(sub)}
                    className="w-full mt-2 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-emerald-500/10"
                  >
                    <Check size={14} /> Record Payment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscription Creator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 dark:bg-navy-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeModal}></div>
          <div className="relative w-full max-w-md glass rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 fade-in duration-300">
             
             {/* Header */}
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="text-gold-500" size={18} />
                  {editData ? 'Edit Subscription' : 'Add New Subscription'}
                </h3>
                <button onClick={closeModal} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Subscription Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Netflix, Spotify, Rent" className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 focus:border-gold-500/50 outline-none text-sm text-gray-900 dark:text-white" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Amount *</label>
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 focus:border-gold-500/50 outline-none text-sm font-mono text-gray-900 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Billing Cycle</label>
                    <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)} className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 focus:border-gold-500/50 outline-none text-sm text-gray-900 dark:text-white capitalize">
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 focus:border-gold-500/50 outline-none text-sm text-gray-900 dark:text-white capitalize">
                    <option value="bills">Bills & Utilities</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="education">Education</option>
                    <option value="shopping">Shopping</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Next Billing Date *</label>
                  <input 
                    type="date" 
                    value={nextBillingDate} 
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (editData && editData.paidUntil && selectedVal && selectedVal < editData.paidUntil) {
                        alert('Bill Already Paid for this date/cycle.');
                        // Revert
                        setNextBillingDate(editData.nextBillingDate || '');
                        return;
                      }
                      setNextBillingDate(selectedVal);
                    }} 
                    min={editData && editData.paidUntil ? editData.paidUntil : ''}
                    className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 focus:border-gold-500/50 outline-none text-sm text-gray-900 dark:text-white" 
                    required 
                  />
                  {editData && editData.paidUntil && (
                    <p className="text-[10px] text-amber-500 mt-1.5 ml-1 font-semibold flex items-center gap-1.5 animate-pulse">
                      <ShieldAlert size={12} /> Cannot be earlier than last paid date: {editData.paidUntil}
                    </p>
                  )}
                </div>

                <button type="submit" className="w-full py-3 mt-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 text-sm">
                  <Check size={16} strokeWidth={3} /> {editData ? 'Save Changes' : 'Register Subscription'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Record Payment Confirmation Selection Modal */}
      {payModalOpen && selectedSubToPay && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 dark:bg-navy-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setPayModalOpen(false)}></div>
          <div className="relative w-full max-w-md glass rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 fade-in duration-300">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="text-gold-500" size={18} />
                Record Subscription Payment
              </h3>
              <button onClick={() => setPayModalOpen(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-charcoal-900/50 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Subscription</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5 text-lg">{selectedSubToPay.name}</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">{selectedSubToPay.billingCycle} billing cycle</p>
                
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-4">Amount to Pay</p>
                <p className="font-mono text-2xl font-bold text-gold-500 mt-0.5">
                  {currency}{selectedSubToPay.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Pay From Which Wallet? *</label>
                <select 
                  value={payAccountId} 
                  onChange={(e) => setPayAccountId(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 focus:border-gold-500/50 outline-none text-sm text-gray-900 dark:text-white font-medium"
                >
                  {(state.accounts || []).map(a => {
                    const latestBalance = getAccountBalance(a.id);
                    return (
                      <option key={a.id} value={a.id}>{a.name} ({currency}{latestBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })})</option>
                    );
                  })}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setPayModalOpen(false)} 
                  className="flex-1 py-3 bg-gray-100 dark:bg-charcoal-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors text-sm hover:bg-gray-200 dark:hover:bg-charcoal-900"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmMarkAsPaid}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors text-sm flex justify-center items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <Check size={16} strokeWidth={3} /> Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
