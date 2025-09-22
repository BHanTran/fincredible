"use client";

import type { ExpenseWithCategory } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface SpendingTrendsWidgetProps {
  expenses: ExpenseWithCategory[];
}

export default function SpendingTrendsWidget({ expenses }: SpendingTrendsWidgetProps) {
  const currentMonth = new Date();
  const lastMonth = subMonths(currentMonth, 1);
  const twoMonthsAgo = subMonths(currentMonth, 2);

  // Calculate spending for different periods
  const getCurrentMonthSpending = () => {
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date || new Date());
        return expenseDate >= startOfMonth(currentMonth) && expenseDate <= endOfMonth(currentMonth);
      })
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  };

  const getLastMonthSpending = () => {
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date || new Date());
        return expenseDate >= startOfMonth(lastMonth) && expenseDate <= endOfMonth(lastMonth);
      })
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  };

  const getTwoMonthsAgoSpending = () => {
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date || new Date());
        return expenseDate >= startOfMonth(twoMonthsAgo) && expenseDate <= endOfMonth(twoMonthsAgo);
      })
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  };

  const currentMonthTotal = getCurrentMonthSpending();
  const lastMonthTotal = getLastMonthSpending();
  const twoMonthsAgoTotal = getTwoMonthsAgoSpending();

  // Calculate trends
  const monthOverMonthChange = lastMonthTotal > 0 
    ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
    : 0;

  const previousMonthChange = twoMonthsAgoTotal > 0 
    ? ((lastMonthTotal - twoMonthsAgoTotal) / twoMonthsAgoTotal) * 100 
    : 0;

  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="h-4 w-4 text-rose-600" />;
    if (change < -5) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 5) return "text-rose-700";
    if (change < -5) return "text-green-600";
    return "text-gray-600";
  };

  return (
    <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-rose-900">Spending Trends</h3>
        <DollarSign className="h-5 w-5 text-rose-600" />
      </div>
      
      <div className="space-y-4">
        {/* Current Month */}
        <div className="bg-rose-50/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-700">
                {format(currentMonth, "MMMM yyyy")}
              </p>
              <p className="text-xl font-bold text-rose-900">
                {formatCurrency(currentMonthTotal)}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(monthOverMonthChange)}
              <span className={`text-sm font-medium ${getTrendColor(monthOverMonthChange)}`}>
                {monthOverMonthChange >= 0 ? '+' : ''}{monthOverMonthChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-rose-600 mt-1">
            vs {format(lastMonth, "MMM yyyy")}
          </p>
        </div>

        {/* Last Month */}
        <div className="bg-rose-50/40 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-700">
                {format(lastMonth, "MMMM yyyy")}
              </p>
              <p className="text-lg font-semibold text-rose-900">
                {formatCurrency(lastMonthTotal)}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(previousMonthChange)}
              <span className={`text-sm ${getTrendColor(previousMonthChange)}`}>
                {previousMonthChange >= 0 ? '+' : ''}{previousMonthChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-rose-600 mt-1">
            vs {format(twoMonthsAgo, "MMM yyyy")}
          </p>
        </div>

        {/* Average */}
        <div className="pt-3 border-t border-rose-200/60">
          <div className="flex items-center justify-between">
            <span className="text-sm text-rose-600">3-Month Average</span>
            <span className="text-sm font-semibold text-rose-900">
              {formatCurrency((currentMonthTotal + lastMonthTotal + twoMonthsAgoTotal) / 3)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}