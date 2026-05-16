import React, { createContext, useContext, useReducer, useEffect } from 'react';

const FinanceContext = createContext();

const initialState = {
  transactions: [],
  budgets: {}, // { categoryId: { amount, accountId } }
  accounts: [], // { id, name, type, initialBalance }
  settings: {
    theme: 'dark',
    currency: '₹',
    userName: '',
    isSetup: false,
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
    case 'SET_BUDGET':
      return { 
        ...state, 
        budgets: { 
          ...state.budgets, 
          [action.payload.category]: { 
            amount: action.payload.amount, 
            accountId: action.payload.accountId 
          } 
        } 
      };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...(state.accounts || []), action.payload] };
    case 'EDIT_ACCOUNT':
      return { ...state, accounts: (state.accounts || []).map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: (state.accounts || []).filter(a => a.id !== action.payload) };
    case 'UPDATE_PROFILE':
      return { ...state, settings: { ...state.settings, userName: action.payload.name, currency: action.payload.currency } };
    case 'LOGOUT':
      return { ...state, settings: { ...state.settings, isSetup: false } };
    case 'RESET_APP':
      localStorage.removeItem('finance_data');
      return initialState;
    case 'LOAD_DATA':
      return { 
        ...state, 
        ...action.payload,
        accounts: action.payload.accounts || [],
        settings: {
          ...state.settings,
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
