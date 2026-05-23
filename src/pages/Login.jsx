import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../store/useNotificationStore';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { addToast } = useNotificationStore();

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password || (isSignUp && !fullName)) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Flow
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          const errMsg = error.message.toLowerCase();
          if (errMsg.includes('already') || errMsg.includes('exist') || errMsg.includes('taken') || errMsg.includes('registered')) {
            setErrorMsg('The email already exists.');
          } else {
            setErrorMsg(error.message);
          }
        } else {
          addToast('Account created successfully! Check your email if verification is required.', 'success');
        }
      } else {
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const errMsg = error.message.toLowerCase();
          if (errMsg.includes('invalid') || errMsg.includes('credential') || errMsg.includes('password') || errMsg.includes('not found') || errMsg.includes('exists')) {
            setErrorMsg('Invalid email or passord');
          } else {
            setErrorMsg(error.message);
          }
        } else {
          addToast('Welcome back to Expensify!', 'success');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md premium-card rounded-3xl p-6 md:p-8 z-10 text-foreground"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3.5 mb-3">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary/25"
            >
              E
            </motion.div>
            <span className="font-extrabold text-2xl tracking-tight text-gradient">
              Expensify
            </span>
          </div>
          <p className="text-muted-foreground font-semibold text-xs tracking-wide">
            Track and master your daily spending metrics
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-muted/40 border border-border/40 p-1.5 rounded-2xl mb-8 relative">
          <button
            onClick={() => {
              setIsSignUp(false);
              setFullName('');
              setErrorMsg('');
            }}
            className={`relative py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              !isSignUp ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {!isSignUp && (
              <motion.div
                layoutId="authTabSlider"
                className="absolute inset-0 bg-card border border-border/60 rounded-xl shadow-md"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Sign In</span>
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg('');
            }}
            className={`relative py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              isSignUp ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isSignUp && (
              <motion.div
                layoutId="authTabSlider"
                className="absolute inset-0 bg-card border border-border/60 rounded-xl shadow-md"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Create Account</span>
          </button>
        </div>

        {/* Form Details */}
        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <label htmlFor="auth-fullname" className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 opacity-70" />
                  Full Name
                </label>
                <input
                  required={isSignUp}
                  id="auth-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-foreground placeholder:text-muted-foreground/75 mt-1"
                  placeholder="e.g. Harshita Sharma"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label htmlFor="auth-email" className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 opacity-70" />
              Email Address
            </label>
            <input
              required
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg('');
              }}
              className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-foreground placeholder:text-muted-foreground/75 mt-1"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 opacity-70" />
              Password
            </label>
            <div className="relative mt-1">
              <input
                required
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full bg-background border border-border/80 rounded-xl pl-4 pr-10 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-foreground placeholder:text-muted-foreground/75"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-bold text-red-500 mt-2 text-center"
            >
              {errorMsg}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-xs shadow-xl shadow-primary/20 hover:shadow-primary/30 mt-6 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-b-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Info */}
        <div className="flex justify-center items-center gap-1.5 mt-8 text-[11px] text-muted-foreground font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span>Real-time cloud database encryption</span>
        </div>
      </motion.div>
    </div>
  );
}
