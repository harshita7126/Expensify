import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../store/useThemeStore';
import { cn } from '../../lib/utils';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ToastContainer';

export default function AppLayout({ children }) {
  const { theme } = useThemeStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync dark class on document element so portals and HTML root match perfectly
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={cn("h-screen flex w-full overflow-hidden transition-colors duration-300", theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900')}>
      {/* Desktop Sidebar (hidden on mobile, visible on desktop) */}
      <Sidebar className="hidden md:flex z-10" />

      {/* Mobile Drawer Navigation overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Mobile Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[9999] md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            {/* Mobile Slide Drawer overlay */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-64 z-[10000] md:hidden flex"
            >
              <Sidebar isMobile={true} isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-20">
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
