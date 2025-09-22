"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getExpensesWithCategories } from "@/lib/supabase";
import type { ExpenseWithCategory } from "@/types/expense";

// Dynamic imports to avoid SSR issues with Recharts
const ExpenseCategoryChart = dynamic(() => import("./expense-category-chart"), { 
  ssr: false,
  loading: () => (
    <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
      <div className="h-4 bg-rose-200 rounded w-3/4 mb-4 animate-pulse"></div>
      <div className="h-64 bg-rose-200 rounded animate-pulse"></div>
    </div>
  )
});

const MonthlyExpenseChart = dynamic(() => import("./monthly-expense-chart"), { 
  ssr: false,
  loading: () => (
    <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
      <div className="h-4 bg-rose-200 rounded w-3/4 mb-4 animate-pulse"></div>
      <div className="h-64 bg-rose-200 rounded animate-pulse"></div>
    </div>
  )
});

import TopCategoriesWidget from "./top-categories-widget";
import SpendingTrendsWidget from "./spending-trends-widget";

interface DashboardWidgetsProps {
  userId: string;
}

export default function DashboardWidgets({ userId }: DashboardWidgetsProps) {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const data = await getExpensesWithCategories(userId);
        setExpenses(data);
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/80 border border-rose-200/60 rounded-xl p-6 animate-pulse shadow-lg">
            <div className="h-4 bg-rose-200 rounded w-3/4 mb-4"></div>
            <div className="h-48 bg-rose-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseCategoryChart expenses={expenses} />
        <MonthlyExpenseChart expenses={expenses} />
      </div>
      
      {/* Bottom Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <TopCategoriesWidget expenses={expenses} />
        <SpendingTrendsWidget expenses={expenses} />
        <div className="xl:col-span-1 lg:col-span-2 xl:col-span-1">
          {/* This space can be used for additional widgets in the future */}
        </div>
      </div>
    </div>
  );
}