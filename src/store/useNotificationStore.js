import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: [
    {
      id: 'init-1',
      title: 'Welcome to Expensify! 🇮🇳',
      message: 'Track all your Swiggy, Zomato, and Ola UPI spends instantly.',
      type: 'success',
      read: false,
      timestamp: new Date().toISOString(),
    }
  ],
  toasts: [],

  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        ...notification,
        id: Math.random().toString(36).substring(7),
        read: false,
        timestamp: new Date().toISOString(),
      },
      ...state.notifications,
    ]
  })),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true }))
  })),

  clearAll: () => set({ notifications: [] }),

  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 4000);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));
