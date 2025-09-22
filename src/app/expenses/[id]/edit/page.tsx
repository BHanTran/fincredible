import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getExpenseById } from "@/lib/supabase";
import ExpenseForm from "@/components/expense-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EditExpensePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const expense = await getExpenseById(id, userId);
  
  if (!expense) {
    redirect("/expenses");
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-0 py-2">
      <div className="mb-6">
        <Link
          href="/expenses"
          className="inline-flex items-center text-sm text-neutral-400 hover:text-neutral-200 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Expenses
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Expense</h1>
        <p className="text-neutral-400">Update expense details</p>
      </div>

      <div className="bg-rose-400/70 border border-neutral-800 rounded-xl p-6">
        <ExpenseForm userId={userId} expense={expense} />
      </div>
    </div>
  );
}