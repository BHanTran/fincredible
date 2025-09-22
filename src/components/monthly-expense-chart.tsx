"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ExpenseWithCategory } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { format, subMonths, eachMonthOfInterval, startOfMonth } from "date-fns";

interface MonthlyExpenseChartProps {
  expenses: ExpenseWithCategory[];
}

export default function MonthlyExpenseChart({ expenses }: MonthlyExpenseChartProps) {
  // Get last 6 months including current month
  const currentDate = new Date();
  const sixMonthsAgo = subMonths(currentDate, 5);
  
  const months = eachMonthOfInterval({
    start: startOfMonth(sixMonthsAgo),
    end: startOfMonth(currentDate)
  });

  // Group expenses by month
  const monthlyData = months.map(month => {
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date || new Date());
      return expenseDate.getMonth() === month.getMonth() && 
             expenseDate.getFullYear() === month.getFullYear();
    });

    const total = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      month: format(month, "MMM yyyy"),
      monthShort: format(month, "MMM"),
      amount: total,
      count: monthExpenses.length
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur border border-rose-200 rounded-lg p-3 shadow-lg">
          <p className="text-rose-900 font-medium">{data.month}</p>
          <p className="text-rose-700">
            <span className="font-semibold">{formatCurrency(data.amount)}</span>
          </p>
          <p className="text-rose-600 text-sm">
            {data.count} expense{data.count !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const maxAmount = Math.max(...monthlyData.map(d => d.amount));

  return (
    <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
      <h3 className="text-lg font-medium text-rose-900 mb-4">Monthly Expenses</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3D6E0" />
            <XAxis 
              dataKey="monthShort" 
              tick={{ fontSize: 12, fill: "#5D3C64" }}
              axisLine={{ stroke: "#9F6496" }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "#5D3C64" }}
              axisLine={{ stroke: "#9F6496" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="amount" 
              fill="url(#colorGradient)"
              radius={[4, 4, 0, 0]}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9F6496" />
                <stop offset="100%" stopColor="#D391B0" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}