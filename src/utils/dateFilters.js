import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  format
} from 'date-fns';

export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

export function getPeriodDates(period, customStart = '', customEnd = '') {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'this-month':
      return { 
        start: startOfMonth(today), 
        end: endOfMonth(today), 
        label: format(today, 'MMMM yyyy') 
      };
    case 'last-month':
      const lastMonth = subMonths(today, 1);
      return { 
        start: startOfMonth(lastMonth), 
        end: endOfMonth(lastMonth), 
        label: format(lastMonth, 'MMMM yyyy') 
      };
    case 'this-week':
      const startW = startOfWeek(today, { weekStartsOn: 1 });
      const endW = endOfWeek(today, { weekStartsOn: 1 });
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
      const s = customStart ? parseLocalDate(customStart) : new Date(0);
      const e = customEnd ? parseLocalDate(customEnd) : new Date(2999, 11, 31);
      return { 
        start: s, 
        end: e, 
        label: customStart && customEnd 
          ? `${format(s, 'MMM d, yyyy')} - ${format(e, 'MMM d, yyyy')}` 
          : 'Custom Period' 
      };
    default:
      return { 
        start: startOfMonth(today), 
        end: endOfMonth(today), 
        label: format(today, 'MMMM yyyy') 
      };
  }
}

export function isTransactionInPeriod(tDateStr, period, customStart = '', customEnd = '') {
  try {
    if (!tDateStr) return true;
    const targetDate = parseLocalDate(tDateStr);
    const { start, end } = getPeriodDates(period, customStart, customEnd);
    
    const targetTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).getTime();
    
    return targetTime >= startTime && targetTime <= endTime;
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
      const budgetDate = budget.startDate ? parseLocalDate(budget.startDate) : now;
      startDate = startOfMonth(budgetDate);
      endDate = endOfMonth(budgetDate);
    } else if (budget.period === 'weekly') {
      const budgetDate = budget.startDate ? parseLocalDate(budget.startDate) : now;
      startDate = startOfWeek(budgetDate, { weekStartsOn: 1 });
      endDate = endOfWeek(budgetDate, { weekStartsOn: 1 });
    } else if (budget.period === 'custom') {
      startDate = budget.startDate ? parseLocalDate(budget.startDate) : now;
      endDate = budget.endDate ? parseLocalDate(budget.endDate) : now;
    } else {
      startDate = new Date(0);
      endDate = new Date(2999, 11, 31);
    }

    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);

    const hasEnded = today > endDay;

    const spending = transactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .filter(t => {
        const tDate = parseLocalDate(t.date);
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
