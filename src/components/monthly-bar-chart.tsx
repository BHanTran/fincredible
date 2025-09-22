"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { ExpenseWithCategory } from "@/types/expense";
import { formatCurrency } from "@/lib/utils";
import { format, subMonths, eachMonthOfInterval, startOfMonth } from "date-fns";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MonthlyBarChartProps {
  expenses: ExpenseWithCategory[];
}

export default function MonthlyBarChart({ expenses }: MonthlyBarChartProps) {
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

  if (monthlyData.every(m => m.amount === 0)) {
    return (
      <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
        <h3 className="text-lg font-medium text-rose-900 mb-4">Monthly Expenses</h3>
        <div className="flex items-center justify-center h-64 text-rose-600">
          No expenses to display
        </div>
      </div>
    );
  }

  const chartData = {
    labels: monthlyData.map(d => d.monthShort),
    datasets: [
      {
        label: 'Monthly Expenses',
        data: monthlyData.map(d => d.amount),
        backgroundColor: 'rgba(159, 100, 150, 0.85)', // mauve 500
        borderColor: '#9F6496',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(244, 63, 94, 0.9)',
        hoverBorderColor: '#7B466A',
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend for cleaner look
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
          title: function(context: any) {
            const index = context[0].dataIndex;
            return monthlyData[index].month;
          },
          label: function(context: any) {
            const index = context.dataIndex;
            const data = monthlyData[index];
            return [
              `Amount: ${formatCurrency(data.amount)}`,
              `Expenses: ${data.count}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#5D3C64',
          font: {
            size: 12,
            weight: 'normal' as const,
          },
        },
        border: {
          color: '#9F6496',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(159, 100, 150, 0.12)',
        },
        ticks: {
          color: '#5D3C64',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return formatCurrency(value);
          }
        },
        border: {
          color: '#9F6496',
        }
      }
    },
    elements: {
      bar: {
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0,
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    }
  };

  return (
    <div className="bg-white/80 border border-rose-200/60 rounded-xl p-6 shadow-lg backdrop-blur">
      <h3 className="text-lg font-medium text-rose-900 mb-4">Monthly Expenses</h3>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}