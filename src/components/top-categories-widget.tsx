"use client";

import type { ExpenseWithCategory } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign } from "lucide-react";

interface TopCategoriesWidgetProps {
  expenses: ExpenseWithCategory[];
}

export default function TopCategoriesWidget({ expenses }: TopCategoriesWidgetProps) {
  // Group expenses by category and calculate totals
  const categoryData = expenses.reduce((acc, expense) => {
    const categoryName = expense.category?.name || "Uncategorized";
    const amount = Number(expense.amount || 0);
    
    if (acc[categoryName]) {
      acc[categoryName].total += amount;
      acc[categoryName].count += 1;
    } else {
      acc[categoryName] = { total: amount, count: 1 };
    }
    
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Convert to array and sort by total spending
  const topCategories = Object.entries(categoryData)
    .map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
      average: data.total / data.count
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const totalSpending = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  if (topCategories.length === 0) {
    return (
      <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
        <h3 className="text-lg font-medium text-rose-900 mb-4">Top Categories</h3>
        <div className="flex items-center justify-center h-32 text-rose-600">
          No expenses to display
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-rose-900">Top Categories</h3>
        <TrendingUp className="h-5 w-5 text-rose-600" />
      </div>
      
      <div className="space-y-3">
        {topCategories.map((category, index) => {
          const percentage = totalSpending > 0 ? (category.total / totalSpending) * 100 : 0;
          
          return (
            <div key={category.name} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-rose-900 truncate">
                  {index + 1}. {category.name}
                </span>
                <span className="text-sm font-semibold text-rose-700">
                  {formatCurrency(category.total)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-rose-600 mb-2">
                <span>{category.count} expense{category.count !== 1 ? 's' : ''}</span>
                <span>{percentage.toFixed(1)}% of total</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-rose-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-rose-600 to-rose-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-rose-200/60">
        <div className="flex items-center justify-between text-sm">
          <span className="text-rose-600">Total Spending</span>
          <span className="font-semibold text-rose-900">{formatCurrency(totalSpending)}</span>
        </div>
      </div>
    </div>
  );
}