# Expense Tracker

A modern, full-stack expense tracking application built with Next.js 15, Supabase,  authentication, and AI-powered receipt parsing using Google's Gemini AI.

## Features

- 🔐 **Authentication**: Secure login with  (email + Google OAuth)
- 📊 **Dashboard**: Comprehensive expense overview with statistics
- 💰 **Expense Management**: Add, edit, delete expenses with categories
- 🤖 **AI Receipt Parsing**: Upload receipt images for automatic data extraction
- 🔍 **Search & Filter**: Find expenses by category, date range, or description  
- 📱 **Responsive Design**: Works perfectly on mobile and desktop
- 🎨 **Professional UI**: Clean, modern interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: 
- **Styling**: Tailwind CSS
- **AI**: Google Gemini AI for receipt parsing
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
-  account  
- Google AI API key (for Gemini)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd expense-tracker-week3
   npm install
   ```

2. **Environment Setup**
   Update `.env.local` with your actual Gemini API key:
   ```env
   #  Authentication (already configured)
   NEXT_PUBLIC__PUBLISHABLE_KEY=pk_test_cHJvbXB0LWVsZi03NS5jbGVyay5hY2NvdW50cy5kZXYk
   _SECRET_KEY=sk_test_LMckDjnjY0aeaiYpcAuULaTnezxZrmVmJ0l1Ff9dBY
   
   # Supabase (already configured)
   NEXT_PUBLIC_SUPABASE_URL=https://pxaeqwymrrygfnlmhbbu.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4YWVxd3ltcnJ5Z2ZubG1oYmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjU2MTQsImV4cCI6MjA3MDY0MTYxNH0.Z7JGzC7IymSPY2OKLkSVgL7RNVtmMai3cGslFVk0WV0
   
   # Gemini AI - UPDATE THIS WITH YOUR ACTUAL KEY
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Database Setup**
   The database schema is already configured in your Supabase project with:
   - `expenses` table (with receipt fields added, user_id as TEXT for  compatibility)
   - `categories` table (with default categories pre-loaded, user_id as TEXT)
   - `profiles` table
   - RLS disabled for prototype simplicity

4. **Run the application**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Getting Started
1. Sign up or sign in using email or Google OAuth
2. The app will automatically create default expense categories
3. Start adding expenses manually or upload receipt images

### Adding Expenses
- **Manual Entry**: Fill out the expense form with amount, description, category, and date
- **Receipt Upload**: Upload a receipt image and let AI extract the data automatically
- **Categories**: Choose from Office Supplies, Travel, Meals, Equipment, or Other

### Managing Expenses
- **View All**: Browse all expenses with search and filtering
- **Edit**: Update any expense details
- **Delete**: Remove expenses with confirmation
- **Filter**: Search by description, filter by category or date range

### Dashboard Features
- **Summary Stats**: Total monthly spending, expense count, averages
- **Recent Expenses**: Quick view of your latest transactions
- **Quick Actions**: Fast access to common tasks

## Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   ├── expenses/          # Expense pages
│   ├── layout.tsx         # Root layout with 
│   └── page.tsx           # Dashboard
├── components/            # React components
│   ├── dashboard-stats.tsx
│   ├── expense-form.tsx
│   ├── expenses-list.tsx
│   └── recent-expenses.tsx
├── lib/                   # Utilities
│   ├── gemini.ts         # AI receipt parsing
│   ├── supabase.ts       # Database client
│   └── utils.ts          # Helper functions
└── types/                # TypeScript definitions
    └── expense.ts
```

## Database Schema

### Expenses Table
```sql
- id (uuid, primary key)
- amount (numeric)
- description (text)
- category_id (uuid, foreign key)
- user_id (uuid, foreign key)  
- date (date)
- receipt_url (text, nullable)
- receipt_text (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### Categories Table
```sql
- id (uuid, primary key)
- name (text)
- color (text)
- icon (text)
- user_id (uuid, foreign key)
- created_at (timestamp)
- updated_at (timestamp)
```

## API Endpoints

- `POST /api/parse-receipt` - Upload and parse receipt images with Gemini AI

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features in Detail

### AI Receipt Parsing
Upload receipt images and the Gemini AI automatically extracts:
- Total amount
- Merchant/vendor name
- Transaction date  
- Brief description of items

### Responsive Design
- Mobile-first approach
- Optimized for phones, tablets, and desktop
- Touch-friendly interfaces
- Accessible components

### Security
- Row Level Security (RLS) enabled
- User isolation at database level
- Secure authentication with 
- Protected API routes

## Contributing

This is a complete expense tracker application. To extend functionality:

1. Add new expense categories
2. Implement expense reports/analytics
3. Add budget tracking features
4. Enhance AI parsing capabilities
5. Add export functionality (CSV, PDF)

## License

MIT License - feel free to use this project as a template for your own applications.