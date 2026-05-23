# Expensify - Personal Expense Manager

A modern personal finance management web application built with React, Supabase, and Tailwind CSS.

## Tech Stack

* React + Vite
* JavaScript
* Tailwind CSS
* Framer Motion
* Recharts
* Supabase (Authentication + Database)
* Zustand (State Management)
* React Router

## Features

* **Dashboard**: Overview of balance, monthly spending, savings, and analytics charts.
* **Expenses**: Add, search, filter, and manage transactions.
* **Analytics**: Visual insights into expenses, income, and spending categories.
* **Budgets**: Create category budgets and track spending progress.
* **Authentication**: Secure login and signup using Supabase Auth.
* **Responsive UI**: Optimized for desktop, tablet, and mobile devices.
* **Dark Mode**: Toggle between light and dark themes.
* **Toast Notifications**: Success and error feedback for important actions.

## Folder Structure

```bash
.
├── database/            # Supabase SQL schema and policies
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── lib/             # Utility functions and Supabase client
│   ├── pages/           # Application pages
│   ├── store/           # Zustand state management
│   ├── App.jsx          # Main application routes
│   └── main.jsx         # Application entry point
├── .env.example
├── package.json
└── vite.config.js
```

## Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/harshita7126/Expensify.git
```

1. Navigate to the project folder:

```bash
cd Expensify
```

1. Install dependencies:

```bash
npm install
```

1. Configure environment variables:

Copy `.env.example` to `.env`

```bash
cp .env.example .env
```

Add your Supabase credentials inside `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

1. Run the database schema from:

```bash
database/schema.sql
```

inside your Supabase SQL Editor.

1. Start the development server:

```bash
npm run dev
```

## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Set the framework preset to `Vite`.
4. Add environment variables:

   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
5. Deploy the project.

## Screenshots

Add application screenshots here after deployment.

* Dashboard
* Expenses
* Analytics
* Budgets

## Future Improvements

* Export expense reports
* Recurring transactions
* Email notifications
* Advanced analytics filters
* Multi-currency support
