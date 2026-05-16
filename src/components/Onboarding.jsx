import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, ArrowRight, Sun, Moon } from 'lucide-react';

export function Onboarding() {
  const { state, dispatch } = useFinance();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('₹');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'COMPLETE_ONBOARDING', payload: { name: name.trim(), currency } });
  };

  const toggleTheme = () => dispatch({ type: 'TOGGLE_THEME' });
  const isDark = state.settings.theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-navy-900 text-white' : 'bg-gray-50 text-gray-900'} flex items-center justify-center p-4 transition-colors duration-300 relative`}>
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-charcoal-800 shadow-md border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 transition-colors"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="glass max-w-md w-full p-8 rounded-[2rem] animate-in zoom-in-95 fade-in duration-500 shadow-2xl border border-gray-200 dark:border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-64 h-64 bg-gold-500/20 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-gold-500 to-amber-300 rounded-2xl flex items-center justify-center text-navy-900 mx-auto mb-8 shadow-lg shadow-gold-500/30">
              <Wallet size={32} strokeWidth={2.5} />
            </div>
            
            <h1 className="text-3xl font-bold text-center mb-3 font-sans tracking-tight text-gray-900 dark:text-white">Welcome to FinTrack</h1>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-10 text-sm">Set up your financial profile to get started</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Your Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white/50 dark:bg-charcoal-900/50 border border-gray-300 dark:border-white/10 rounded-xl py-3.5 px-4 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Preferred Currency</label>
                <div className="grid grid-cols-4 gap-3">
                  {['₹', '$', '€', '£'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`py-3 rounded-xl font-mono text-xl transition-all ${currency === c ? 'bg-gold-500 text-navy-900 font-bold shadow-lg shadow-gold-500/30 scale-105' : 'bg-white/50 dark:bg-charcoal-900/50 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 mt-6 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-navy-900 font-bold rounded-xl transition-all shadow-xl hover:shadow-2xl text-base flex justify-center items-center gap-2 group"
              >
                Get Started
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
        </div>
      </div>
    </div>
  );
}
