"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from "chart.js";
import { Pie } from "react-chartjs-2";
import type { ExpenseWithCategory } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

interface CategoryPieChartProps {
  expenses: ExpenseWithCategory[];
}

export default function CategoryPieChart({ expenses }: CategoryPieChartProps) {
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

  // Convert to chart data format
  const chartEntries = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6); // Top 6 categories

  if (chartEntries.length === 0) {
    return (
      <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
        <h3 className="text-lg font-medium text-rose-900 mb-4">Expenses by Category</h3>
        <div className="flex items-center justify-center h-64 text-rose-600">
          No expenses to display
        </div>
      </div>
    );
  }

  const colors = [
    "#9F6496",
    "#D391B0",
    "#BA6E8F",
    "#7B466A",
    "#5D3C64",
    "#3E2A45",
  ];

  const chartData = {
    labels: chartEntries.map(([name]) => name),
    datasets: [
      {
        data: chartEntries.map(([, amount]) => amount),
        backgroundColor: colors,
        borderColor: colors.map(color => color + "80"),
        borderWidth: 2,
        hoverBackgroundColor: colors.map(color => color + "CC"),
        hoverBorderColor: colors,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
          color: '#5D3C64',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
         titleColor: '#5D3C64',
         bodyColor: '#7B466A',
         borderColor: '#9F6496',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderRadius: 4,
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    }
  };

  return (
    <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
      <h3 className="text-lg font-medium text-rose-900 mb-4">Expenses by Category</h3>
      <div className="h-64">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}