import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { generateCoachInsights } from '../utils/coachHeuristics';
import { Sparkles, AlertTriangle, Award, Flame, Brain, ChevronLeft, ChevronRight, Compass } from 'lucide-react';

export function CoachInsights({ setCurrentTab }) {
  const { state } = useFinance();
  const currency = state.settings.currency;
  
  const insights = useMemo(() => {
    return generateCoachInsights(state.transactions, state.budgets, state.accounts, currency);
  }, [state.transactions, state.budgets, state.accounts, currency]);

  const [activeIndex, setActiveIndex] = useState(0);

  const activeInsight = insights[activeIndex] || insights[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % insights.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  if (insights.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'streak': return <Flame size={20} className="text-orange-500 animate-pulse" />;
      case 'alert': return <AlertTriangle size={20} className="text-rose-500 animate-bounce" />;
      case 'achievement': return <Award size={20} className="text-emerald-500" />;
      case 'pattern': return <Brain size={20} className="text-amber-500" />;
      default: return <Sparkles size={20} className="text-gold-500" />;
    }
  };

  const getColorClasses = (color) => {
    switch (color) {
      case 'rose':
        return 'from-rose-500/10 to-transparent border-rose-500/20 text-rose-700 dark:text-rose-400';
      case 'amber':
        return 'from-amber-500/10 to-transparent border-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'emerald':
        return 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-700 dark:text-emerald-400';
      default:
        return 'from-gold-500/10 to-transparent border-gold-500/20 text-gold-700 dark:text-gold-400';
    }
  };

  return (
    <div className="glass p-5 rounded-2xl bg-gradient-to-tr from-navy-950 via-charcoal-900 to-navy-900 border border-gold-500/10 relative overflow-hidden group hover:border-gold-500/20 transition-all duration-300">
      {/* Dynamic light glow in background */}
      <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full bg-gold-500/5 blur-3xl group-hover:bg-gold-500/10 transition-colors"></div>
      
      {/* Top Banner Indicator */}
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
            </div>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gold-400 font-sans">
              PayTrix Coach Online
            </span>
          </div>
          {setCurrentTab && (
            <button 
              onClick={() => setCurrentTab('forecaster')}
              className="px-2.5 py-1 bg-gold-500/10 hover:bg-gold-500 text-gold-500 hover:text-navy-900 border border-gold-500/20 hover:border-gold-500 rounded-lg text-[10px] font-bold transition-all duration-300 flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            >
              <Compass size={12} className="animate-spin-slow" />
              <span>Cash Forecaster</span>
            </button>
          )}
        </div>
        
        {insights.length > 1 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={handlePrev}
              className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[10px] font-mono text-gray-500 font-bold">
              {activeIndex + 1}/{insights.length}
            </span>
            <button 
              onClick={handleNext}
              className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Slide Body */}
      <div className={`relative min-h-[90px] flex items-start gap-4 transition-all duration-300 animate-in fade-in slide-in-from-right-4 duration-300`}>
        <div className={`p-3 rounded-xl shrink-0 bg-white/5 border border-white/10`}>
          {getIcon(activeInsight.type)}
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white leading-tight">
              {activeInsight.title}
            </h4>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border bg-gradient-to-r ${getColorClasses(activeInsight.color)}`}>
              {activeInsight.badge}
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            {activeInsight.description}
          </p>
        </div>
      </div>
    </div>
  );
}
