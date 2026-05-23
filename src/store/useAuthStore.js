import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setIsLoading: (isLoading) => set({ isLoading }),

  initializeAuth: () => {
    if (get().isInitialized) {
      return;
    }
    set({ isInitialized: true });

    // Fetch initial session asynchronously in background to restore persistence on reload
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          set({ session, user: session.user });
        } else {
          set({ session: null, user: null });
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
      } finally {
        set({ isLoading: false });
      }
    };

    fetchSession();

    // Listen to real-time auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('onAuthStateChange event:', event, 'user:', session?.user?.id);
      
      set({ session, user: session?.user ?? null, isLoading: false });
    });
  },
}));

