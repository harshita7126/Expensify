import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, CreditCard, Tag, FileText, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../store/useNotificationStore';

const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Investment', 'Other'];

export default function ExpenseModal({ isOpen, onClose, expenseToEdit }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [prevExpenseId, setPrevExpenseId] = useState(null);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  const currentExpenseId = expenseToEdit ? expenseToEdit.id : null;

  if (currentExpenseId !== prevExpenseId || isOpen !== prevIsOpen) {
    setPrevExpenseId(currentExpenseId);
    setPrevIsOpen(isOpen);

    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmount(expenseToEdit.amount.toString());
      setCategory(expenseToEdit.category);
      setDate(expenseToEdit.date.split('T')[0]);
      setPaymentMethod(expenseToEdit.payment_method);
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !amount) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      useNotificationStore.getState().addToast('You must be logged in to record transactions.', 'error');
      return;
    }

    const expenseAmount = parseFloat(amount);

    try {
      if (expenseToEdit) {
        // UPDATE IN SUPABASE
        const { error } = await supabase
          .from('expenses')
          .update({
            title,
            amount: expenseAmount,
            category,
            date,
            payment_method: paymentMethod,
          })
          .eq('id', expenseToEdit.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating expense:', error);
          useNotificationStore.getState().addToast(`Failed to update expense: ${error.message}`, 'error');
          return;
        }

        useNotificationStore.getState().addToast(`Updated expense: ${title}`, 'success');
        useNotificationStore.getState().addNotification({
          title: 'Expense Updated',
          message: `Updated expense details for "${title}".`,
          type: 'success',
        });
      } else {
        // INSERT INTO SUPABASE
        const { error } = await supabase
          .from('expenses')
          .insert([{
            user_id: user.id,
            title,
            amount: expenseAmount,
            category,
            date,
            payment_method: paymentMethod,
          }]);

        if (error) {
          console.error('Error inserting expense:', error);
          useNotificationStore.getState().addToast(`Failed to add expense: ${error.message}`, 'error');
          return;
        }

        useNotificationStore.getState().addToast(`Added expense: ${title}`, 'success');
        useNotificationStore.getState().addNotification({
          title: 'Expense Added',
          message: `Added expense "${title}" for ₹${expenseAmount.toFixed(2)} under ${category}.`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Unexpected error handling expense:', err);
      useNotificationStore.getState().addToast('An unexpected error occurred.', 'error');
      return;
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-screen h-screen min-h-screen bg-background/50 backdrop-blur-md z-[9999] transition-all duration-300"
            onClick={onClose}
          />

          {/* Main Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 30, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.98, y: 30, x: "-50%" }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            style={{ left: "50%", top: "50%", translateY: "-50%" }}
            className="fixed w-[92%] max-w-md z-[10000] p-6 md:p-8 premium-card rounded-3xl"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-extrabold tracking-tight text-foreground">
                  {expenseToEdit ? 'Modify Transaction' : 'Record Transaction'}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 hover:bg-muted border border-transparent hover:border-border/30 rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="expense-description" className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 opacity-70" />
                  Description
                </label>
                <input
                  required
                  id="expense-description"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-foreground placeholder:text-muted-foreground/75"
                  placeholder="e.g., Swiggy Lunch, Uber Commute"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expense-amount" className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 opacity-70" />
                    Amount (₹)
                  </label>
                  <input
                    required
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-foreground placeholder:text-muted-foreground/75"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="expense-date" className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                    Date
                  </label>
                  <input
                    required
                    id="expense-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-foreground cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expense-category" className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 opacity-70" />
                    Category
                  </label>
                  <select
                    id="expense-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Category"
                    className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 outline-none cursor-pointer text-foreground"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="expense-payment-method" className="text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 opacity-70" />
                    Payment Method
                  </label>
                  <select
                    id="expense-payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    aria-label="Payment Method"
                    className="w-full bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/45 outline-none cursor-pointer text-foreground"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-xs shadow-xl shadow-primary/20 hover:shadow-primary/30 mt-6 transition-all cursor-pointer"
              >
                {expenseToEdit ? 'Save Changes' : 'Save Transaction'}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
