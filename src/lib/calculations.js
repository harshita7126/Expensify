import { isSameMonth, parseISO } from 'date-fns';

/**
 * EDUCATIONAL COMMENT: 
 * How reduce() works in JavaScript:
 * `Array.reduce()` takes an array and "reduces" it into a single value (like a number or an object).
 * It takes a callback function with two main arguments: (accumulator, currentItem).
 * - `accumulator`: The running total or the object we are building.
 * - `currentItem`: The current element in the array being processed.
 * The 0 at the end `...reduce(..., 0)` is the initial value of the accumulator.
 */

// 1. Calculate Total Expenses using reduce
export const calculateTotalExpenses = (expenses) => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

// 2. Filter expenses for a specific month, then calculate the total
export const calculateMonthlyExpenses = (expenses, date = new Date()) => {
  // First, use filter() to keep only expenses that belong to the specified month
  const monthlyExpenses = expenses.filter((expense) => {
    return isSameMonth(parseISO(expense.date), date);
  });
  
  // Then, use reduce() to sum up the amounts of those filtered expenses
  return calculateTotalExpenses(monthlyExpenses);
};

// 3. Calculate Income vs Savings
export const calculateSavings = (income, expensesAmount) => {
  // Simple math calculation
  return income - expensesAmount;
};

// 4. Group expenses by category for Pie Charts
export const getExpensesByCategory = (expenses) => {
  /*
   * Here we use reduce to build an object mapping Categories to their total sums:
   * Example Output: { "Food": 1500, "Shopping": 4000 }
   */
  const totals = expenses.reduce((acc, expense) => {
    // If the category doesn't exist in our accumulator yet, start it at 0
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    // Add the current expense amount to its corresponding category
    acc[expense.category] += expense.amount;
    return acc;
  }, {});

  // Now, we map this object into an array format that Recharts expects
  // Recharts needs an array of objects like: [{ name: 'Food', value: 1500 }]
  const categoryColors = {
    Food: '#3b82f6',        // Blue
    Shopping: '#f43f5e',    // Rose
    Entertainment: '#8b5cf6', // Violet
    Travel: '#10b981',      // Emerald
    Bills: '#f59e0b',       // Amber
    Health: '#14b8a6',      // Teal
    Investment: '#06b6d4',  // Cyan
    Other: '#64748b',       // Slate
  };

  return Object.keys(totals).map(category => ({
    name: category,
    value: totals[category],
    color: categoryColors[category] || categoryColors.Other
  })).sort((a, b) => b.value - a.value); // Sort highest to lowest
};

// 5. Generate a 6-month trend array for Bar / Area charts
export const getMonthlyTrend = (expenses, monthlyIncome) => {
  const result = [];
  const currentDate = new Date();
  
  // Loop to generate data for the last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    
    // Filter expenses that occurred in this specific month loop
    const monthExpenses = expenses.filter(expense => {
      const expDate = parseISO(expense.date);
      return expDate.getMonth() === d.getMonth() && expDate.getFullYear() === d.getFullYear();
    });

    // Sum them up using reduce
    const spent = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Format the month name (e.g., 'Jan', 'Feb')
    const monthName = d.toLocaleString('en-IN', { month: 'short' });

    result.push({
      name: monthName,
      income: i === 0 ? monthlyIncome : 70000, // Assuming static income for educational purposes
      expenses: spent
    });
  }

  return result;
};

// 6. Calculate Budget Utilization
export const calculateBudgetProgress = (budget, expenses) => {
  // Filter expenses matching the budget category AND the budget's month
  const categoryExpenses = expenses.filter(exp => 
    exp.category === budget.category && 
    exp.date.startsWith(budget.month) // e.g. "2026-05" matches "2026-05-15T..."
  );

  const spent = calculateTotalExpenses(categoryExpenses);
  const percent = (spent / budget.amount) * 100;
  
  return {
    spent,
    percent: Math.min(percent, 100), // Cap at 100% for progress bars
    isWarning: percent >= 80 && percent < 100,
    isDanger: percent >= 100
  };
};
