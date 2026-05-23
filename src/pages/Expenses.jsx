import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, ArrowDownRight, Edit2, Trash2, Calendar, CreditCard, Sparkles, ChevronDown, Receipt } from 'lucide-react';
import { format } from 'date-fns';

import { cn, formatINR } from '../lib/utils';
import ExpenseModal from '../components/ExpenseModal';
import EmptyState from '../components/EmptyState';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';

const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Investment', 'Other'];

const badgeStyles = {
  Food: 'bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400',
  Shopping: 'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400',
  Entertainment: 'bg-purple-500/10 text-purple-500 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400',
  Travel: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400',
  Bills: 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400',
  Health: 'bg-teal-500/10 text-teal-500 border-teal-500/20 dark:bg-teal-500/20 dark:text-teal-400',
  Investment: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-400',
  Other: 'bg-slate-500/10 text-slate-500 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400',
};

export default function Expenses() {
  const { user } = useAuthStore();
  const { addToast, addNotification } = useNotificationStore();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterOverflow, setFilterOverflow] = useState('hidden');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);

  // Close dropdowns on document click away
  useEffect(() => {
    const handleDocumentClick = () => {
      setIsCategoryDropdownOpen(false);
      setIsPaymentDropdownOpen(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // State for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(undefined);

  const fetchExpenses = useCallback(async (showLoading = false) => {
    if (!user) return;
    if (showLoading) {
      // Set state asynchronously to avoid synchronous setState inside an effect
      Promise.resolve().then(() => setIsLoading(true));
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
      } else if (data) {
        setExpenses(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.resolve().then(() => fetchExpenses(true));
    }
  }, [user, fetchExpenses]);


  const handleEdit = (expense) => {
    setExpenseToEdit(expense);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setExpenseToEdit(undefined);
    setIsModalOpen(true);
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;
    const matchesPayment = selectedPaymentMethod === 'All' || exp.payment_method === selectedPaymentMethod;

    return matchesSearch && matchesCategory && matchesPayment;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchExpenses();
        }}
        expenseToEdit={expenseToEdit}
      />

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-border/25">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight text-gradient"
            >
              Expenses
            </motion.h1>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground font-medium text-sm md:text-base"
          >
            View, search, and manage your expenses in one place.
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAdd}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add New Expense
        </motion.button>
      </div>

      {/* Core Table List Card */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px] glass-card rounded-2xl border border-border/80 shadow-md bg-card/45">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="py-8">
          <EmptyState
            icon={Receipt}
            title="No Transactions Logged"
            description="Initiate your budget tracking system by logging your very first expense. It takes under a minute."
            actionLabel="Log Your First Expense"
            onAction={handleAdd}
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass-card rounded-2xl overflow-hidden border border-border/80 shadow-md bg-card/45"
        >

          {/* Search & Filter Top Panel */}
          <div className="p-5 border-b border-border/20 flex flex-col gap-4 bg-card/20">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center w-full">
              <div className="relative w-full sm:max-w-md flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
                <input
                  type="text"
                  placeholder="Search expenses by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-foreground placeholder:text-muted-foreground/75"
                />
              </div>
              <button
                onClick={() => {
                  if (isFilterVisible) {
                    setFilterOverflow('hidden');
                    setIsFilterVisible(false);
                  } else {
                    setIsFilterVisible(true);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 border rounded-xl text-xs font-bold transition-all w-full sm:w-auto justify-center cursor-pointer shadow-sm",
                  isFilterVisible || selectedCategory !== 'All' || selectedPaymentMethod !== 'All'
                    ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                    : "bg-background border-border hover:bg-muted text-foreground"
                )}
              >
                <Filter className="w-4 h-4" />
                Filter Transactions
                {(selectedCategory !== 'All' || selectedPaymentMethod !== 'All') && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                )}
              </button>
            </div>

            <AnimatePresence>
              {isFilterVisible && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  onAnimationComplete={() => {
                    if (isFilterVisible) {
                      setFilterOverflow('visible');
                    }
                  }}
                  className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-4 border-t border-border/20 text-foreground",
                    filterOverflow === 'hidden' ? "overflow-hidden" : "overflow-visible"
                  )}
                >
                  <div>
                    <span className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-2">Category</span>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                          setIsPaymentDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 outline-none cursor-pointer text-foreground transition-all duration-200"
                      >
                        <span>{selectedCategory === 'All' ? 'All Categories' : selectedCategory}</span>
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground/80 transition-transform duration-200", isCategoryDropdownOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isCategoryDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 mt-2 opaque-card rounded-2xl shadow-xl overflow-hidden z-30 p-1.5 max-h-60 overflow-y-auto custom-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory('All');
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                selectedCategory === 'All'
                                  ? "bg-primary/10 text-primary font-extrabold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/65"
                              )}
                            >
                              All Categories
                            </button>
                            {categories.map(c => (
                              <button
                                type="button"
                                key={c}
                                onClick={() => {
                                  setSelectedCategory(c);
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                  selectedCategory === c
                                    ? "bg-primary/10 text-primary font-extrabold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/65"
                                )}
                              >
                                {c}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-2">Payment Method</span>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPaymentDropdownOpen(!isPaymentDropdownOpen);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 outline-none cursor-pointer text-foreground transition-all duration-200"
                      >
                        <span>{selectedPaymentMethod === 'All' ? 'All Methods' : selectedPaymentMethod}</span>
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground/80 transition-transform duration-200", isPaymentDropdownOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isPaymentDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 mt-2 opaque-card rounded-2xl shadow-xl overflow-hidden z-30 p-1.5 max-h-60 overflow-y-auto custom-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {['All', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash'].map(m => (
                              <button
                                type="button"
                                key={m}
                                onClick={() => {
                                  setSelectedPaymentMethod(m);
                                  setIsPaymentDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                  selectedPaymentMethod === m
                                    ? "bg-primary/10 text-primary font-extrabold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/65"
                                )}
                              >
                                {m === 'All' ? 'All Methods' : m}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSelectedPaymentMethod('All');
                      }}
                      disabled={selectedCategory === 'All' && selectedPaymentMethod === 'All'}
                      className="w-full py-2.5 border border-dashed border-border/60 hover:border-danger/40 hover:bg-danger/5 rounded-xl text-xs font-extrabold hover:text-danger disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-border/60 disabled:hover:text-muted-foreground transition-all duration-200 cursor-pointer text-muted-foreground flex items-center justify-center gap-1.5"
                    >
                      Reset Active Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Transaction Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
              <thead className="bg-muted/30 text-muted-foreground border-b border-border/20">
                <tr>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-wider text-center w-24">Actions</th>
                </tr>
              </thead>
              <motion.tbody
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-border/15"
              >
                {filteredExpenses.map((expense) => (
                  <motion.tr
                    variants={rowVariants}
                    key={expense.id}
                    className="hover:bg-muted/30 border-l-2 border-l-transparent hover:border-l-primary hover:translate-x-0.5 transition-all duration-200 group cursor-pointer"
                  >
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center text-danger group-hover:bg-danger/20 transition-all duration-300">
                          <ArrowDownRight className="w-5 h-5 group-hover:scale-115 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                        </div>
                        <span className="font-extrabold text-sm text-foreground">{expense.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-extrabold border shadow-sm transition-all",
                        badgeStyles[expense.category] || 'bg-muted border-border/20 text-muted-foreground'
                      )}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-muted-foreground/85 font-semibold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-muted-foreground/85 font-semibold text-xs">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 opacity-60" />
                        {expense.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right font-extrabold text-sm text-danger">
                      -{formatINR(expense.amount)}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(expense)}
                          aria-label="Edit Expense"
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg hover:scale-110 active:scale-95 transition-all"
                        >
                          <Edit2 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this expense?')) {
                              try {
                                const { error } = await supabase
                                  .from('expenses')
                                  .delete()
                                  .eq('id', expense.id)
                                  .eq('user_id', user.id);
                                if (error) {
                                  console.error('Error deleting expense:', error);
                                  addToast('Error deleting expense', 'error');
                                } else {
                                  addToast(`Deleted expense: ${expense.title}`, 'info');
                                  addNotification({
                                    title: 'Expense Deleted',
                                    message: `Removed expense "${expense.title}" for ₹${expense.amount}.`,
                                    type: 'info',
                                  });
                                  fetchExpenses();
                                }
                              } catch (err) {
                                console.error('Unexpected error deleting expense:', err);
                                addToast('Error deleting expense', 'error');
                              }
                            }
                          }}
                          aria-label="Delete Expense"
                          className="p-2 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg hover:scale-110 active:scale-95 transition-all"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <EmptyState
                        icon={Search}
                        title="No Search Matches Found"
                        description="Your current search query or filter selections did not yield any results. Try relaxing your parameters."
                        actionLabel="Reset All Active Filters"
                        onAction={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                          setSelectedPaymentMethod('All');
                        }}
                      />
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
