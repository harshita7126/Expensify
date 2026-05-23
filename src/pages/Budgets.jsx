import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Wallet, Edit2, Sparkles, AlertTriangle } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { calculateBudgetProgress } from '../lib/calculations';
import { cn, formatINR } from '../lib/utils';
import BudgetModal from '../components/BudgetModal';
import EmptyState from '../components/EmptyState';

const bgClassMap = {
  Food: 'bg-blue-500 shadow-blue-500/20',
  Shopping: 'bg-rose-500 shadow-rose-500/20',
  Entertainment: 'bg-purple-500 shadow-purple-500/20',
  Travel: 'bg-emerald-500 shadow-emerald-500/20',
  Bills: 'bg-amber-500 shadow-amber-500/20',
  Health: 'bg-teal-500 shadow-teal-500/20',
  Investment: 'bg-cyan-500 shadow-cyan-500/20',
  Other: 'bg-slate-500 shadow-slate-500/20',
};

const borderClassMap = {
  Food: 'border-blue-500/20 hover:border-blue-500/30',
  Shopping: 'border-rose-500/20 hover:border-rose-500/30',
  Entertainment: 'border-purple-500/20 hover:border-purple-500/30',
  Travel: 'border-emerald-500/20 hover:border-emerald-500/30',
  Bills: 'border-amber-500/20 hover:border-amber-500/30',
  Health: 'border-teal-500/20 hover:border-teal-500/30',
  Investment: 'border-cyan-500/20 hover:border-cyan-500/30',
  Other: 'border-slate-500/20 hover:border-slate-500/30',
};

export default function Budgets() {
  const { user } = useAuthStore();
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState(undefined);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [budgetsRes, expensesRes] = await Promise.all([
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('expenses').select('*').eq('user_id', user.id)
      ]);

      if (budgetsRes.error) {
        console.error('Error fetching budgets:', budgetsRes.error);
      } else if (budgetsRes.data) {
        setBudgets(budgetsRes.data);
      }

      if (expensesRes.error) {
        console.error('Error fetching expenses:', expensesRes.error);
      } else if (expensesRes.data) {
        setExpenses(expensesRes.data);
      }
    } catch (err) {
      console.error('Unexpected error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.resolve().then(() => fetchData());
    }
  }, [user, fetchData]);

  // Filter budgets to only show current month by default
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthBudgets = budgets.filter(b => b.month === currentMonth);

  const handleEdit = (budget) => {
    setBudgetToEdit(budget);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setBudgetToEdit(undefined);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <BudgetModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchData();
        }} 
        budgetToEdit={budgetToEdit}
        existingBudgets={budgets}
      />

      {/* Header Welcomer */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-border/25">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight text-gradient"
            >
              Budgets
            </motion.h1>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground font-medium text-sm md:text-base"
          >
            Manage and control your category limit thresholds.
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCreate}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Wallet className="w-5 h-5" />
          Create Budget Limit
        </motion.button>
      </div>

      {/* Budgets Listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {currentMonthBudgets.map((budget, index) => {
          const { spent, percent, isWarning, isDanger } = calculateBudgetProgress(budget, expenses);

          return (
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (index * 0.08), duration: 0.5 }}
              whileHover={{ y: -4 }}
              key={budget.id}
              className={`glass-card rounded-2xl p-6 relative overflow-hidden group border transition-all duration-300 shadow-sm hover:shadow-md ${borderClassMap[budget.category] || 'border-border/60'}`}
            >
              
              {/* Header and Actions */}
              <div className="flex justify-between items-center mb-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-md ${bgClassMap[budget.category] || 'bg-primary'}`} />
                  <h3 className="font-extrabold text-base text-foreground tracking-tight">{budget.category}</h3>
                </div>
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => handleEdit(budget)} 
                    aria-label="Edit Budget"
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-muted/70 rounded-xl transition-all border border-transparent hover:border-border/30"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {isDanger ? (
                    <AlertCircle className="w-5 h-5 text-danger animate-bounce" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                  ) : null}
                </div>
              </div>

              {/* Spending progress indicator label */}
              <div className="mb-3.5 flex justify-between text-xs font-bold text-muted-foreground">
                <span>Spent: <span className="text-foreground font-extrabold">{formatINR(spent)}</span></span>
                <span>Limit: <span className="text-foreground font-extrabold">{formatINR(budget.amount)}</span></span>
              </div>

              {/* Progress Slider */}
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/20 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percent, 100)}%` }}
                  transition={{ duration: 1.2, delay: 0.4 + (index * 0.08), ease: "easeOut" }}
                  className={`h-full rounded-full relative ${
                    isDanger 
                      ? 'bg-danger shadow-lg shadow-danger/25' 
                      : isWarning 
                        ? 'bg-amber-500 shadow-lg shadow-amber-500/25' 
                        : (bgClassMap[budget.category] || 'bg-primary')
                  }`}
                >
                  {/* Visual stripe glow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%] animate-pulse" />
                </motion.div>
              </div>

              {/* Bottom detail pill */}
              <div className="mt-3.5 flex items-center justify-between">
                <span className={cn(
                  "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border",
                  isDanger 
                    ? "bg-danger/10 text-danger border-danger/20" 
                    : isWarning 
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>
                  {isDanger ? 'Overspent' : isWarning ? 'Warning limit' : 'Under control'}
                </span>
                <span className="text-[11px] font-bold text-muted-foreground/90">
                  {percent.toFixed(0)}% Used
                </span>
              </div>
            </motion.div>
          );
        })}
        {currentMonthBudgets.length === 0 && (
          <div className="col-span-full py-6">
            <EmptyState 
              icon={Wallet}
              title="No Budgets Formed"
              description="Establish spend category caps to trigger subtle progress highlights and custom over-limit notifications."
              actionLabel="Create Spending Limit"
              onAction={handleCreate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
