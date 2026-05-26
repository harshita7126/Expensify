# Expensify - Personal Expense Manager

Expensify is a full-stack personal finance tracker that helps users manage expenses, analyze spending patterns, and monitor category budgets through interactive dashboards and analytics.

## Live Demo

[Visit Expensify](https://expensify-kappa.vercel.app)

## Key Highlights

- Real-time expense tracking
- Interactive analytics dashboards
- Budget monitoring system
- Secure authentication with Supabase
- Fully responsive modern UI
- Persistent dark mode support

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

2. Navigate to the project folder:

```bash
cd Expensify
```

3. Install dependencies:

```bash
npm install
```

4. Configure environment variables:

Copy `.env.example` to `.env`

```bash
cp .env.example .env
```

Add your Supabase credentials inside `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the database schema from:

```bash
database/schema.sql
```

inside your Supabase SQL Editor.

6. Start the development server:

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

### Dashboard
<img width="1919" height="893" alt="image" src="https://github.com/user-attachments/assets/56ba8d01-d073-4864-94ba-92941c193955" />

### Expenses
<img width="1915" height="896" alt="image" src="https://github.com/user-attachments/assets/de829bce-2120-4262-b9e7-6499795f5f35" />

### Analytics
<img width="1919" height="894" alt="image" src="https://github.com/user-attachments/assets/9e66c5b5-0f5f-415b-bbde-30f299c8613e" />

### Budgets
<img width="1919" height="896" alt="image" src="https://github.com/user-attachments/assets/ec786341-9f9e-4cf0-b826-6c9fc1361ca4" />


## Future Improvements

* Export expense reports
* Recurring transactions
* Email notifications
* Advanced analytics filters
* Multi-currency support

## License

MIT License
