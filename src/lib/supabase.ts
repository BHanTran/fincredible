import { createClient } from '@supabase/supabase-js';
import type { Expense, Category, ExpenseWithCategory } from '@/types/expense';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

export async function getExpensesWithCategories(userId: string): Promise<ExpenseWithCategory[]> {
  console.log('Fetching expenses for userId:', userId);

  // First get expenses
  const { data: expensesData, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  console.log('Expenses data:', { expensesData, expensesError });

  if (expensesError) {
    console.error('Error fetching expenses:', expensesError);
    throw expensesError;
  }

  if (!expensesData || expensesData.length === 0) {
    console.log('No expenses found for user');
    return [];
  }

  // Get categories
  const { data: categoriesData, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  console.log('Categories data:', { categoriesData, categoriesError });

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    throw categoriesError;
  }

  // Manual join
  const expensesWithCategories = expensesData.map(expense => ({
    ...expense,
    category: categoriesData?.find(cat => cat.id === expense.category_id) || null
  }));

  console.log('Final mapped expenses:', expensesWithCategories);
  return expensesWithCategories;
}

export async function getExpenseById(id: string, userId: string): Promise<ExpenseWithCategory | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      categories(*)
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching expense:', error);
    return null;
  }

  // Map the response to match expected structure
  return data ? {
    ...data,
    category: data.categories
  } : null;
}

export async function createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<Expense | null> {
  console.log('Creating expense with data:', expense);

  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single();

  console.log('Supabase createExpense response:', { data, error });

  if (error) {
    console.error('Error creating expense:', error);
    throw error;
  }

  return data;
}

export async function updateExpense(id: string, expense: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .update(expense)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating expense:', error);
    throw error;
  }

  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
}

export async function getCategoriesForUser(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }

  return data;
}