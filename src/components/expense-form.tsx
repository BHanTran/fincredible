"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createExpense, updateExpense, getCategoriesForUser, createCategory } from "@/lib/supabase";
import type { ExpenseWithCategory } from "@/types/expense";
import type { Category } from "@/types/expense";
import { Upload, Loader2, X } from "lucide-react";
import Image from "next/image";

interface ExpenseFormProps {
  userId: string;
  expense?: ExpenseWithCategory;
}

const DEFAULT_CATEGORIES = [
  { name: 'Office Supplies', color: '#3B82F6', icon: '📎' },
  { name: 'Travel', color: '#10B981', icon: '✈️' },
  { name: 'Meals', color: '#F59E0B', icon: '🍽️' },
  { name: 'Equipment', color: '#8B5CF6', icon: '🔧' },
  { name: 'Other', color: '#881337', icon: '📋' },
];

export default function ExpenseForm({ userId, expense }: ExpenseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    amount: expense?.amount?.toString() || "",
    description: expense?.description || "",
    category_id: expense?.category_id || "",
    date: expense?.date || new Date().toISOString().split('T')[0],
    receipt_url: expense?.receipt_url || "",
    receipt_text: expense?.receipt_text || "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currencyInfo, setCurrencyInfo] = useState<{
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    exchangeRate: number;
  } | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        // First try to get user-specific categories
        let userCategories = await getCategoriesForUser(userId);
        
        // If no user-specific categories exist, try to get default categories
        if (userCategories.length === 0) {
          const defaultCategories = await getCategoriesForUser('default_user');
          
          if (defaultCategories.length > 0) {
            // Use default categories as fallback
            setCategories(defaultCategories);
            return;
          }
          
          // If no default categories either, create user-specific ones
          for (const defaultCat of DEFAULT_CATEGORIES) {
            await createCategory({
              ...defaultCat,
              user_id: userId
            });
          }
          userCategories = await getCategoriesForUser(userId);
        }
        
        setCategories(userCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
        // Fallback: try to get default categories
        try {
          const defaultCategories = await getCategoriesForUser('default_user');
          setCategories(defaultCategories);
        } catch (fallbackError) {
          console.error("Error loading fallback categories:", fallbackError);
        }
      }
    }
    
    loadCategories();
  }, [userId]);

  const handleReceiptUpload = async (file: File) => {
    if (!file) return;

    setUploadingReceipt(true);
    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setReceiptPreview(preview);
      setReceiptFile(file);

      // Call the API endpoint to parse the receipt
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse receipt');
      }

      const parsedData = await response.json();
      
      // Update form with parsed data (use USD converted amount)
      if (parsedData.amountUSD) {
        setFormData(prev => ({ ...prev, amount: parsedData.amountUSD?.toString() || "" }));
      }

      // Store currency conversion info for display
      if (parsedData.currency && parsedData.currency !== 'USD' && parsedData.amount && parsedData.amountUSD) {
        const exchangeRate = Math.round(parsedData.amount / parsedData.amountUSD);
        setCurrencyInfo({
          originalAmount: parsedData.amount,
          originalCurrency: parsedData.currency,
          convertedAmount: parsedData.amountUSD,
          exchangeRate: exchangeRate,
        });
        console.log(`Converted ${parsedData.amount} ${parsedData.currency} → $${parsedData.amountUSD} USD`);
      } else {
        setCurrencyInfo(null); // Clear if USD or no conversion needed
      }
      if (parsedData.description) {
        setFormData(prev => ({ ...prev, description: parsedData.description || "" }));
      }
      if (parsedData.date) {
        setFormData(prev => ({ ...prev, date: parsedData.date || "" }));
      }
      if (parsedData.category) {
        // Find matching category by name
        const matchingCategory = categories.find(cat => 
          cat.name.toLowerCase() === parsedData.category?.toLowerCase()
        );
        if (matchingCategory) {
          setFormData(prev => ({ ...prev, category_id: matchingCategory.id }));
        }
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
      if (error instanceof Error && error.message.includes('API Key')) {
        alert("Receipt parsing is unavailable. Please check your Gemini API key configuration. You can still manually enter the expense details.");
      } else {
        alert("Error processing receipt. Please try again or manually enter the expense details.");
      }
    } finally {
      setUploadingReceipt(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Only validate amount if it's provided and ensure it's valid
    if (formData.amount && (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0)) {
      newErrors.amount = "Please enter a valid amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const expenseData = {
        amount: formData.amount ? Number(formData.amount) : null,
        description: formData.description.trim() || null,
        category_id: formData.category_id || null,
        user_id: userId,
        date: formData.date || null,
        receipt_url: formData.receipt_url || null,
        receipt_text: formData.receipt_text || null,
      };

      if (expense) {
        await updateExpense(expense.id, expenseData);
      } else {
        await createExpense(expenseData);
      }

      router.push("/expenses");
      router.refresh();
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Error saving expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Processing Status */}
      {uploadingReceipt && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin mr-3" />
            <div>
              <p className="text-blue-300 font-medium">AI is processing your receipt...</p>
              <p className="text-blue-400 text-sm">Form fields will be auto-filled when complete</p>
            </div>
          </div>
        </div>
      )}
      {/* Receipt Upload */}
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Receipt Upload (Optional)
        </label>
        {!receiptPreview ? (
          <div className="border-2 border-dashed border-neutral-800 rounded-lg p-6 text-center bg-neutral-950">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleReceiptUpload(e.target.files[0])}
              className="hidden"
              id="receipt-upload"
              disabled={uploadingReceipt}
            />
            <label htmlFor="receipt-upload" className="cursor-pointer">
              {uploadingReceipt ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-neutral-500 animate-spin mr-2" />
                  <span className="text-neutral-400">Processing receipt...</span>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 text-neutral-500 mx-auto mb-2" />
                  <span className="text-neutral-400">
                    Upload a receipt image for AI parsing
                  </span>
                </div>
              )}
            </label>
          </div>
        ) : (
          <div className="relative">
            <Image
              src={receiptPreview}
              alt="Receipt preview"
              className="max-h-48 mx-auto rounded-lg"
              width={300}
              height={200}
              style={{ objectFit: 'contain' }}
            />
            <button
              type="button"
              onClick={removeReceipt}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-neutral-300">
          Amount
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-neutral-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => {
              setFormData({ ...formData, amount: e.target.value });
              // Clear currency info when user manually edits amount
              setCurrencyInfo(null);
            }}
            className={`block w-full pl-7 pr-12 sm:text-sm border rounded-md bg-neutral-950 text-neutral-200 ${
              errors.amount ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-neutral-800 focus:ring-emerald-500 focus:border-emerald-500'
            }`}
            placeholder="0.00"
          />
        </div>
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
        {currencyInfo && (
          <p className="mt-1 text-sm text-blue-400">
            💱 Exchange Rate: 1 USD = {currencyInfo.exchangeRate.toLocaleString()} {currencyInfo.originalCurrency}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-300">
          Description
        </label>
        <input
          type="text"
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={`mt-1 block w-full sm:text-sm border rounded-md bg-neutral-950 text-neutral-200 ${
            errors.description ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-neutral-800 focus:ring-emerald-500 focus:border-emerald-500'
          } px-3 py-2`}
          placeholder="Enter expense description"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-neutral-300">
          Category
        </label>
        <select
          id="category_id"
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          className={`mt-1 block w-full sm:text-sm border rounded-md bg-neutral-950 text-neutral-200 ${
            errors.category_id ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-neutral-800 focus:ring-emerald-500 focus:border-emerald-500'
          } px-3 py-2`}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
        {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-neutral-300">
          Date
        </label>
        <input
          type="date"
          id="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className={`mt-1 block w-full sm:text-sm border rounded-md bg-neutral-950 text-neutral-200 ${
            errors.date ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-neutral-800 focus:ring-emerald-500 focus:border-emerald-500'
          } px-3 py-2`}
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-neutral-800 rounded-md text-sm font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-neutral-950"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploadingReceipt}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(loading || uploadingReceipt) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {uploadingReceipt ? "Processing Receipt..." : loading ? "Saving..." : expense ? "Update Expense" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}