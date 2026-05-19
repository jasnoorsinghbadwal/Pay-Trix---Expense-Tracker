import React, { useState, useEffect } from 'react';
import { Sun, Moon, Download, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import toast from 'react-hot-toast';

import { PeriodSelector } from './PeriodSelector';

export function Header({ title, currentTab, setCurrentTab }) {
  const { state, dispatch } = useFinance();
  const userName = state.settings.userName || 'User';
  const firstName = userName.split(' ')[0];
  const initials = userName.substring(0, 2).toUpperCase();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.dismiss();
      toast(
        (t) => (
          <span className="flex items-center gap-3">
            <span>💡 To install the app, look for the "Install" icon in your browser address bar or menu!</span>
            <button onClick={() => toast.dismiss(t.id)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors shrink-0">
              <X size={16} />
            </button>
          </span>
        ),
        { duration: 4000 }
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const showPeriodSelector = ['dashboard', 'transactions', 'budget', 'analytics'].includes(currentTab);

  return (
    <header className="h-20 border-b border-gray-200/50 dark:border-white/10 flex items-center px-4 md:px-8 justify-between shrink-0 sticky top-0 bg-white/80 dark:bg-navy-900/80 backdrop-blur-lg z-30 transition-colors duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-sm md:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white truncate hidden sm:block">{title}</h2>
        {showPeriodSelector && <PeriodSelector />}
      </div>
      
      <div className="flex items-center gap-3 md:gap-5">
        <button 
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold-500/20 text-gold-600 dark:text-gold-400 hover:bg-gold-500/30 font-medium text-sm transition-colors"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Install App</span>
        </button>
        
        <button 
          onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
          className="relative w-10 h-10 rounded-full bg-gray-100 dark:bg-charcoal-800 flex items-center justify-center border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-charcoal-900 transition-colors text-gray-600 dark:text-gray-300"
        >
          {state.settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <button 
          onClick={() => setCurrentTab('profile')}
          className="flex items-center gap-3 pl-3 md:pl-5 border-l border-gray-200 dark:border-white/10 hover:opacity-80 active:scale-95 transition-all text-left outline-none cursor-pointer group"
        >
           <div className="text-right hidden sm:block">
             <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gold-500 dark:group-hover:text-gold-400 transition-colors">{firstName}</p>
             <p className="text-[10px] text-gold-600 dark:text-gold-400 font-bold uppercase tracking-wider">Settings</p>
           </div>
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gold-500 to-amber-300 flex items-center justify-center text-navy-900 font-bold shadow-lg shadow-gold-500/20 text-sm group-hover:scale-105 transition-transform">
             {initials}
           </div>
        </button>
      </div>
    </header>
  );
}
