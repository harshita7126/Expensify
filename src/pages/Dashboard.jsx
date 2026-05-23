import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, IndianRupee, CreditCard, Wallet, ArrowDownRight, Sparkles, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import {
  calculateMonthlyExpenses
} from '../lib/calculations';
import { cn, formatINR } from '../lib/utils';
import ExpenseModal from '../components/ExpenseModal';
import EmptyState from '../components/EmptyState';

const themeStyles = {
  primary: {
    bg: 'from-indigo-500/10 to-purple-500/5 hover:border-indigo-500/30',
    iconBg: 'bg-indigo-500/10 text-indigo-500',
    glow: 'group-hover:bg-indigo-500/10',
    border: 'border-indigo-500/10',
    accent: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
  },
  success: {
    bg: 'from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/30',
    iconBg: 'bg-emerald-500/10 text-emerald-500',
    glow: 'group-hover:bg-emerald-500/10',
    border: 'border-emerald-500/10',
    accent: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  },
  danger: {
    bg: 'from-rose-500/10 to-orange-500/5 hover:border-rose-500/30',
    iconBg: 'bg-rose-500/10 text-rose-500',
    glow: 'group-hover:bg-rose-500/10',
    border: 'border-rose-500/10',
    accent: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  },
  warning: {
    bg: 'from-amber-500/10 to-yellow-500/5 hover:border-amber-500/30',
    iconBg: 'bg-amber-500/10 text-amber-500',
    glow: 'group-hover:bg-amber-500/10',
    border: 'border-amber-500/10',
    accent: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  }
};

