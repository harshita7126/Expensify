# Expensify - Premium Personal Expense Manager

A production-grade, highly polished Personal Expense Manager web application built with a modern React tech stack.

## Tech Stack
- React + Vite
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Recharts
- Supabase (Auth + PostgreSQL)
- Zustand (State Management)
- React Router

## Features
- **Dashboard**: High-level overview of total balance, monthly spending, savings, and animated Recharts analytics.
- **Expenses**: View, search, and filter transactions.
- **Analytics**: Deep dive into spending categories and monthly income vs. expenses trends.
- **Budgets**: Set and monitor category limits with progress bars and warnings.
- **Settings**: Toggle between sleek dark mode and light mode, update profile details.
- **Glassmorphism UI**: Premium visual design with blurs, gradients, and subtle hover animations using Framer Motion.

## Folder Structure
```
.
├── database/            # Supabase SQL schemas and RLS policies
├── src/
│   ├── components/      # Reusable UI components (Sidebar, Header, Layout)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and Supabase client
│   ├── pages/           # Application route pages
│   ├── store/           # Zustand state management
│   ├── types/           # TypeScript definitions
│   ├── App.tsx          # App routing
│   └── main.tsx         # Entry point
└── ...
```

## Setup Instructions
1. Clone this repository and navigate to the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Supabase project and run the SQL query from `database/schema.sql` in your Supabase SQL Editor.
4. Copy `.env.example` to `.env` and add your Supabase URL and Anon Key.
   ```bash
   cp .env.example .env
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment Guide (Vercel)
1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and create a new project.
3. Import your GitHub repository.
4. Ensure the Framework Preset is set to `Vite`.
5. Add the Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click Deploy. Vercel will automatically build and deploy your application.

## Screenshots
*(Replace with actual application screenshots)*
- `Dashboard View`
- `Analytics View`
- `Budgets View`
