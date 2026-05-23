import { useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { supabase } from '../lib/supabase';
import { Sparkles, User, ShieldAlert, Sliders, LogOut } from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();
  
  const [incomeInput, setIncomeInput] = useState('70000');
  const [isSaved, setIsSaved] = useState(false);
  const [nameInput, setNameInput] = useState(user?.user_metadata?.full_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Keep track of the prev user ID to sync details during render
  const [prevUserId, setPrevUserId] = useState(null);

  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    if (user.user_metadata?.full_name) {
      setNameInput(user.user_metadata.full_name);
    }
    const saved = localStorage.getItem(`monthlyIncome_${user.id}`) || localStorage.getItem('monthlyIncome') || '70000';
    setIncomeInput(saved);
  }

  const handleSaveFinance = () => {
    const val = parseFloat(incomeInput);
    if (!isNaN(val) && user) {
      localStorage.setItem(`monthlyIncome_${user.id}`, val.toString());
      localStorage.setItem('monthlyIncome', val.toString());
      setIsSaved(true);
      addToast('Income updated successfully!', 'success');
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) {
      addToast('Display name cannot be empty.', 'warning');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: nameInput,
        },
      });

      if (error) {
        addToast(error.message, 'error');
      } else {
        addToast('Profile details updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      addToast('An unexpected error occurred.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      
      {/* Title Header */}
      <div className="pb-1.5 border-b border-border/25">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-extrabold tracking-tight text-gradient"
          >
            Settings
          </motion.h1>
        </div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground font-semibold text-xs md:text-sm"
        >
          Customize your preferences, appearance, and financial profiles.
        </motion.p>
      </div>

      {/* Grid of Sections */}
      <div className="space-y-4.5 mt-3">
        
        {/* Appearance Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="glass-card rounded-2xl p-5 md:p-6"
        >
          <div className="flex items-center gap-2.5 mb-3.5 border-b border-border/20 pb-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Appearance Preference</h3>
          </div>
          
          <div className="flex items-center justify-between py-1">
            <div>
              <h4 className="font-extrabold text-xs text-foreground">Dark mode theme</h4>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Toggle between gorgeous dark mode and crisp light theme.</p>
            </div>
            <button 
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-all duration-300 shadow-inner cursor-pointer ${theme === 'dark' ? 'bg-primary' : 'bg-muted-foreground/35'}`}
            >
              <motion.div 
                layout
                className="w-5 h-5 bg-white rounded-full shadow-md border border-border/10"
                initial={false}
                animate={{ x: theme === 'dark' ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            </button>
          </div>
        </motion.div>

        {/* Finance Preferences Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-card rounded-2xl p-5 md:p-6"
        >
          <div className="flex items-center gap-2.5 mb-3.5 border-b border-border/20 pb-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Finance Parameters</h3>
          </div>
          
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <label htmlFor="monthly-income" className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider">Monthly Income (₹)</label>
              <p className="text-[11px] text-muted-foreground/70 font-semibold mb-1">Adjust your base budget calculation denominator.</p>
              <input 
                id="monthly-income" 
                type="number" 
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                className="bg-background border border-border/80 rounded-xl px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-foreground font-semibold text-xs placeholder:text-muted-foreground/70" 
              />
            </div>
            
            <div className="flex items-center gap-4 mt-2.5">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveFinance}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all cursor-pointer"
              >
                Save Income Settings
              </motion.button>
              {isSaved && <span className="text-success text-xs font-bold animate-pulse">Configuration updated successfully!</span>}
            </div>
          </div>
        </motion.div>
        
        {/* Account Profile Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="glass-card rounded-2xl p-5 md:p-6"
        >
          <div className="flex items-center gap-2.5 mb-3.5 border-b border-border/20 pb-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <User className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Account Profile Details</h3>
          </div>
          
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <label htmlFor="display-name" className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider">Display Name</label>
              <input 
                id="display-name" 
                type="text" 
                value={nameInput} 
                onChange={(e) => setNameInput(e.target.value)}
                className="bg-background border border-border/80 rounded-xl px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-foreground font-semibold text-xs placeholder:text-muted-foreground/70" 
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="email-address" className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider">Email Address</label>
              <input 
                id="email-address" 
                type="email" 
                value={user?.email || ''} 
                disabled 
                className="bg-muted/30 border border-border/50 rounded-xl px-4 py-2 w-full max-w-md opacity-60 cursor-not-allowed text-muted-foreground font-semibold text-xs" 
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveProfile}
              disabled={isUpdatingProfile}
              className="bg-muted text-foreground border border-border/40 hover:bg-muted/80 px-5 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-sm w-fit mt-1 disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Details'}
            </motion.button>
          </div>
        </motion.div>

        {/* Mobile User Badge Section (visible only on mobile) */}
        <div className="md:hidden mt-6 pt-5 border-t border-border/20">
          <span className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-3">Session Profile</span>
          <div className="flex items-center justify-between gap-3 bg-muted/20 hover:bg-muted/40 border border-border/40 hover:border-border/70 p-3 rounded-2xl transition-all duration-300 shadow-sm group">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-400 to-pink-500 shadow-md group-hover:scale-105 transition-transform duration-300 flex items-center justify-center text-white font-black text-lg select-none">
                  {(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User').charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-card rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium truncate">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await supabase.auth.signOut();
                } catch (err) {
                  console.error('Error signing out:', err);
                }
              }}
              title="Sign Out"
              className="p-2.5 hover:bg-danger/10 text-muted-foreground hover:text-danger rounded-xl border border-transparent hover:border-danger/20 transition-all cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
