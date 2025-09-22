"use client";

import { useEffect, useState } from "react";
import { getExpensesWithCategories } from "@/lib/supabase";
import type { ExpenseWithCategory } from "@/types/expense";
import CategoryPieChart from "./category-pie-chart";
import MonthlyBarChart from "./monthly-bar-chart";

interface SimpleDashboardWidgetsProps {
  userId: string;
}

export default function SimpleDashboardWidgets({ userId }: SimpleDashboardWidgetsProps) {
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
            <div className="h-32 bg-rose-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Top Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart for Categories */}
        <CategoryPieChart expenses={expenses} />
        
        {/* Vertical Bar Chart for Monthly Data */}
        <MonthlyBarChart expenses={expenses} />
      </div>

    </div>
  );
}