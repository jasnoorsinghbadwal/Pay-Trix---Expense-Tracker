import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { User, Download, LogOut, Check, X, AlertTriangle, Upload, Lock, Unlock, RefreshCw } from 'lucide-react';
import { APP_VERSION } from '../version';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { state, dispatch } = useFinance();
  const [name, setName] = useState(state.settings.userName);
  const [currency, setCurrency] = useState(state.settings.currency);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockInput, setLockInput] = useState('');
  const [lockConfirm, setLockConfirm] = useState('');
  const [lockStep, setLockStep] = useState('initial'); // 'initial', 'confirm', 'remove'

  const [updateStatus, setUpdateStatus] = useState('idle'); // 'idle', 'checking', 'latest', 'available', 'error'
  const [checking, setChecking] = useState(false);

  const hasAppLock = !!state.settings.appLock;

  // Handle background scroll lock
  useEffect(() => {
    if (isLogoutModalOpen || isLockModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLogoutModalOpen, isLockModalOpen]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'UPDATE_PROFILE', payload: { name: name.trim(), currency } });
    toast.success('Profile updated successfully');
  };

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "paytrix_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Data exported as JSON');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        
        // Safety schema verification
        if (parsedData && Array.isArray(parsedData.transactions) && Array.isArray(parsedData.accounts)) {
          dispatch({ type: 'LOAD_DATA', payload: parsedData });
          
          if (parsedData.settings) {
            setName(parsedData.settings.userName || '');
            setCurrency(parsedData.settings.currency || '₹');
          }
          
          toast.success('Backup restored successfully!');
        } else {
          toast.error('Invalid backup file structure!');
        }
      } catch (err) {
        toast.error('Failed to parse backup file!');
      }
    };
    fileReader.readAsText(file);
  };

  const handleLogout = (wipeData) => {
    if (wipeData) {
      dispatch({ type: 'RESET_APP' });
      toast.success('All data wiped successfully. Logged out.');
    } else {
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully. Data retained.');
    }
  };

  const handleLockSubmit = (e) => {
    e.preventDefault();
    if (lockStep === 'remove') {
      if (lockInput === state.settings.appLock) {
        dispatch({ type: 'UPDATE_PROFILE', payload: { appLock: null } });
        toast.success('App Lock removed successfully');
        setIsLockModalOpen(false);
        setLockInput('');
      } else {
        toast.error('Incorrect password');
      }
    } else if (lockStep === 'initial') {
      if (!lockInput) return;
      setLockStep('confirm');
    } else if (lockStep === 'confirm') {
      if (lockInput === lockConfirm) {
        dispatch({ type: 'UPDATE_PROFILE', payload: { appLock: lockInput } });
        toast.success('App Lock enabled successfully');
        setIsLockModalOpen(false);
        setLockInput('');
        setLockConfirm('');
        setLockStep('initial');
      } else {
        toast.error('Passwords do not match');
      }
    }
  };

  const openLockModal = () => {
    setLockInput('');
    setLockConfirm('');
    setLockStep(hasAppLock ? 'remove' : 'initial');
    setIsLockModalOpen(true);
  };

  const checkForUpdates = async () => {
    setChecking(true);
    setUpdateStatus('checking');
    try {
      // Append query param to completely bypass CDN caching
      const response = await fetch(`/version.json?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch version metadata');
      const data = await response.json();
      
      if (data && data.version) {
        if (data.version === APP_VERSION) {
          setUpdateStatus('latest');
          toast.success('PayTrix is up to date!');
        } else {
          setUpdateStatus('available');
          toast.success('New update available!');
        }
      } else {
        throw new Error('Invalid version format');
      }
    } catch (error) {
      setUpdateStatus('error');
      toast.error('Could not verify latest version');
      console.error('Update check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleUpdateApp = async () => {
    const loadingToast = toast.loading('Wiping old cache & updating PayTrix...');
    try {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      
      // 2. Clear all cache storages
      if ('caches' in window) {
        const keys = await caches.keys();
        for (let key of keys) {
          await caches.delete(key);
        }
      }

      toast.success('App updated! Relaunching now...', { id: loadingToast });
      
      // 3. Force hard reload from server
      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
    } catch (e) {
      toast.error('Failed to auto-update. Please reload page manually.', { id: loadingToast });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full pb-4 max-w-7xl mx-auto px-2 sm:px-4 md:px-8">
      <div className="glass p-5 md:p-6 rounded-2xl flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gold-500 to-amber-300 flex items-center justify-center text-navy-900 shadow-lg shadow-gold-500/20 shrink-0">
          <User size={32} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-1 text-gray-900 dark:text-white">Profile & Settings</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your personal preferences and data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* Column 1: Personal Settings & Security */}
        <div className="space-y-6 md:space-y-8">
          {/* Profile Settings */}
          <div className="glass p-5 md:p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Personal Info</h3>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Preferred Currency</label>
                <div className="grid grid-cols-4 gap-2">
                  {['₹', '$', '€', '£'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`py-2.5 rounded-xl font-mono text-lg transition-all ${currency === c ? 'bg-gold-500 text-navy-900 font-bold shadow-lg shadow-gold-500/30' : 'bg-gray-50 dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 mt-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} strokeWidth={3} /> Save Changes
              </button>
            </form>
          </div>

          {/* Security */}
          <div className="glass p-5 md:p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Security</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Secure your app with a password or PIN. You will be prompted to enter it whenever you open the app.</p>
            
            <button 
              onClick={openLockModal}
              className={`w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${hasAppLock ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-gold-500 hover:bg-gold-400 text-navy-900 shadow-lg'}`}
            >
              {hasAppLock ? <><Unlock size={18} /> Remove App Lock</> : <><Lock size={18} /> Set App Lock</>}
            </button>
          </div>
        </div>

        {/* Column 2: Backup & Access Control */}
        <div className="space-y-6 md:space-y-8">
          {/* Sync & Backups */}
          <div className="glass p-5 md:p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Sync & Backups</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Keep your data identical across standard browsers and installed home screen PWA versions on this device.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={downloadJSON}
                className="py-3 px-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-white/5 text-sm"
              >
                <Download size={16} /> Export Backup
              </button>
              
              <label 
                className="py-3 px-4 bg-gold-500/10 hover:bg-gold-500/20 text-gold-600 dark:text-gold-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-gold-500/20 dark:border-gold-500/10 cursor-pointer text-sm shadow-sm"
              >
                <Upload size={16} /> Import Backup
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportJSON} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Account Access */}
          <div className="glass p-5 md:p-6 rounded-2xl border border-rose-200 dark:border-rose-500/20">
            <h3 className="text-lg font-semibold mb-2 text-rose-600 dark:text-rose-400">Account Access</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Log out of your current session. You can choose to keep your data locally or wipe it clean.</p>
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full py-3.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Column 3: Help & PWA Version Check */}
        <div className="space-y-6 md:space-y-8">
          {/* Help & Support / Developer Info Card */}
          <div className="glass p-5 md:p-6 rounded-2xl border border-gold-500/20">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white font-sans flex items-center gap-2">
              Help & Support
            </h3>
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 space-y-3">
              <p>
                <strong>PayTrix</strong> is a premium, high-fidelity personal finance tracker and cash-flow forecaster designed to give you complete visibility over your financial operations.
              </p>
              <div className="space-y-1.5 pl-2 border-l border-gold-500/40">
                <p>⚡ <strong>Wallets & Accounts:</strong> Track cash, bank accounts, and cards in real-time.</p>
                <p>📊 <strong>Multi-Dimensional Analytics:</strong> Drill down by Category or Expense Type.</p>
                <p>🎯 <strong>Savings Goals:</strong> Create dedicated allocations and progress counters.</p>
                <p>🔮 <strong>Forecasts & Coaching:</strong> Predictive cash flows and smart insights.</p>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-white/10 text-xs">
                Developed & Engineered with passion by <span className="font-bold text-gold-500 dark:text-gold-400">Jasnoor Singh Badwal</span>
              </div>
            </div>
          </div>

          {/* App Info & Version Checker */}
          <div className="glass p-5 md:p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white font-sans flex items-center gap-2">
              PayTrix Info
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Running Version: <span className="font-mono bg-gray-100 dark:bg-white/5 py-1 px-2.5 rounded-lg text-xs font-semibold select-all text-gray-800 dark:text-gray-300">v1.1.{APP_VERSION.slice(-6)}</span>
            </p>

            {updateStatus === 'available' ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-xl flex items-start gap-2">
                  <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="font-bold">New Version Available!</span> An update has been pushed with bug fixes and premium upgrades. Click below to install it immediately.
                  </div>
                </div>
                <button
                  onClick={handleUpdateApp}
                  className="w-full py-3.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm animate-pulse"
                >
                  <RefreshCw size={16} className="animate-spin" /> Update & Relaunch App
                </button>
              </div>
            ) : (
              <button
                onClick={checkForUpdates}
                disabled={checking}
                className="w-full py-3.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-white/5 text-sm"
              >
                <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
                {checking ? 'Checking server...' : 'Check for Updates'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 dark:bg-navy-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsLogoutModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md glass rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 fade-in duration-300 text-center">
             <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
               <AlertTriangle size={32} />
             </div>
             
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
               You are about to log out. Do you want to keep your data saved on this device for next time, or wipe it completely?
             </p>
             
             <div className="space-y-3">
               <button 
                 onClick={() => handleLogout(false)}
                 className="w-full py-3.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white font-bold rounded-xl transition-all border border-gray-200 dark:border-white/5"
               >
                 Keep Data & Log Out
               </button>
               <button 
                 onClick={() => handleLogout(true)}
                 className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20"
               >
                 Wipe All Data & Log Out
               </button>
               <button 
                 onClick={() => setIsLogoutModalOpen(false)}
                 className="w-full py-3.5 text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
               >
                 Cancel
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Lock Settings Modal */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 dark:bg-navy-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsLockModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md glass rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 fade-in duration-300 text-center">
             <div className="flex justify-end absolute right-4 top-4">
               <button onClick={() => setIsLockModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={20} /></button>
             </div>
             <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-gold-500">
               {hasAppLock ? <Unlock size={32} /> : <Lock size={32} />}
             </div>
             
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
               {lockStep === 'remove' ? 'Remove App Lock' : (lockStep === 'confirm' ? 'Confirm Password' : 'Set App Lock')}
             </h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
               {lockStep === 'remove' 
                 ? 'Enter your current password or PIN to remove the lock.' 
                 : (lockStep === 'confirm' ? 'Please re-enter your password to confirm.' : 'Enter a new password or PIN to secure PayTrix.')}
             </p>
             
             <form onSubmit={handleLockSubmit} className="space-y-4 text-left">
               {lockStep === 'confirm' ? (
                 <div>
                   <input 
                     type="password"
                     value={lockConfirm}
                     onChange={(e) => setLockConfirm(e.target.value)}
                     className="w-full bg-white dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-gray-900 dark:text-white text-center tracking-widest text-lg"
                     autoFocus
                     required
                   />
                 </div>
               ) : (
                 <div>
                   <input 
                     type="password"
                     value={lockInput}
                     onChange={(e) => setLockInput(e.target.value)}
                     className="w-full bg-white dark:bg-charcoal-900 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/50 transition-all text-gray-900 dark:text-white text-center tracking-widest text-lg"
                     autoFocus
                     required
                   />
                 </div>
               )}
               <button 
                 type="submit"
                 className="w-full py-3.5 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl transition-all shadow-lg"
               >
                 {lockStep === 'remove' ? 'Remove Lock' : (lockStep === 'confirm' ? 'Confirm & Set Lock' : 'Continue')}
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
