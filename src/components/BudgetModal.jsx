import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../store/useNotificationStore';

const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Investment', 'Other'];

const monthsList = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const yearsList = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString()); // Generates years around current year

export default function BudgetModal({ isOpen, onClose, budgetToEdit, existingBudgets = [] }) {
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(5, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().toISOString().slice(0, 4));

  const [prevBudgetToEditId, setPrevBudgetToEditId] = useState(null);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  const currentBudgetId = budgetToEdit ? budgetToEdit.id : null;

  if (currentBudgetId !== prevBudgetToEditId || isOpen !== prevIsOpen) {
    setPrevBudgetToEditId(currentBudgetId);
    setPrevIsOpen(isOpen);

    if (budgetToEdit) {
      setCategory(budgetToEdit.category);
      setAmount(budgetToEdit.amount.toString());
      const [yr, mo] = budgetToEdit.month.split('-');
      setSelectedYear(yr || new Date().toISOString().slice(0, 4));
      setSelectedMonth(mo || new Date().toISOString().slice(5, 7));
    } else {
      // Reset
      setCategory('Food');
      setAmount('');
      setSelectedYear(new Date().toISOString().slice(0, 4));
      setSelectedMonth(new Date().toISOString().slice(5, 7));
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      useNotificationStore.getState().addToast('You must be logged in to configure budgets.', 'error');
      return;
    }

    const targetMonth = `${selectedYear}-${selectedMonth}`;

    // Validation: prevent duplicate budget categories in the same target month
    const exists = existingBudgets.some(b => b.category === category && b.month === targetMonth && (!budgetToEdit || b.id !== budgetToEdit.id));
    
    if (exists) {
      useNotificationStore.getState().addToast(`A budget for ${category} already exists for this month!`, 'error');
      return;
    }

    const budgetAmount = parseFloat(amount);

    try {
      if (budgetToEdit) {
        // Update existing budget
        const { error } = await supabase
          .from('budgets')
          .update({ amount: budgetAmount })
          .eq('id', budgetToEdit.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating budget:', error);
          useNotificationStore.getState().addToast(`Failed to update budget: ${error.message}`, 'error');
          return;
        }

        useNotificationStore.getState().addToast(`Updated budget for ${category}`, 'success');
        useNotificationStore.getState().addNotification({
          title: 'Budget Updated',
          message: `Updated your ${category} budget limit to ₹${budgetAmount.toFixed(2)}.`,
          type: 'success',
        });
      } else {
        // Create new budget
        const { error } = await supabase
          .from('budgets')
          .insert([{
            user_id: user.id,
            category,
            amount: budgetAmount,
            month: targetMonth
          }]);

        if (error) {
          console.error('Error creating budget:', error);
          useNotificationStore.getState().addToast(`Failed to create budget: ${error.message}`, 'error');
          return;
        }

        useNotificationStore.getState().addToast(`Created budget for ${category}`, 'success');
        useNotificationStore.getState().addNotification({
          title: 'Budget Created',
          message: `Set a new spending limit of ₹${budgetAmount.toFixed(2)} for ${category}.`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Unexpected error setting budget:', err);
      useNotificationStore.getState().addToast('An unexpected error occurred.', 'error');
      return;
    }
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-screen h-screen min-h-screen bg-background/80 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[10000] p-6 glass-card rounded-2xl shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{budgetToEdit ? 'Edit Budget' : 'Set Budget'}</h2>
              <button onClick={onClose} aria-label="Close modal" className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="budget-category" className="block text-sm font-medium mb-1">Category</label>
                <select
                  id="budget-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={!!budgetToEdit} // Cannot change category of existing budget easily, create new instead
                  aria-label="Category"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer disabled:opacity-50"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="budget-amount" className="block text-sm font-medium mb-1">Limit Amount (₹)</label>
                <input
                  required
                  id="budget-amount"
                  type="number"
                  step="1"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="e.g. 5000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budget-month" className="block text-sm font-medium mb-1">Month</label>
                  <select
                    id="budget-month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    disabled={!!budgetToEdit}
                    aria-label="Select Target Month"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer disabled:opacity-50"
                  >
                    {monthsList.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="budget-year" className="block text-sm font-medium mb-1">Year</label>
                  <select
                    id="budget-year"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    disabled={!!budgetToEdit}
                    aria-label="Select Target Year"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer disabled:opacity-50"
                  >
                    {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium shadow-lg shadow-primary/25 mt-6 hover:bg-primary/90 transition-colors"
              >
                {budgetToEdit ? 'Update Budget' : 'Save Budget'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
