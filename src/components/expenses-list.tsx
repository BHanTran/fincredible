"use client";

import { useEffect, useState } from "react";
import { getExpensesWithCategories, deleteExpense, getCategoriesForUser } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseWithCategory, Category } from "@/types/expense";
import { Edit, Trash2, FileText, Search, Filter, ChevronDown } from "lucide-react";
import Link from "next/link";

interface ExpensesListProps {
  userId: string;
}

export default function ExpensesList({ userId }: ExpensesListProps) {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [expensesData, categoriesData] = await Promise.all([
          getExpensesWithCategories(userId),
          getCategoriesForUser(userId)
        ]);
        setExpenses(expensesData);
        setFilteredExpenses(expensesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  useEffect(() => {
    let filtered = expenses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(expense => expense.category_id === selectedCategory);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(expense => expense.date && expense.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(expense => expense.date && expense.date <= dateRange.end);
    }

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, selectedCategory, dateRange]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      await deleteExpense(id);
      setExpenses(expenses.filter(expense => expense.id !== id));
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error deleting expense. Please try again.");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setDateRange({ start: "", end: "" });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-rose-100/80 to-rose-200/70 border border-neutral-800 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-800 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-neutral-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-rose-200/70 border border-rose-300/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-rose-900">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm text-rose-600 hover:text-neutral-200"
          >
            <Filter className="h-4 w-4 mr-1" />
            {showFilters ? "Hide" : "Show"} Filters
            <ChevronDown className={`h-4 w-4 ml-1 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-rose-300/50 rounded-md leading-5 bg-gradient-to-r from-rose-600 to-rose-400 text-white placeholder-rose-900 focus:outline-none focus:placeholder-neutral-400 focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full border border-neutral-800 rounded-md px-3 py-2 bg-neutral-950 text-neutral-200 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="block w-full border border-neutral-800 rounded-md px-3 py-2 bg-neutral-950 text-neutral-200 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="block w-full border border-neutral-800 rounded-md px-3 py-2 bg-neutral-950 text-neutral-200 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {(searchTerm || selectedCategory || dateRange.start || dateRange.end) && (
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="text-sm text-rose-900 hover:text-rose-600"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="bg-rose-200/70 border border-rose-300/50 rounded-xl p-4">
        <div className="flex justify-between items-center text-sm text-rose-600">
          <span>
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </span>
          <span>
            Total: {formatCurrency(filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0))}
          </span>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-rose-200/70 border border-rose-300/50 rounded-xl overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
            <p className="text-rose-600">
              {expenses.length === 0 ? "No expenses yet. Add your first expense to get started!" : "No expenses match your current filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="p-6 hover:bg-rose-400/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-rose-900 font-medium"
                      style={{ backgroundColor: expense.category?.color || '#881337' }}
                    >
                      {expense.category?.icon || expense.category?.name?.charAt(0) || 'E'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-white">
                        {expense.description || 'No description'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-neutral-400 mt-1">
                        <span className="bg-rose-700 px-2 py-1 rounded-full">
                          {expense.category?.name || 'Uncategorized'}
                        </span>
                        <span>{formatDate(expense.date || new Date().toISOString())}</span>
                        {expense.receipt_url && (
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            <span>Receipt attached</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xl font-semibold text-white">
                        {formatCurrency(Number(expense.amount || 0))}
                      </div>
                      <div className="text-sm text-neutral-400">
                        {formatDate(expense.created_at)}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/expenses/${expense.id}/edit`}
                        className="p-2 text-neutral-400 hover:text-rose-900 rounded-full transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 rounded-full transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}