const StatCard = ({ title, amount, trend, trendValue, icon: Icon, theme, delay, isLoading }) => {
  const styles = themeStyles[theme];

  if (isLoading) {
    return (
      <div
        className={cn(
          "glass-card bg-gradient-to-br rounded-2xl p-6 relative overflow-hidden border animate-pulse",
          styles.border,
          styles.bg
        )}
      >
        <div className="flex justify-between items-start mb-5">
          <div className="w-11.5 h-11.5 rounded-xl bg-muted/40" />
          {trendValue && <div className="w-20 h-5.5 rounded-full bg-muted/45" />}
        </div>
        <div>
          <div className="w-24 h-3 bg-muted/30 rounded mb-2.5" />
          <div className="w-32 h-8 bg-muted/40 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -5 }}
      className={cn(
        "glass-card bg-gradient-to-br rounded-2xl p-6 relative overflow-hidden group border",
        styles.border,
        styles.bg
      )}
    >
      {/* Decorative Gradient Background Glow */}
      <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-all duration-500", styles.glow)}></div>

      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className={cn("p-3 rounded-xl transition-all duration-300 group-hover:scale-110", styles.iconBg)}>
          <Icon className="w-5.5 h-5.5" />
        </div>
        {trendValue && (
          <div className={cn("flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border", styles.accent)}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            {trendValue}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1.5">{title}</p>
        <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{amount}</h3>
      </div>
    </motion.div>
  );
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(70000);

  // Sync monthly income with auth user when user loads/changes during render
  const [incomePrevUserId, setIncomePrevUserId] = useState(null);
  if (user && user.id !== incomePrevUserId) {
    setIncomePrevUserId(user.id);
    const saved = localStorage.getItem(`monthlyIncome_${user.id}`) || localStorage.getItem('monthlyIncome');
    if (saved) {
      setMonthlyIncome(parseFloat(saved));
    }
  }

  const searchQuery = '';
  const [timeframe, setTimeframe] = useState('6months');
  const [customStartDate, setCustomStartDate] = useState(() =>
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    if (!user) return;
    if (showLoading) {
      // Set state asynchronously to avoid synchronous setState inside an effect
      Promise.resolve().then(() => setIsLoading(true));
    }
    try {
      const [expensesRes, budgetsRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (expensesRes.error) {
        console.error('Error fetching expenses:', expensesRes.error);
      } else {
        setExpenses(expensesRes.data || []);
      }

      if (budgetsRes.error) {
        console.error('Error fetching budgets:', budgetsRes.error);
      } else {
        setBudgets(budgetsRes.data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.resolve().then(() => fetchDashboardData(true));
    }
  }, [user, fetchDashboardData]);

  // Trigger a soft 500ms skeleton loading state on timeframe or mount events
  useEffect(() => {
    // Set state asynchronously to avoid synchronous setState inside an effect
    const loadingTimer = setTimeout(() => setIsLoading(true), 0);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(timer);
    };
  }, [timeframe, customStartDate, customEndDate]);

  // --- Calculations ---
  const currentMonthExpenses = useMemo(() => calculateMonthlyExpenses(expenses), [expenses]);
  const monthlySavings = monthlyIncome - currentMonthExpenses;
  const activeBudgetsCount = budgets.length;

  const [isTimeframeDropdownOpen, setIsTimeframeDropdownOpen] = useState(false);
  const timeframeRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (timeframeRef.current && !timeframeRef.current.contains(event.target)) {
        setIsTimeframeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dynamicTrendData = useMemo(() => {
    const result = [];
    const now = new Date();

    if (timeframe === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dayString = `${year}-${month}-${day}`;

        const dayExpenses = expenses.filter(exp => exp.date.startsWith(dayString));
        const spent = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        result.push({
          name: format(d, 'eee'),
          income: Math.round(monthlyIncome / 30),
          expenses: spent
        });
      }
    }
    else if (timeframe === 'month') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dayString = `${year}-${month}-${day}`;

        const dayExpenses = expenses.filter(exp => exp.date.startsWith(dayString));
        const spent = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        result.push({
          name: format(d, 'MMM dd'),
          income: Math.round(monthlyIncome / 30),
          expenses: spent
        });
      }
    }
    else if (timeframe === '3months') {
      for (let i = 11; i >= 0; i--) {
        const startWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i + 1) * 7);
        startWeek.setHours(0, 0, 0, 0);
        const endWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7 + 1);
        endWeek.setHours(0, 0, 0, 0);

        const weekExpenses = expenses.filter(exp => {
          const expDate = parseLocalDate(exp.date);
          return expDate >= startWeek && expDate < endWeek;
        });
        const spent = weekExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        result.push({
          name: format(startWeek, 'MMM dd'),
          income: Math.round(monthlyIncome / 4.33),
          expenses: spent
        });
      }
    }
    else if (timeframe === '6months') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthExpenses = expenses.filter(expense => {
          const expDate = parseLocalDate(expense.date);
          return expDate.getMonth() === d.getMonth() && expDate.getFullYear() === d.getFullYear();
        });
        const spent = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        result.push({
          name: d.toLocaleString('en-IN', { month: 'short' }),
          income: monthlyIncome,
          expenses: spent
        });
      }
    }
    else if (timeframe === 'custom') {
      const start = parseLocalDate(customStartDate);
      const end = parseLocalDate(customEndDate);
      if (start <= end) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 14) {
          for (let i = diffDays; i >= 0; i--) {
            const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
            if (d >= start) {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const dayString = `${year}-${month}-${day}`;
              const dayExpenses = expenses.filter(exp => exp.date.startsWith(dayString));
              const spent = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

              result.push({
                name: format(d, 'MMM dd'),
                income: Math.round(monthlyIncome / 30),
                expenses: spent
              });
            }
          }
        }
        else if (diffDays <= 90) {
          const numWeeks = Math.ceil(diffDays / 7);
          for (let i = numWeeks - 1; i >= 0; i--) {
            const startW = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (i + 1) * 7);
            startW.setHours(0, 0, 0, 0);
            const endW = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i * 7 + 1);
            endW.setHours(0, 0, 0, 0);
            const actualStart = startW < start ? start : startW;

            const weekExpenses = expenses.filter(exp => {
              const expDate = parseLocalDate(exp.date);
              return expDate >= actualStart && expDate < endW;
            });
            const spent = weekExpenses.reduce((sum, exp) => sum + exp.amount, 0);

            result.push({
              name: format(actualStart, 'MMM dd'),
              income: Math.round(monthlyIncome / 4.33),
              expenses: spent
            });
          }
        }
        else {
          const startMonth = start.getFullYear() * 12 + start.getMonth();
          const endMonth = end.getFullYear() * 12 + end.getMonth();
          const numMonths = endMonth - startMonth;

          for (let i = numMonths; i >= 0; i--) {
            const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
            const monthExpenses = expenses.filter(expense => {
              const expDate = parseLocalDate(expense.date);
              const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
              startOfMonth.setHours(0, 0, 0, 0);
              const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
              endOfMonth.setHours(0, 0, 0, 0);
              return expDate >= startOfMonth && expDate < endOfMonth && expDate >= start && expDate <= end;
            });
            const spent = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

            result.push({
              name: d.toLocaleString('en-IN', { month: 'short' }),
              income: monthlyIncome,
              expenses: spent
            });
          }
        }
      }
    }
    return result;
  }, [expenses, monthlyIncome, timeframe, customStartDate, customEndDate]);

  const showIncomeArea = useMemo(() => {
    if (timeframe === '6months') return true;
    if (timeframe === 'custom') {
      const start = parseLocalDate(customStartDate);
      const end = parseLocalDate(customEndDate);
      if (start && end) {
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 90;
      }
    }
    return false;
  }, [timeframe, customStartDate, customEndDate]);

  const chartTitle = useMemo(() => {
    if (timeframe === 'week') return 'Weekly Spending Overview';
    if (timeframe === 'month') return 'Daily Spending Overview';
    if (timeframe === '3months') return '3-Month Spending Overview';
    if (timeframe === '6months') return '6-Month Cash Flow';
    return 'Custom Cash Flow';
  }, [timeframe]);

  const chartDesc = useMemo(() => {
    if (timeframe === 'week' || timeframe === 'month' || timeframe === '3months') {
      return 'Monitor your detailed day-to-day and weekly spending patterns';
    }
    return 'Visualize your complete monthly income vs expense cash flow';
  }, [timeframe]);

  const filteredRecentExpenses = useMemo(() => {
    return expenses.filter(exp =>
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="space-y-11 max-w-7xl mx-auto pb-8">
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          fetchDashboardData();
        }}
      />

      {/* Header Welcome Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-border/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-4xl font-extrabold tracking-tight text-gradient"
            >
              {greeting()}, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </motion.h1>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground font-medium text-sm md:text-base"
          >
            Track your spending, savings, and weekly financial activity.
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsExpenseModalOpen(true)}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <IndianRupee className="w-4 h-4" />
          Add Expense
        </motion.button>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Income"
          amount={formatINR(monthlyIncome)}
          trend="neutral"
          icon={Wallet}
          theme="primary"
          delay={0.1}
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Spend"
          amount={formatINR(currentMonthExpenses)}
          trend="down"
          trendValue="Spend active"
          icon={CreditCard}
          theme="danger"
          delay={0.2}
          isLoading={isLoading}
        />
        <StatCard
          title="Monthly Savings"
          amount={formatINR(monthlySavings)}
          trend="up"
          trendValue="+12% growth"
          icon={TrendingUp}
          theme="success"
          delay={0.3}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Budgets"
          amount={`${activeBudgetsCount}`}
          trend="neutral"
          trendValue="Category Limit"
          icon={IndianRupee}
          theme="warning"
          delay={0.4}
          isLoading={isLoading}
        />
      </div>

      {/* Main Analytical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-6">

        {/* Trend Area Chart Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="lg:col-span-2 glass-card rounded-2xl p-6 md:p-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">{chartTitle}</h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{chartDesc}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto relative" ref={timeframeRef}>
              {timeframe === 'custom' && (
                <div className="flex items-center gap-2 bg-muted/40 border border-border/50 px-3 py-1.5 rounded-xl text-xs font-semibold">
                  <span className="text-muted-foreground font-bold">Range:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    aria-label="Start date"
                    className="bg-transparent border-none text-foreground outline-none cursor-pointer font-bold w-[110px]"
                  />
                  <span className="text-muted-foreground font-medium">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    aria-label="End date"
                    className="bg-transparent border-none text-foreground outline-none cursor-pointer font-bold w-[110px]"
                  />
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setIsTimeframeDropdownOpen(!isTimeframeDropdownOpen)}
                  className="flex items-center justify-between gap-2.5 px-4.5 py-2.5 bg-muted/50 border border-border/80 rounded-xl text-xs font-extrabold text-foreground cursor-pointer hover:bg-muted transition-all duration-200 min-w-[140px]"
                >
                  <span>
                    {timeframe === 'week' && 'Last Week'}
                    {timeframe === 'month' && 'Last Month'}
                    {timeframe === '3months' && 'Last 3 Months'}
                    {timeframe === '6months' && 'Last 6 Months'}
                    {timeframe === 'custom' && 'Custom Range'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200" style={{ transform: isTimeframeDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>

                <AnimatePresence>
                  {isTimeframeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-12 w-44 bg-card border border-border/60 rounded-xl shadow-2xl p-1.5 z-40 text-foreground"
                    >
                      {[
                        { key: 'week', label: 'Last Week' },
                        { key: 'month', label: 'Last Month' },
                        { key: '3months', label: 'Last 3 Months' },
                        { key: '6months', label: 'Last 6 Months' },
                        { key: 'custom', label: 'Custom Range' }
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setTimeframe(opt.key);
                            setIsTimeframeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${timeframe === opt.key
                            ? 'bg-primary/10 text-primary font-bold'
                            : 'hover:bg-muted/70 text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="h-[320px] w-full mt-4 flex flex-col justify-between animate-pulse px-2">
              <div className="flex items-end justify-between h-[270px] pb-6 border-b border-border/10">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                  <div
                    key={i}
                    style={{ height: `${20 + Math.sin(i) * 50 + (i % 3) * 10}%` }}
                    className="w-[5.5%] bg-muted/40 rounded-t-lg transition-all duration-300"
                  />
                ))}
              </div>
              <div className="flex justify-between px-2 pt-3">
                <div className="w-12 h-3 bg-muted/30 rounded" />
                <div className="w-12 h-3 bg-muted/30 rounded" />
                <div className="w-12 h-3 bg-muted/30 rounded" />
                <div className="w-12 h-3 bg-muted/30 rounded" />
              </div>
            </div>
          ) : (
            <div className="h-[320px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicTrendData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.03} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.03} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" opacity={0.06} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    minTickGap={28}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    dx={-6}
                    tickFormatter={(value) => value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`}
                  />
                   <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border p-3.5 rounded-xl shadow-lg text-xs min-w-[140px]">
                            <p className="text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-wider border-b border-border pb-1.5">{label}</p>
                            <div className="space-y-1.5">
                              {payload.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-muted-foreground font-semibold">{item.name}</span>
                                  </div>
                                  <span className="font-extrabold text-foreground">{formatINR(item.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {showIncomeArea && (
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                      activeDot={{ r: 4, strokeWidth: 1, stroke: 'var(--background)' }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                    activeDot={{ r: 4, strokeWidth: 1, stroke: 'var(--background)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Recent Transactions List Panel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="glass-card rounded-2xl p-6 md:p-8"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground">Recent Transactions</h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Quick lookup of your latest purchases</p>
          </div>

          {isLoading ? (
            <div className="space-y-3.5 animate-pulse pr-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 border border-transparent">
                  <div className="flex items-center gap-3.5 min-w-0 w-full">
                    <div className="w-10 h-10 rounded-xl bg-muted/30 flex-shrink-0" />
                    <div className="w-full space-y-2">
                      <div className="w-1/2 h-3.5 bg-muted/30 rounded" />
                      <div className="w-1/3 h-2.5 bg-muted/20 rounded" />
                    </div>
                  </div>
                  <div className="w-16 h-4 bg-muted/35 rounded shrink-0 pl-2" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3.5 overflow-y-auto pr-1 max-h-[300px] custom-scrollbar"
            >
              {filteredRecentExpenses.length === 0 ? (
                <div className="py-4">
                  <EmptyState
                    icon={IndianRupee}
                    title="No Search Matches"
                    description="No logged transactions match your current search criteria. Try matching by store title or category name."
                  />
                </div>
              ) : (
                filteredRecentExpenses.slice(0, 5).map((expense) => (
                  <motion.div
                    variants={itemVariants}
                    key={expense.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 hover:bg-muted/60 border border-transparent hover:border-border/40 transition-all duration-300 cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center group-hover:bg-danger/20 transition-colors flex-shrink-0">
                        <ArrowDownRight className="w-5 h-5 text-danger transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{expense.title}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                          <span className="bg-muted border border-border/20 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">{expense.category}</span>
                          <span className="opacity-60 shrink-0">•</span>
                          <span className="shrink-0">{format(parseLocalDate(expense.date), 'MMM dd')}</span>
                        </p>
                      </div>
                    </div>
                    <div className="font-extrabold text-sm whitespace-nowrap text-foreground pl-2">
                      -{formatINR(expense.amount)}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
