import React from 'react';
import { LayoutDashboard, ReceiptText, PieChart, TrendingUp, Wallet, UserCircle, Target, Compass, Sparkles } from 'lucide-react';

export function Sidebar({ currentTab, setCurrentTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'budget', label: 'Budget Planner', icon: PieChart },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-white/10 hidden md:flex flex-col p-6 shrink-0 bg-white/50 dark:bg-navy-900/50 backdrop-blur-xl z-20 relative transition-colors duration-300">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gold-400 mb-10 tracking-wide font-sans flex items-center gap-3">
        <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center text-navy-900 shadow-lg shadow-gold-500/20">
          <TrendingUp size={20} strokeWidth={3} />
        </div>
        Pay Trix
      </h1>
      <nav className="flex-1 space-y-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                isActive 
                  ? 'glass text-gold-600 dark:text-gold-400 shadow-[0_0_15px_rgba(245,166,35,0.1)]' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto pt-6 border-t border-gray-200 dark:border-white/10">
        <div className="glass p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-charcoal-800 flex items-center justify-center text-lg shrink-0">💡</div>
          <div>
             <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pro Tip</p>
             <p className="text-xs text-gray-700 dark:text-gray-200 mt-0.5">Backup data regularly.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
