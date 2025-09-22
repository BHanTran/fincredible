"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { ExpenseWithCategory } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";

interface ExpenseCategoryChartProps {
  expenses: ExpenseWithCategory[];
}

const COLORS = [
  "#9F6496",
  "#D391B0",
  "#BA6E8F",
  "#7B466A",
  "#5D3C64",
  "#3E2A45",
  "#C89EBB",
  "#DCBCD3",
];

export default function ExpenseCategoryChart({ expenses }: ExpenseCategoryChartProps) {
  // Group expenses by category and calculate totals
  const categoryData = expenses.reduce((acc, expense) => {
    const categoryName = expense.category?.name || "Uncategorized";
    const amount = Number(expense.amount || 0);
    
    if (acc[categoryName]) {
      acc[categoryName] += amount;
    } else {
      acc[categoryName] = amount;
    }
    
    return acc;
  }, {} as Record<string, number>);

  // Convert to array format for Recharts
  const chartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
        <h3 className="text-lg font-medium text-rose-900 mb-4">Expenses by Category</h3>
        <div className="flex items-center justify-center h-64 text-rose-600">
          No expenses to display
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white/95 backdrop-blur border border-rose-200 rounded-lg p-3 shadow-lg">
          <p className="text-rose-900 font-medium">{data.name}</p>
          <p className="text-rose-700">
            <span className="font-semibold">{formatCurrency(data.value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
      <h3 className="text-lg font-medium text-rose-900 mb-4">Expenses by Category</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => <span className="text-rose-700">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}