import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ExpensesList from "@/components/expenses-list";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ExpensesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="px-2 sm:px-0 py-2">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-rose-900">All Expenses</h1>
          <p className="text-rose-700">Manage and track all your expenses</p>
        </div>
        <Link
          href="/expenses/add"
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-rose-600 to-rose-400 hover:from-rose-700 hover:to-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Link>
      </div>

      <ExpensesList userId={userId} />
    </div>
  );
}