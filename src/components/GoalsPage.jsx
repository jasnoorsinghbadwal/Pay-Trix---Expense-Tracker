import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../context/FinanceContext';
import { Target, Trophy, Calendar, Plus, X, Trash2, ArrowUpRight, ArrowDownRight, Wallet, Sparkles, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export function GoalsPage() {
  const { state, dispatch } = useFinance();
  const currency = state.settings.currency;
  
  const [isAdding, setIsAdding] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');
  const [color, setColor] = useState('#F5A623'); // gold
  const [deadline, setDeadline] = useState('');
  
  const [activeGoalForAction, setActiveGoalForAction] = useState(null); // { goal, type: 'contribute'|'withdraw' }
  const [actionAmount, setActionAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');

  // Handle background scroll lock
  useEffect(() => {
    if (isAdding || activeGoalForAction) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAdding, activeGoalForAction]);

  const colors = [
    { name: 'Gold', value: '#F5A623' },
    { name: 'Emerald', value: '#10B981' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Rose', value: '#EF4444' },
  ];

  const goals = state.goals || [];
  const accounts = state.accounts || [];

  const getAccountBalance = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
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

  // Consolidated Savings Status
  const { totalTarget, totalCurrent, overallProgress } = useMemo(() => {
    let target = 0;
    let current = 0;
    goals.forEach(g => {
      target += g.targetAmount;
      current += g.currentAmount;
    });
    const prog = target > 0 ? Math.round((current / target) * 100) : 0;
    return { totalTarget: target, totalCurrent: current, overallProgress: prog };
  }, [goals]);

  // Handle saving new goal
  const handleSaveGoal = (e) => {
    e.preventDefault();
    if (!goalName || !targetAmount) {
      toast.error('Please enter Goal Name and Target Amount');
      return;
    }

    const targetVal = parseFloat(targetAmount);
    const initialVal = parseFloat(initialAmount) || 0;

    if (targetVal <= 0) {
      toast.error('Target amount must be greater than zero');
      return;
    }

    if (initialVal < 0 || initialVal > targetVal) {
      toast.error('Initial savings must be between 0 and the target amount');
      return;
    }

    const newGoal = {
      id: `goal-${Date.now()}`,
      name: goalName,
      targetAmount: targetVal,
      currentAmount: initialVal,
      color,
      deadline: deadline || null,
      history: initialVal > 0 ? [{ id: `log-${Date.now()}`, type: 'contribution', amount: initialVal, date: new Date().toISOString().split('T')[0] }] : []
    };

    dispatch({ type: 'ADD_GOAL', payload: newGoal });

    // Deduct initial amount from account if set & greater than 0
    if (initialVal > 0 && selectedWalletId) {
      const selectedWallet = accounts.find(a => a.id === selectedWalletId);
      const walletName = selectedWallet ? selectedWallet.name : 'Wallet';
      
      const newTx = {
        id: `tx-goal-init-${Date.now()}`,
        goalId: newGoal.id,
        title: `Goal Allocation: ${goalName}`,
        amount: initialVal,
        type: 'expense',
        category: 'savings',
        accountId: selectedWalletId,
        date: new Date().toISOString().split('T')[0]
      };
      dispatch({ type: 'ADD_TRANSACTION', payload: newTx });
      toast.success(`Deducted ${currency}${initialVal} from ${walletName} as initial savings!`);
    }

    setGoalName('');
    setTargetAmount('');
    setInitialAmount('0');
    setDeadline('');
    setSelectedWalletId('');
    setIsAdding(false);
    toast.success('Savings goal set successfully!');
  };

  // Handle contribute/withdraw transactions
  const handleGoalActionSubmit = (e) => {
    e.preventDefault();
    const amountVal = parseFloat(actionAmount);
    if (!amountVal || amountVal <= 0) {
      toast.error('Amount must be positive');
      return;
    }

    const { goal, type } = activeGoalForAction;

    if (type === 'contribute') {
      if (goal.currentAmount + amountVal > goal.targetAmount) {
        toast.error('Contribution exceeds the goal target!');
        return;
      }
      if (!selectedWalletId) {
        toast.error('Please select a wallet to deduct from');
        return;
      }

      const selectedWallet = accounts.find(a => a.id === selectedWalletId);
      const walletName = selectedWallet ? selectedWallet.name : 'Wallet';

      // 1. Update Goal Amount
      dispatch({
        type: 'CONTRIBUTE_TO_GOAL',
        payload: { goalId: goal.id, amount: amountVal, date: new Date().toISOString().split('T')[0] }
      });

      // 2. Log Deduction Transaction
      const newTx = {
        id: `tx-goal-${Date.now()}`,
        goalId: goal.id,
        title: `Goal Contribution: ${goal.name}`,
        amount: amountVal,
        type: 'expense',
        category: 'savings',
        accountId: selectedWalletId,
        date: new Date().toISOString().split('T')[0]
      };
      dispatch({ type: 'ADD_TRANSACTION', payload: newTx });

      // Special visual congratulations check
      if (goal.currentAmount + amountVal >= goal.targetAmount) {
        toast.success(`🎉 Hurray! You have reached 100% of your target for "${goal.name}"!`);
      } else {
        toast.success(`Added ${currency}${amountVal} to "${goal.name}" from ${walletName}!`);
      }

    } else {
      // withdraw
      if (amountVal > goal.currentAmount) {
        toast.error('Cannot withdraw more than current savings!');
        return;
      }
      if (!selectedWalletId) {
        toast.error('Please select a wallet to refund to');
        return;
      }

      const selectedWallet = accounts.find(a => a.id === selectedWalletId);
      const walletName = selectedWallet ? selectedWallet.name : 'Wallet';

      // 1. Update Goal Amount
      dispatch({
        type: 'WITHDRAW_FROM_GOAL',
        payload: { goalId: goal.id, amount: amountVal, date: new Date().toISOString().split('T')[0] }
      });

      // 2. Log Refund Transaction
      const newTx = {
        id: `tx-goal-${Date.now()}`,
        title: `Goal Withdrawal: ${goal.name}`,
        amount: amountVal,
        type: 'income',
        category: 'income',
        accountId: selectedWalletId,
        date: new Date().toISOString().split('T')[0]
      };
      dispatch({ type: 'ADD_TRANSACTION', payload: newTx });

      toast.success(`Refunded ${currency}${amountVal} to ${walletName}!`);
    }

    setActionAmount('');
    setSelectedWalletId('');
    setActiveGoalForAction(null);
  };

  // Delete goal (Wipe or Refund remaining balance)
  const handleDeleteGoal = (goal) => {
    if (goal.currentAmount > 0) {
      const confirmRefund = window.confirm(
        `This goal has active savings of ${currency}${goal.currentAmount}. Do you want to refund this balance back to your wallets? If YES, please cancel and use the Withdrawal button, or click OK to delete and permanently discard these savings.`
      );
      if (!confirmRefund) return;
    }

    dispatch({ type: 'DELETE_GOAL', payload: goal.id });
    toast.success(`Savings goal "${goal.name}" deleted.`);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full pb-4">
      
      {/* Consolidated Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Header Title */}
        <div className="lg:col-span-2 glass p-5 md:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-1 text-gray-900 dark:text-white">Savings Goals</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Put money aside toward milestones without affecting your day-to-day spending</p>
          </div>
          {!isAdding && (
            <button 
              onClick={() => {
                if (accounts.length === 0) {
                  toast.error('Please add a wallet account first!');
                  return;
                }
                setIsAdding(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 shrink-0"
            >
              <Plus size={16} /> New Goal
            </button>
          )}
        </div>

        {/* Global Progress Card */}
        <div className="glass p-5 rounded-2xl bg-gradient-to-tr from-navy-950 via-charcoal-900 to-navy-900 border border-gold-500/10 flex items-center justify-between hover:-translate-y-0.5 transition-transform duration-300">
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Consolidated Savings Goal Progress</p>
            <h3 className="text-2xl font-bold font-mono mt-1 text-gold-400 truncate">
              {currency}{totalCurrent.toLocaleString()} <span className="text-gray-500 text-xs font-normal">of {currency}{totalTarget.toLocaleString()}</span>
            </h3>
            <p className="text-[9px] text-gray-500 mt-1 truncate">Overall achievement rate: {overallProgress}%</p>
          </div>
          <div className="w-14 h-14 shrink-0 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 font-mono font-bold text-sm">
            {overallProgress}%
          </div>
        </div>
      </div>

      {/* Goal Creator Form */}
      {isAdding && (
        <div className="glass p-5 md:p-6 rounded-2xl border border-gold-500/30 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Create Savings Goal</h3>
            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"><X size={18} /></button>
          </div>
          <form onSubmit={handleSaveGoal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1 font-medium">Goal Name</label>
                <input 
                  type="text" 
                  value={goalName} 
                  onChange={e => setGoalName(e.target.value)}
                  placeholder="e.g. Dream Laptop" 
                  className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 outline-none text-sm text-gray-900 dark:text-white focus:border-gold-500/50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1 font-medium">Target Amount ({currency})</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={targetAmount} 
                  onChange={e => setTargetAmount(e.target.value)}
                  placeholder="e.g. 50000" 
                  className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 outline-none text-sm text-gray-900 dark:text-white focus:border-gold-500/50 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1 font-medium">Target Date (Optional)</label>
                <input 
                  type="date" 
                  value={deadline} 
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 outline-none text-sm text-gray-900 dark:text-white focus:border-gold-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1 font-medium">Fund Initial Savings from Wallet? (Optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" 
                    step="0.01" 
                    value={initialAmount} 
                    onChange={e => setInitialAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 outline-none text-sm text-gray-900 dark:text-white focus:border-gold-500/50 font-mono"
                    placeholder="Initial fund amount"
                  />
                  <select 
                    value={selectedWalletId} 
                    onChange={e => setSelectedWalletId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 outline-none text-sm text-gray-900 dark:text-white focus:border-gold-500/50 appearance-none font-medium"
                    required={parseFloat(initialAmount) > 0}
                  >
                    <option value="">Select Account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({currency}{getAccountBalance(a.id).toLocaleString(undefined, { minimumFractionDigits: 2 })})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1 font-medium">Goal Visual Tag Color</label>
                <div className="flex gap-2.5 pt-1">
                  {colors.map(col => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setColor(col.value)}
                      className="w-8 h-8 rounded-full border transition-all flex items-center justify-center hover:scale-110 shrink-0"
                      style={{ backgroundColor: col.value, borderColor: color === col.value ? '#ffffff' : 'transparent', boxShadow: color === col.value ? `0 0 10px ${col.value}` : 'none' }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              Create Savings Target
            </button>
          </form>
        </div>
      )}

      {/* Grid of Goals */}
      {goals.length === 0 ? (
        <div className="glass p-12 text-center max-w-xl mx-auto rounded-3xl">
          <div className="w-16 h-16 bg-gold-500/10 border border-gold-500/20 text-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Plan Your Next Milestone!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Saving money is easier when you plan ahead. Add a dream laptop, vacation fund, or wedding budget, and track your milestones!
          </p>
          <button 
            onClick={() => {
              if (accounts.length === 0) {
                toast.error('Please add a wallet account first!');
                return;
              }
              setIsAdding(true);
            }} 
            className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-xl font-bold shadow-lg"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {goals.map(g => {
            const progress = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            const isCompleted = progress >= 100;
            
            // Calculate milestones achieved
            const milestones = [
              { pct: 25, label: 'Quarterway' },
              { pct: 50, label: 'Halfway' },
              { pct: 75, label: 'Almost There' },
              { pct: 100, label: 'Fully Achieved' }
            ];

            return (
              <div 
                key={g.id} 
                className="glass p-5 md:p-6 rounded-2xl relative overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
                style={{ borderLeftWidth: '5px', borderLeftColor: g.color }}
              >
                {/* Completed Celebration Overlay Effect */}
                {isCompleted && (
                  <div className="absolute top-2 right-2 text-gold-500 animate-bounce select-none">
                    <Trophy size={20} className="drop-shadow-[0_0_8px_rgba(245,166,35,0.6)]" />
                  </div>
                )}

                {/* Card Title Header */}
                <div className="flex justify-between items-start mb-3 min-w-0">
                  <div className="min-w-0">
                    <h4 className="font-bold text-base md:text-lg text-gray-900 dark:text-white truncate pr-5 group-hover:text-gold-500 dark:group-hover:text-gold-400 transition-colors">
                      {g.name}
                    </h4>
                    {g.deadline && (
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={10} /> Target date: {g.deadline}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDeleteGoal(g)}
                    className="p-1 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Progress Indicators & Rings */}
                <div className="flex items-center gap-4 my-4 flex-1">
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    {/* SVG Progress Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" className="stroke-gray-100 dark:stroke-white/5" strokeWidth="4.5" fill="transparent" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        stroke={g.color} 
                        strokeWidth="4.5" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 28} 
                        strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)} 
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <span className="absolute font-mono text-xs font-bold text-gray-900 dark:text-white">
                      {progress}%
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Current Balance</p>
                    <h5 className="text-xl font-bold font-mono text-gray-900 dark:text-white truncate">
                      {currency}{g.currentAmount.toLocaleString()}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Target: {currency}{g.targetAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Milestone Checklist */}
                <div className="border-t border-white/5 pt-3 mb-4 space-y-1.5">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">Milestone Checkpoints</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {milestones.map(mile => {
                      const achieved = progress >= mile.pct;
                      return (
                        <div key={mile.pct} className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] border transition-colors ${achieved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400 dark:text-gray-500'}`}>
                          {achieved ? '✓' : '○'} {mile.pct}% {mile.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Contribution & Withdrawal */}
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <button
                    onClick={() => {
                      if (accounts.length === 0) {
                        toast.error('Add a wallet account first!');
                        return;
                      }
                      setActiveGoalForAction({ goal: g, type: 'contribute' });
                    }}
                    disabled={isCompleted}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${isCompleted ? 'bg-gray-100 dark:bg-white/5 border-transparent text-gray-400 cursor-not-allowed' : 'bg-gold-500 hover:bg-gold-400 border-gold-500 text-navy-900 shadow-md shadow-gold-500/10'}`}
                  >
                    <ArrowUpRight size={14} /> Save
                  </button>
                  <button
                    onClick={() => {
                      if (accounts.length === 0) {
                        toast.error('Add a wallet account first!');
                        return;
                      }
                      if (g.currentAmount <= 0) {
                        toast.error('No savings to withdraw from!');
                        return;
                      }
                      setActiveGoalForAction({ goal: g, type: 'withdraw' });
                    }}
                    className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-900 dark:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowDownRight size={14} /> Retrieve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Modal (Contribute / Withdraw) */}
      {activeGoalForAction && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/55 dark:bg-navy-950/85 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setActiveGoalForAction(null)}></div>
          
          <div className="relative w-full max-w-md glass rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {activeGoalForAction.type === 'contribute' ? (
                  <><ArrowUpRight className="text-gold-500" /> Allocate Savings</>
                ) : (
                  <><ArrowDownRight className="text-rose-500" /> Retrieve Savings</>
                )}
              </h3>
              <button onClick={() => setActiveGoalForAction(null)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleGoalActionSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Goal: <span className="font-semibold text-gray-900 dark:text-white">{activeGoalForAction.goal.name}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Current Savings: <span className="font-mono font-semibold text-gray-900 dark:text-white">{currency}{activeGoalForAction.goal.currentAmount}</span> / Limit: {currency}{activeGoalForAction.goal.targetAmount}
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1 font-semibold">
                  Amount ({currency})
                </label>
                <input 
                  type="number"
                  step="0.01"
                  value={actionAmount}
                  onChange={e => setActionAmount(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 outline-none text-sm text-gray-900 dark:text-white focus:border-gold-500/50 font-mono"
                  placeholder="0.00"
                  max={activeGoalForAction.type === 'contribute' ? (activeGoalForAction.goal.targetAmount - activeGoalForAction.goal.currentAmount) : activeGoalForAction.goal.currentAmount}
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 ml-1 font-semibold">
                  {activeGoalForAction.type === 'contribute' ? 'Deduct funds from Wallet' : 'Refund balance to Wallet'}
                </label>
                <select 
                  value={selectedWalletId} 
                  onChange={e => setSelectedWalletId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-3 outline-none text-sm text-gray-900 dark:text-white focus:border-gold-500/50 font-medium"
                  required
                >
                  <option value="" disabled>Select Wallet Account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({currency}{getAccountBalance(a.id).toLocaleString(undefined, { minimumFractionDigits: 2 })})</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                className={`w-full py-3.5 mt-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm ${activeGoalForAction.type === 'contribute' ? 'bg-gold-500 hover:bg-gold-400 text-navy-900 shadow-gold-500/10' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10'}`}
              >
                {activeGoalForAction.type === 'contribute' ? 'Confirm Allocation' : 'Confirm Retrieval'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
