import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Lock, Unlock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export function LockScreen({ onUnlock }) {
  const { state } = useFinance();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === state.settings.appLock) {
      onUnlock();
    } else {
      setError(true);
      setPassword('');
      toast.error('Incorrect password/PIN');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-navy-900 transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      
      <div className={`relative w-full max-w-sm p-8 glass rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col items-center ${error ? 'animate-shake' : 'animate-in zoom-in-95 fade-in duration-500'}`}>
        <div className="w-20 h-20 bg-gradient-to-tr from-gold-500 to-amber-300 rounded-full flex items-center justify-center text-navy-900 shadow-[0_0_30px_rgba(245,166,35,0.4)] mb-6">
          <Lock size={36} strokeWidth={2.5} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">App Locked</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">Enter your password or PIN to access PayTrix.</p>
        
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className={`w-full bg-white dark:bg-charcoal-900 border ${error ? 'border-rose-500 focus:ring-rose-500/50' : 'border-gray-200 dark:border-white/10 focus:border-gold-500/50 focus:ring-gold-500/50'} rounded-xl py-4 px-5 text-center tracking-widest text-lg focus:outline-none focus:ring-2 transition-all text-gray-900 dark:text-white placeholder:tracking-normal placeholder:text-sm placeholder:text-gray-400`}
              autoFocus
            />
          </div>
          <button 
            type="submit"
            className="w-full py-4 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg active:scale-95"
          >
            Unlock <Unlock size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
