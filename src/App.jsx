import React, { useState, useEffect } from 'react';
import { useFinance } from './context/FinanceContext';
import { Toaster } from 'react-hot-toast';
import { Plus, LayoutDashboard, ReceiptText, PieChart, TrendingUp, Wallet, UserCircle } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsPage } from './components/TransactionsPage';
import { BudgetPlanner } from './components/BudgetPlanner';
import { Analytics } from './components/Analytics';
import { Onboarding } from './components/Onboarding';
import { AccountsPage } from './components/AccountsPage';
import { ProfilePage } from './components/ProfilePage';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

function App() {
  const { state } = useFinance();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (state.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.settings.theme]);

  if (!state.settings.isSetup) {
    return (
      <>
        <Onboarding />
        <Toaster position="bottom-right" toastOptions={{ 
          style: { 
            background: state.settings.theme === 'dark' ? '#1E1E1E' : '#fff', 
            color: state.settings.theme === 'dark' ? '#fff' : '#111827', 
            border: state.settings.theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
          } 
        }} />
      </>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'accounts': return <AccountsPage />;
      case 'transactions': return <TransactionsPage />;
      case 'budget': return <BudgetPlanner />;
      case 'analytics': return <Analytics />;
      case 'profile': return <ProfilePage />;
      default: return <Dashboard />;
    }
  };

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Dashboard';
      case 'accounts': return 'Accounts & Wallets';
      case 'transactions': return 'All Transactions';
      case 'budget': return 'Budget Planner';
      case 'analytics': return 'Analytics & Reports';
      case 'profile': return 'Profile & Settings';
      default: return 'Dashboard';
    }
  };

  const TABS = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'accounts', label: 'Wallets', icon: Wallet },
    { id: 'transactions', label: 'Txns', icon: ReceiptText },
    { id: 'budget', label: 'Budget', icon: PieChart },
    { id: 'analytics', label: 'Stats', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 text-gray-900 dark:text-white flex overflow-hidden transition-colors duration-300">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative pb-24 md:pb-0">
        <Header title={getTitle()} />
        
        <div className="p-4 md:p-8 flex-1 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-gold-500 hover:bg-gold-400 text-navy-900 rounded-full shadow-[0_10px_30px_rgba(245,166,35,0.4)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-navy-900 border-t border-gray-200 dark:border-white/10 flex justify-around items-center p-2 pb-safe z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors duration-300">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-gold-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-md' : ''} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-gold-600 dark:text-gold-400' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <Toaster position="top-center" 
        toastOptions={{
          duration: 3000,
          style: {
            background: state.settings.theme === 'dark' ? '#1E1E1E' : '#fff',
            color: state.settings.theme === 'dark' ? '#fff' : '#111827',
            border: state.settings.theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
          }
        }} 
      />
      <VercelAnalytics />
    </div>
  );
}

export default App;
