import { Coffee, Car, Home, HeartPulse, Gamepad2, ShoppingBag, Briefcase, Sparkles, Receipt, GraduationCap, Target, TrendingUp } from 'lucide-react';

export const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: Coffee, color: '#F5A623' },
  { id: 'transport', label: 'Transport', icon: Car, color: '#3B82F6' },
  { id: 'housing', label: 'Housing', icon: Home, color: '#10B981' },
  { id: 'health', label: 'Health', icon: HeartPulse, color: '#EF4444' },
  { id: 'entertainment', label: 'Entertainment', icon: Gamepad2, color: '#8B5CF6' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#EC4899' },
  { id: 'bills', label: 'Bills & Utilities', icon: Receipt, color: '#06B6D4' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: '#F43F5E' },
  { id: 'savings', label: 'Savings Goals', icon: Target, color: '#10B981' },
  { id: 'investment', label: 'Investments', icon: TrendingUp, color: '#6366F1' },
  { id: 'income', label: 'Salary/Income', icon: Briefcase, color: '#10B981' },
  { id: 'other', label: 'Others', icon: Sparkles, color: '#6B7280' },
];

export const getCategory = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES.find(c => c.id === 'other');
