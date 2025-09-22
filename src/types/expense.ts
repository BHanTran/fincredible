export type ExpenseCategory = 'Office Supplies' | 'Travel' | 'Meals' | 'Equipment' | 'Other';

export interface Expense {
  id: string;
  amount: number | null;
  description: string | null;
  category_id: string | null;
  user_id: string;
  date: string | null;
  receipt_url?: string | null;
  receipt_text?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithCategory extends Expense {
  category?: Category;
}

export interface ExpenseSummary {
  totalAmount: number;
  totalExpenses: number;
  categoryTotals: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}