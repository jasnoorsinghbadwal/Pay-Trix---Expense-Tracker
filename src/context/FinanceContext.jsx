import React, { createContext, useContext, useReducer, useEffect } from 'react';

const FinanceContext = createContext();

const initialState = {
  transactions: [],
  budgets: [], // Array of { id, category, amount, accountId, period, startDate, endDate, dismissed }
  accounts: [], // { id, name, type, initialBalance }
  goals: [], // Array of { id, name, targetAmount, currentAmount, category, color, deadline, history: [] }
  subscriptions: [], // Array of { id, name, amount, accountId, billingCycle, nextBillingDate, category, active }
  settings: {
    theme: 'dark',
    currency: '₹',
    userName: '',
    isSetup: false,
    selectedPeriod: 'this-month', // 'this-month', 'last-month', 'this-week', 'all-time', 'custom'
    customStartDate: '',
    customEndDate: '',
    appLock: null
  }
};

function financeReducer(state, action) {
  switch (action.type) {
    case 'COMPLETE_ONBOARDING':
      return { 
        ...state, 
        settings: { 
          ...state.settings, 
          isSetup: true, 
          userName: action.payload.name, 
          currency: action.payload.currency 
        } 
      };
    case 'TOGGLE_THEME':
      return { ...state, settings: { ...state.settings, theme: state.settings.theme === 'dark' ? 'light' : 'dark' } };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'EDIT_TRANSACTION':
      return { 
        ...state, 
        transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t) 
      };
    case 'DELETE_TRANSACTION': {
      const deletedTxnId = action.payload;
      const targetTxn = state.transactions.find(t => t.id === deletedTxnId);
      let updatedSubs = state.subscriptions || [];

      if (targetTxn && targetTxn.subscriptionId) {
        updatedSubs = updatedSubs.map(sub => {
          if (sub.id === targetTxn.subscriptionId) {
            const currentBillingDate = new Date(sub.nextBillingDate);
            if (sub.billingCycle === 'monthly') {
              currentBillingDate.setMonth(currentBillingDate.getMonth() - 1);
            } else {
              currentBillingDate.setFullYear(currentBillingDate.getFullYear() - 1);
            }
            const rolledBackDate = currentBillingDate.toISOString().split('T')[0];

            const remainingTxns = state.transactions
              .filter(t => t.id !== deletedTxnId && t.subscriptionId === sub.id)
              .sort((a, b) => b.date.localeCompare(a.date));
            
            let newPaidUntil = '';
            if (remainingTxns.length > 0) {
              newPaidUntil = remainingTxns[0].date;
            }

            return {
              ...sub,
              nextBillingDate: rolledBackDate,
              paidUntil: newPaidUntil
            };
          }
          return sub;
        });
      }

      return { 
        ...state, 
        transactions: state.transactions.filter(t => t.id !== deletedTxnId),
        subscriptions: updatedSubs
      };
    }
    
    // Modernized Budget Actions
    case 'ADD_BUDGET':
      return { 
        ...state, 
        budgets: [...state.budgets, action.payload] 
      };
    case 'EDIT_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b => b.id === action.payload.id ? action.payload : b)
      };
    case 'DELETE_BUDGET':
      return { 
        ...state, 
        budgets: state.budgets.filter(b => b.id !== action.payload) 
      };
    case 'DISMISS_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b => b.id === action.payload ? { ...b, dismissed: true } : b)
      };

    case 'ADD_SUBSCRIPTION':
      return { ...state, subscriptions: [...(state.subscriptions || []), action.payload] };
    case 'EDIT_SUBSCRIPTION':
      return { ...state, subscriptions: (state.subscriptions || []).map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SUBSCRIPTION':
      return { ...state, subscriptions: (state.subscriptions || []).filter(s => s.id !== action.payload) };

    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...(state.accounts || []), action.payload] };
    case 'EDIT_ACCOUNT':
      return { ...state, accounts: (state.accounts || []).map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: (state.accounts || []).filter(a => a.id !== action.payload) };
    
    // Goals Reducer Actions
    case 'ADD_GOAL':
      return { ...state, goals: [...(state.goals || []), action.payload] };
    case 'EDIT_GOAL':
      return { ...state, goals: (state.goals || []).map(g => g.id === action.payload.id ? action.payload : g) };
    case 'DELETE_GOAL':
      return { ...state, goals: (state.goals || []).filter(g => g.id !== action.payload) };
    case 'CONTRIBUTE_TO_GOAL':
      return {
        ...state,
        goals: (state.goals || []).map(g => {
          if (g.id === action.payload.goalId) {
            return {
              ...g,
              currentAmount: g.currentAmount + action.payload.amount,
              history: [
                ...(g.history || []),
                { id: `log-${Date.now()}`, type: 'contribution', amount: action.payload.amount, date: action.payload.date }
              ]
            };
          }
          return g;
        })
      };
    case 'WITHDRAW_FROM_GOAL':
      return {
        ...state,
        goals: (state.goals || []).map(g => {
          if (g.id === action.payload.goalId) {
            return {
              ...g,
              currentAmount: Math.max(0, g.currentAmount - action.payload.amount),
              history: [
                ...(g.history || []),
                { id: `log-${Date.now()}`, type: 'withdrawal', amount: action.payload.amount, date: action.payload.date }
              ]
            };
          }
          return g;
        })
      };

    case 'UPDATE_PROFILE':
      return { 
        ...state, 
        settings: { 
          ...state.settings, 
          userName: action.payload.name !== undefined ? action.payload.name : state.settings.userName, 
          currency: action.payload.currency !== undefined ? action.payload.currency : state.settings.currency,
          appLock: action.payload.appLock !== undefined ? action.payload.appLock : state.settings.appLock
        } 
      };
    case 'LOGOUT':
      return { ...state, settings: { ...state.settings, isSetup: false } };
    case 'RESET_APP':
      localStorage.removeItem('finance_data');
      return initialState;
    
    case 'SET_PERIOD':
      return {
        ...state,
        settings: {
          ...state.settings,
          selectedPeriod: action.payload.period,
          customStartDate: action.payload.startDate || '',
          customEndDate: action.payload.endDate || ''
        }
      };

    case 'LOAD_DATA':
      let parsedBudgets = [];
      if (action.payload.budgets) {
        if (Array.isArray(action.payload.budgets)) {
          parsedBudgets = action.payload.budgets;
        } else {
          // Convert legacy object budget to array
          parsedBudgets = Object.keys(action.payload.budgets).map((catId, idx) => {
            const val = action.payload.budgets[catId];
            return {
              id: `legacy-${catId}-${idx}-${Date.now()}`,
              category: catId,
              amount: typeof val === 'object' ? val.amount : val,
              accountId: typeof val === 'object' ? val.accountId : '',
              period: 'monthly',
              startDate: new Date().toISOString().split('T')[0],
              endDate: '',
              dismissed: false
            };
          });
        }
      }
      return { 
        ...state, 
        ...action.payload,
        budgets: parsedBudgets,
        accounts: action.payload.accounts || [],
        goals: action.payload.goals || [],
        settings: {
          ...initialState.settings,
          ...(action.payload.settings || {})
        }
      };
    default:
      return state;
  }
}

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('finance_data');
    if (saved) {
      try {
        dispatch({ type: 'LOAD_DATA', payload: JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse local storage data", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('finance_data', JSON.stringify(state));
  }, [state]);

  return (
    <FinanceContext.Provider value={{ state, dispatch }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used within a FinanceProvider");
  
  const { state, dispatch } = context;

  // Enrich goals with dynamic live calculations in real-time
  const enrichedGoals = React.useMemo(() => {
    return (state.goals || []).map(g => {
      // Check if there is an initial allocation transaction for this goal
      const hasInitTx = (state.transactions || []).some(t => t.goalId === g.id && t.title.toLowerCase().includes('allocation'));
      
      let current = hasInitTx ? 0 : (parseFloat(g.initialAmount) || 0);
      
      (state.transactions || []).forEach(t => {
        if (t.goalId === g.id) {
          if (t.type === 'income') {
            current -= t.amount;
          } else {
            current += t.amount;
          }
        }
      });
      const currentAmount = Math.max(0, current);

      // Recurring Status calculation
      let recurringStatus = null;
      if (g.isRecurring) {
        const now = new Date();
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);
        
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        
        const contributions = (state.transactions || []).filter(t => t.goalId === g.id && t.type === 'expense');
        let currentPeriodContributions = [];
        let periodName = '';
        
        if (g.recurringFrequency === 'weekly') {
          periodName = 'this week';
          currentPeriodContributions = contributions.filter(t => new Date(t.date) >= startOfWeek);
        } else if (g.recurringFrequency === 'monthly') {
          periodName = 'this month';
          currentPeriodContributions = contributions.filter(t => new Date(t.date) >= startOfMonth);
        } else if (g.recurringFrequency === 'yearly') {
          periodName = 'this year';
          currentPeriodContributions = contributions.filter(t => new Date(t.date) >= startOfYear);
        } else {
          periodName = 'recently';
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          currentPeriodContributions = contributions.filter(t => new Date(t.date) >= thirtyDaysAgo);
        }
        
        const periodTotal = currentPeriodContributions.reduce((sum, t) => sum + t.amount, 0);
        const needed = parseFloat(g.recurringAmount) || 0;
        recurringStatus = {
          paid: periodTotal >= needed,
          totalContributed: periodTotal,
          needed,
          periodName
        };
      }

      return {
        ...g,
        currentAmount,
        recurringStatus
      };
    });
  }, [state.goals, state.transactions]);

  const enrichedState = React.useMemo(() => {
    return {
      ...state,
      goals: enrichedGoals
    };
  }, [state, enrichedGoals]);

  return { state: enrichedState, dispatch };
}
