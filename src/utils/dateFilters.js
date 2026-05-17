import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  parseISO,
  format
} from 'date-fns';

export function getPeriodDates(period, customStart = '', customEnd = '') {
  const now = new Date();
  
  switch (period) {
    case 'this-month':
      return { 
        start: startOfMonth(now), 
        end: endOfMonth(now), 
        label: format(now, 'MMMM yyyy') 
      };
    case 'last-month':
      const lastMonth = subMonths(now, 1);
      return { 
        start: startOfMonth(lastMonth), 
        end: endOfMonth(lastMonth), 
        label: format(lastMonth, 'MMMM yyyy') 
      };
    case 'this-week':
      const startW = startOfWeek(now, { weekStartsOn: 1 });
      const endW = endOfWeek(now, { weekStartsOn: 1 });
      return { 
        start: startW, 
        end: endW, 
        label: `${format(startW, 'MMM d')} - ${format(endW, 'MMM d')}` 
      };
    case 'all-time':
      return { 
        start: new Date(0), 
        end: new Date(2999, 11, 31), 
        label: 'All Time' 
      };
    case 'custom':
      const s = customStart ? parseISO(customStart) : new Date(0);
      const e = customEnd ? parseISO(customEnd) : new Date(2999, 11, 31);
      return { 
        start: s, 
        end: e, 
        label: customStart && customEnd 
          ? `${format(s, 'MMM d, yyyy')} - ${format(e, 'MMM d, yyyy')}` 
          : 'Custom Period' 
      };
    default:
      return { 
        start: startOfMonth(now), 
        end: endOfMonth(now), 
        label: format(now, 'MMMM yyyy') 
      };
  }
}

export function isTransactionInPeriod(tDateStr, period, customStart = '', customEnd = '') {
  try {
    const { start, end } = getPeriodDates(period, customStart, customEnd);
    const date = parseISO(tDateStr);
    
    // Normalize date to start of day for comparison
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);
    
    return targetDate >= startDate && targetDate <= endDate;
  } catch (err) {
    console.error("Error filtering date:", err);
    return true;
  }
}

export function getBudgetStatus(budget, transactions) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let startDate, endDate;
  
  try {
    if (budget.period === 'monthly') {
      const budgetDate = budget.startDate ? parseISO(budget.startDate) : now;
      startDate = startOfMonth(budgetDate);
      endDate = endOfMonth(budgetDate);
    } else if (budget.period === 'weekly') {
      const budgetDate = budget.startDate ? parseISO(budget.startDate) : now;
      startDate = startOfWeek(budgetDate, { weekStartsOn: 1 });
      endDate = endOfWeek(budgetDate, { weekStartsOn: 1 });
    } else if (budget.period === 'custom') {
      startDate = budget.startDate ? parseISO(budget.startDate) : now;
      endDate = budget.endDate ? parseISO(budget.endDate) : now;
    } else {
      // ongoing / no date
      startDate = new Date(0);
      endDate = new Date(2999, 11, 31);
    }

    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);

    const hasEnded = today > endDay;

    const spending = transactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .filter(t => {
        const tDate = parseISO(t.date);
        const targetDate = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
        return targetDate >= startDay && targetDate <= endDay;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      hasEnded,
      startDate: startDay,
      endDate: endDay,
      spent: spending,
      saved: budget.amount - spending,
      exceeded: spending - budget.amount,
      percentage: budget.amount > 0 ? (spending / budget.amount) * 100 : 0
    };
  } catch (err) {
    console.error("Error calculating budget status:", err);
    return {
      hasEnded: false,
      startDate: now,
      endDate: now,
      spent: 0,
      saved: budget.amount,
      exceeded: 0,
      percentage: 0
    };
  }
}
