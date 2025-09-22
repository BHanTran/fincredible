"use client";

import { useEffect, useState } from "react";
import { getExpensesWithCategories, deleteExpense } from "@/lib/supabase";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/utils";
import type { ExpenseWithCategory } from "@/types/expense";
import { Edit, Trash2, FileText } from "lucide-react";
import Link from "next/link";

interface RecentExpensesProps {
  userId: string;
}

export default function RecentExpenses({ userId }: RecentExpensesProps) {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const data = await getExpensesWithCategories(userId);
        setExpenses(data.slice(0, 10)); // Show only recent 10
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
  }, [userId]);

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }
    
    setDeleting(expenseId);
    try {
      await deleteExpense(expenseId);
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 rounded-xl border border-rose-200/60 shadow-lg">
        <div className="p-6 border-b border-rose-200/60">
          <h3 className="text-lg font-medium text-rose-900">Recent Expenses</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-rose-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-rose-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-rose-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-rose-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white/80 rounded-xl border border-rose-200/60 shadow-lg">
        <div className="p-6 border-b border-rose-200/60">
          <h3 className="text-lg font-medium text-rose-900">Recent Expenses</h3>
        </div>
        <div className="p-6 text-center">
          <FileText className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <p className="text-rose-600">No expenses yet. Add your first expense to get started!</p>
          <Link
            href="/expenses/add"
            className="mt-4 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-rose-600 to-rose-400 hover:from-rose-700 hover:to-rose-500 shadow-lg"
          >
            Add Expense
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 rounded-xl border border-rose-200/60 shadow-lg backdrop-blur">
      <div className="p-6 border-b border-rose-200/60 flex justify-between items-center">
        <h3 className="text-lg font-medium text-rose-900">Recent Expenses</h3>
        <Link
          href="/expenses"
          className="text-sm text-rose-500 hover:text-rose-700 font-medium"
        >
          View all
        </Link>
      </div>
      <div className="divide-y divide-rose-200/40">
        {expenses.map((expense) => (
          <div key={expense.id} className="p-6 flex items-center justify-between hover:bg-rose-50/60 transition-colors">
            <div className="flex items-center space-x-4 flex-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: expense.category?.color || '#F87171' }}
              >
                {expense.category?.name?.charAt(0) || 'E'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-rose-900 truncate">
                  {expense.description || 'No description'}
                </p>
                <div className="flex items-center space-x-2 text-xs text-rose-600">
                  <span>{expense.category?.name || 'Uncategorized'}</span>
                  <span>•</span>
                  <span>{formatDate(expense.date || new Date().toISOString())}</span>
                  {expense.receipt_url && (
                    <>
                      <span>•</span>
                      <FileText className="h-3 w-3" />
                      <span>Receipt</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-rose-900">
                {formatCurrency(Number(expense.amount || 0))}
              </span>
              <div className="flex space-x-2">
                <Link
                  href={`/expenses/${expense.id}/edit`}
                  className="text-rose-400 hover:text-rose-600"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button 
                  onClick={() => handleDeleteExpense(expense.id)}
                  disabled={deleting === expense.id}
                  className={`${deleting === expense.id ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-600'} text-rose-400`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}