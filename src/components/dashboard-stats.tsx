"use client";

import { useEffect, useState } from "react";
import { getExpensesWithCategories } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import type { ExpenseWithCategory } from "@/types/expense";
import { TrendingUp, DollarSign, Receipt, Calendar } from "lucide-react";
import { format, subMonths, eachMonthOfInterval } from "date-fns";

interface DashboardStatsProps {
  userId: string;
}

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

export default function DashboardStats({ userId }: DashboardStatsProps) {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([]);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const data = await getExpensesWithCategories(userId);
        setExpenses(data);
        
        // Calculate stats
        const currentMonth = new Date();
        const lastMonth = subMonths(currentMonth, 1);
        
        const currentMonthExpenses = data.filter(expense => {
          const expenseDate = new Date(expense.date || new Date());
          return expenseDate.getMonth() === currentMonth.getMonth() && 
                 expenseDate.getFullYear() === currentMonth.getFullYear();
        });
        
        const lastMonthExpenses = data.filter(expense => {
          const expenseDate = new Date(expense.date || new Date());
          return expenseDate.getMonth() === lastMonth.getMonth() && 
                 expenseDate.getFullYear() === lastMonth.getFullYear();
        });

        const currentTotal = currentMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
        const lastTotal = lastMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
        const totalChange = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

        const totalExpenses = data.length;
        const avgPerExpense = totalExpenses > 0 ? data.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) / totalExpenses : 0;

        setStats([
          {
            title: "Total This Month",
            value: formatCurrency(currentTotal),
            change: `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(1)}% from last month`,
            icon: <DollarSign className="h-6 w-6" />,
            color: totalChange >= 0 ? "text-rose-700" : "text-green-600"
          },
          {
            title: "Total Expenses",
            value: totalExpenses.toString(),
            change: `${currentMonthExpenses.length} this month`,
            icon: <Receipt className="h-6 w-6" />,
            color: "text-rose-600"
          },
          {
            title: "Average Per Expense",
            value: formatCurrency(avgPerExpense),
            change: "Across all expenses",
            icon: <TrendingUp className="h-6 w-6" />,
            color: "text-rose-500"
          },
          {
            title: "Last Expense",
            value: data.length > 0 ? (() => {
              try {
                return format(new Date(data[0].date || new Date()), "MMM dd");
              } catch (e) {
                return "Invalid date";
              }
            })() : "No expenses",
            change: data.length > 0 ? (data[0].description || 'No description').substring(0, 30) + "..." : "",
            icon: <Calendar className="h-6 w-6" />,
            color: "text-rose-400"
          }
        ]);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchExpenses();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/80 border border-rose-200/60 rounded-xl p-6 animate-pulse shadow-lg">
            <div className="h-4 bg-rose-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-rose-200 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-rose-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-600">{stat.title}</p>
              <p className="text-2xl font-bold text-rose-900">{stat.value}</p>
              <p className={`text-xs mt-1 ${stat.color.replace('text-', 'text-')}`}>{stat.change}</p>
            </div>
            <div className={`p-3 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 ${stat.color.replace('text-', 'text-')}`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}