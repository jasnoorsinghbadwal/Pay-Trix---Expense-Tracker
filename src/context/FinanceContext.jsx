import React, { createContext, useContext, useReducer, useEffect } from 'react';

const FinanceContext = createContext();

const initialState = {
  transactions: [],
  budgets: [], // Array of { id, category, amount, accountId, period, startDate, endDate, dismissed }
  accounts: [], // { id, name, type, initialBalance }
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
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    
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

    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...(state.accounts || []), action.payload] };
    case 'EDIT_ACCOUNT':
      return { ...state, accounts: (state.accounts || []).map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: (state.accounts || []).filter(a => a.id !== action.payload) };
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
  return useContext(FinanceContext);
}
