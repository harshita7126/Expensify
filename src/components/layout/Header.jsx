import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Bell, Search, Sun, Moon, CheckCircle, AlertTriangle, AlertCircle, Info, Trash2, Check, X, ArrowDownRight, Menu } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { formatINR } from '../../lib/utils';

export default function Header({ onMenuClick }) {
  const { theme, toggleTheme } = useThemeStore();
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (!error && data) {
        setExpenses(data);
      }
    } catch (err) {
      console.error('Error fetching search expenses:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.resolve().then(() => fetchExpenses());
    }
  }, [user, fetchExpenses]);

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    fetchExpenses();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />,
    info: <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />,
  };

  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return expenses.filter(exp => 
      exp.title.toLowerCase().includes(query) ||
      exp.category.toLowerCase().includes(query) ||
      exp.payment_method.toLowerCase().includes(query) ||
      exp.amount.toString().includes(query)
    );
  }, [expenses, searchQuery]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-background/70 backdrop-blur-md flex items-center justify-between px-6 md:px-8 sticky top-0 z-30">
      
      {/* Search Bar Container */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 text-foreground hover:bg-muted rounded-xl border border-transparent hover:border-border/30 transition-colors md:hidden cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative w-full max-w-md hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input 
            type="text" 
            aria-label="Search transactions"
            placeholder="Search transactions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            className="w-full bg-muted/40 border border-border/80 hover:border-border rounded-xl pl-9 pr-10 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-foreground font-semibold placeholder:text-muted-foreground/80 placeholder:font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}


          {/* Connected Results Dropdown */}
          <AnimatePresence>
            {isSearchFocused && searchQuery.trim() !== '' && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute left-0 right-0 top-[46px] opaque-card rounded-2xl p-5 z-[9999] text-foreground max-h-96 overflow-y-auto custom-scrollbar shadow-premium"
              >
                <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                  <span className="font-extrabold text-xs text-muted-foreground">Search Results ({filteredExpenses.length})</span>
                  {filteredExpenses.length > 0 && (
                    <span className="text-[10px] text-primary font-bold bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      Active Matches
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {filteredExpenses.length === 0 ? (
                    <div className="py-8 text-center">
                      <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm font-bold text-muted-foreground">No matches found</p>
                      <p className="text-xs text-muted-foreground/75 mt-1">Try another category, store or amount.</p>
                    </div>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        onClick={() => {
                          setSearchQuery(expense.title);
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted border border-transparent hover:border-border/30 hover:scale-[1.008] transition-all duration-150 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center group-hover:bg-danger/20 transition-colors flex-shrink-0">
                            <ArrowDownRight className="w-4.5 h-4.5 text-danger group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              {expense.title}
                            </p>
                            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5 font-bold">
                              <span className="bg-muted px-1.5 py-0.5 rounded-md text-[9px] font-black text-muted-foreground border border-border/20 uppercase tracking-wide">
                                {expense.category}
                              </span>
                              <span>•</span>
                              <span className="text-muted-foreground/90 font-semibold">{format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                              <span>•</span>
                              <span className="italic text-[10px] text-muted-foreground/70 font-medium">{expense.payment_method}</span>
                            </p>
                          </div>
                        </div>
                        <div className="font-black text-sm text-foreground whitespace-nowrap pl-2 group-hover:text-danger transition-colors">
                          -{formatINR(expense.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Header Actions (Theme, Notification) */}
      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        
        {/* Toggle Theme Button */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-foreground border border-transparent hover:border-border/30"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>

        {/* Notifications Icon Button */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-label="Notifications" 
          aria-expanded={isDropdownOpen}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors relative text-foreground border border-transparent hover:border-border/30"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-danger text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background px-0.5">
              {unreadCount}
            </span>
          )}
        </motion.button>

        {/* Notification Popover */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 top-13 w-96 premium-card rounded-2xl p-5 z-50 text-foreground"
            >
              {/* Dropdown Header */}
              <div className="flex items-center justify-between border-b border-border pb-3.5 mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => markAllAsRead()} 
                    title="Mark all as read"
                    className="p-1.5 hover:bg-muted border border-transparent hover:border-border/20 rounded-lg text-muted-foreground hover:text-primary transition-all duration-200"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => clearAll()} 
                    title="Clear all"
                    className="p-1.5 hover:bg-muted border border-transparent hover:border-border/20 rounded-lg text-muted-foreground hover:text-danger transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications Listing */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center mb-2.5 text-muted-foreground/30">
                      <Bell className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">All caught up!</p>
                    <p className="text-[10px] text-muted-foreground/75 mt-0.5">No new alerts or reminders.</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      layoutId={notification.id}
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-200 cursor-pointer ${
                        notification.read 
                          ? 'border-border/40 bg-card/10 opacity-55 hover:opacity-80' 
                          : 'border-primary/15 bg-primary/[0.04] hover:bg-primary/[0.08] hover:border-primary/30 hover:shadow-sm'
                      }`}
                    >
                      {icons[notification.type]}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-foreground truncate">{notification.title}</p>
                        <p className="text-[11px] leading-relaxed text-muted-foreground font-medium mt-1">{notification.message}</p>
                      </div>
                      {!notification.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></span>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
