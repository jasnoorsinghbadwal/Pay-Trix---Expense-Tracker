import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { User, Download, LogOut, Check, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { state, dispatch } = useFinance();
  const [name, setName] = useState(state.settings.userName);
  const [currency, setCurrency] = useState(state.settings.currency);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

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
    downloadAnchorNode.setAttribute("download", "fintrack_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Data exported as JSON');
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

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full pb-4 max-w-4xl mx-auto">
      <div className="glass p-5 md:p-6 rounded-2xl flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gold-500 to-amber-300 flex items-center justify-center text-navy-900 shadow-lg shadow-gold-500/20 shrink-0">
          <User size={32} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-1 text-gray-900 dark:text-white">Profile & Settings</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your personal preferences and data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        {/* Profile Settings */}
        <div className="glass p-5 md:p-6 rounded-2xl h-fit">
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

        {/* Data & Security */}
        <div className="space-y-6 md:space-y-8">
          <div className="glass p-5 md:p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Export Data</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Download a copy of all your transactions, budgets, and accounts as a JSON file for backup.</p>
            <button 
              onClick={downloadJSON}
              className="w-full py-3.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-white/5"
            >
              <Download size={18} /> Download Backup
            </button>
          </div>

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
    </div>
  );
}
