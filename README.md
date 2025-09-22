# Fincredible

A modern, full-stack reimbursement tracking application built with Next.js 15, Supabase, Clerk authentication, and AI-powered receipt parsing using Google's Gemini AI.

## Features

- 🔐 **Authentication**: Secure login with Clerk (email + Google OAuth)
- 📊 **Dashboard**: Comprehensive expense overview with statistics
- 💰 **Expense Management**: Add, edit, delete expenses with categories
- 🤖 **AI Receipt Parsing**: Upload receipt images for automatic data extraction
- 🔍 **Search & Filter**: Find expenses by category, date range, or description  
- 📱 **Responsive Design**: Works perfectly on mobile and desktop
- 🎨 **Professional UI**: Clean, modern interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **AI**: Google Gemini AI for receipt parsing
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Clerk account
- Google AI API key (for Gemini)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/yourusername/fincredible.git
   cd fincredible
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file with your credentials:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Gemini AI
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Database Setup**
   The database schema is already configured in your Supabase project with:
   - `expenses` table (with receipt fields added, user_id as TEXT for Clerk compatibility)
   - `categories` table (with default categories pre-loaded, user_id as TEXT)
   - `profiles` table
   - RLS disabled for prototype simplicity

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
│   ├── layout.tsx         # Root layout with Clerk
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
- Secure authentication with Clerk
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
