import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getCategoryColor(categoryName: string): string {
  const colors = {
    'Office Supplies': '#F97316', // orange
    'Travel': '#EC4899', // pink
    'Meals': '#F59E0B', // amber
    'Equipment': '#EF4444', // red
    'Other': '#F87171', // rose
  };
  
  return colors[categoryName as keyof typeof colors] || colors.Other;
}

export function getCategoryIcon(categoryName: string): string {
  const icons = {
    'Office Supplies': '📎',
    'Travel': '✈️',
    'Meals': '🍽️',
    'Equipment': '🔧',
    'Other': '📋',
  };
  
  return icons[categoryName as keyof typeof icons] || icons.Other;
}