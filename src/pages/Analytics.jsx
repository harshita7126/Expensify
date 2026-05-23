import { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { isSameMonth, parseISO } from 'date-fns';

import { getExpensesByCategory, getMonthlyTrend, calculateTotalExpenses } from '../lib/calculations';
import { cn, formatINR } from '../lib/utils';
import { PieChart as PieIcon, BarChart2, Sparkles } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

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

export default function Analytics() {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSector, setActiveSector] = useState(null);
  const [monthlyIncome, setMonthlyIncome] = useState(70000);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, width: 300, height: 300 });
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const handleChartMouseMove = (e, entry) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        width: rect.width,
        height: rect.height
      });
    }
    if (entry && activeSector?.name !== entry.name) {
      setActiveSector(entry);
    }
  };

  const tooltipStyle = useMemo(() => {
    if (!activeSector) {
      return { left: 0, top: 0 };
    }
    
    const xOffset = 15;
    const yOffset = 15;
    const tooltipWidth = 140;
    const tooltipHeight = 90;
    
    let left = mousePos.x + xOffset;
    let top = mousePos.y + yOffset;
    
    // Boundary checks to keep it strictly inside the container
    left = Math.max(8, Math.min(left, mousePos.width - tooltipWidth - 8));
    top = Math.max(8, Math.min(top, mousePos.height - tooltipHeight - 8));
    
    return { left, top };
  }, [activeSector, mousePos]);

  // Sync monthly income with auth user when user loads/changes during render
  const [incomePrevUserId, setIncomePrevUserId] = useState(null);
  if (user && user.id !== incomePrevUserId) {
    setIncomePrevUserId(user.id);
    const saved = localStorage.getItem(`monthlyIncome_${user.id}`) || localStorage.getItem('monthlyIncome');
    if (saved) {
      setMonthlyIncome(parseFloat(saved));
    }
  }

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user) return;
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
    };

    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(expense => isSameMonth(parseISO(expense.date), now));
  }, [expenses]);

  const categoryData = useMemo(() => getExpensesByCategory(currentMonthExpenses), [currentMonthExpenses]);
  const trendData = useMemo(() => getMonthlyTrend(expenses, monthlyIncome), [expenses, monthlyIncome]);
  const currentMonthlySpent = useMemo(() => calculateTotalExpenses(currentMonthExpenses), [currentMonthExpenses]);

  // Calculate percentages for categories
  const enrichedCategoryData = useMemo(() => {
    return categoryData.map(c => ({
      ...c,
      percentage: currentMonthlySpent > 0 ? ((c.value / currentMonthlySpent) * 100).toFixed(0) : '0'
    }));
  }, [categoryData, currentMonthlySpent]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="pb-2 border-b border-border/25">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-extrabold tracking-tight text-gradient"
          >
            Analytics & Insights
          </motion.h1>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground font-medium text-sm md:text-base"
        >
          Deep dive into your financial habits and monthly trends.
        </motion.p>
      </div>

      {/* Main Grid or Empty State */}
      {expenses.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={PieIcon}
            title="No Analytics Insights"
            description="Log your first few transactions to populate spend breakdowns, dynamic pie charts, and monthly comparison bars."
            actionLabel="Go to Transactions"
            onAction={() => navigate('/expenses')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6">

          {/* Spending Category Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="glass-card rounded-2xl p-6 md:p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <PieIcon className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Spending by Category</h3>
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-6">Percentage share of different budget categories</p>
            </div>

            <div 
              ref={containerRef}
              className="h-[300px] w-full flex items-center justify-center relative my-2"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={enrichedCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {enrichedCategoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        className="outline-none cursor-pointer"
                        onMouseEnter={(e) => handleChartMouseMove(e, entry)}
                        onMouseMove={(e) => handleChartMouseMove(e, entry)}
                        onMouseLeave={() => setActiveSector(null)}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Solid, dynamically positioned hover card */}
              {activeSector && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: `${tooltipStyle.left}px`,
                    top: `${tooltipStyle.top}px`,
                    pointerEvents: 'none',
                    zIndex: 10
                  }}
                  className="opaque-card p-3.5 rounded-xl text-xs min-w-[140px] shadow-lg animate-in fade-in duration-200"
                >
                  <div className="flex items-center gap-2 mb-1.5 border-b border-border pb-1.5">
                    <span className={cn("w-2 h-2 rounded-full", bgClassMap[activeSector.name] || 'bg-primary')} />
                    <span className="font-extrabold text-foreground">{activeSector.name}</span>
                  </div>
                  <div className="space-y-1 text-muted-foreground font-semibold">
                    <p className="flex justify-between gap-3"><span>Amount:</span> <span className="text-foreground font-extrabold">{formatINR(activeSector.value)}</span></p>
                    <p className="flex justify-between gap-3"><span>Share:</span> <span className="text-foreground font-extrabold">{activeSector.percentage}%</span></p>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none text-center px-4">
                <span className="text-xl font-black text-foreground">{formatINR(currentMonthlySpent)}</span>
                <span className="text-[9px] font-bold text-muted-foreground/75 uppercase tracking-wider mt-0.5">Monthly Spent</span>
                
                <div className="w-16 h-[1px] bg-border/50 my-1.5" />
                
                <span className="text-sm font-black text-emerald-500">{formatINR(monthlyIncome)}</span>
                <span className="text-[9px] font-bold text-muted-foreground/75 uppercase tracking-wider">Income</span>
              </div>
            </div>

            {/* Grid Legend */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3.5 border-t border-border/20 pt-6">
              {enrichedCategoryData.map((category) => (
                <div key={category.name} className="flex items-center gap-2.5 bg-muted/20 border border-border/30 hover:border-border/60 p-2 rounded-xl transition-all duration-200">
                  <div className={`w-3 h-3 rounded-md shrink-0 shadow-sm ${bgClassMap[category.name] || 'bg-primary'}`} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-foreground truncate">{category.name}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{category.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Income vs Expenses Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="glass-card rounded-2xl p-6 md:p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Income vs Expenses</h3>
              </div>
              <p className="text-xs text-muted-foreground font-medium mb-6">Compare monthly deposits against outgoing expenses</p>
            </div>

            <div className="h-[320px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 15, right: 0, left: -25, bottom: 0 }} barSize={12} barGap={4}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" opacity={0.06} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} dx={-6} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border p-3.5 rounded-xl shadow-lg text-xs min-w-[140px]">
                            <p className="text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-wider border-b border-border pb-1.5">{label}</p>
                            <div className="space-y-1.5">
                              {payload.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      item.name === "Income" ? "bg-emerald-500" : "bg-rose-500"
                                    )} />
                                    <span className="text-muted-foreground font-semibold">{item.name}</span>
                                  </div>
                                  <span className="font-extrabold text-foreground">{formatINR(Number(item.value))}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={6}
                    wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 600, color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
