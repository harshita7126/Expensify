import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Wallet, Settings, LogOut, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Budgets', href: '/budgets', icon: Wallet },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ className, isMobile, onClose }) {
  const location = useLocation();
  const { user } = useAuthStore();

  const handleLogout = async (e) => {
    e.stopPropagation();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const emailName = user?.email || '';

  return (
    <aside className={cn("w-64 border-r border-border bg-card/60 backdrop-blur-xl flex flex-col h-full", className)}>
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-border justify-between">
        <Link to="/" className="flex items-center gap-3 group" onClick={() => onClose && onClose()}>
          <motion.img 
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            src="/wallet-icon.png"
            alt="Expensify Logo"
            className="w-9 h-9 object-contain rounded-xl shadow-lg shadow-primary/10"
          />
          <span className="font-extrabold text-xl tracking-tight text-primary transition-colors duration-300">
            Expensify
          </span>
        </Link>
        {isMobile && (
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted border border-transparent hover:border-border/30 transition-colors md:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-8 px-3.5 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className="relative group"
              onClick={() => onClose && onClose()}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveBackground"
                  className="absolute inset-0 bg-primary/[0.08] dark:bg-primary/[0.05] border border-primary/10 rounded-lg"
                  transition={{ type: "spring", stiffness: 380, damping: 35 }}
                />
              )}
              
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-xs font-semibold tracking-wide relative z-10",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <item.icon className={cn("w-4 h-4 transition-transform duration-200 group-hover:scale-105", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.name}</span>

                {isActive && (
                  <span className="w-1.5 h-1.5 bg-primary rounded-full ml-auto shadow-[0_0_8px_var(--primary)]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Badge Profile Section */}
      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center justify-between gap-3 bg-muted/30 hover:bg-muted/60 border border-border/40 hover:border-border/80 p-3 rounded-2xl transition-all duration-300 shadow-sm group">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-400 to-pink-500 shadow-md group-hover:scale-105 transition-transform duration-300 flex items-center justify-center text-white font-black text-lg select-none">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-card rounded-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{displayName}</p>
              <p className="text-[10px] text-muted-foreground font-medium truncate">{emailName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 hover:bg-danger/10 text-muted-foreground hover:text-danger rounded-xl border border-transparent hover:border-danger/20 transition-all cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
