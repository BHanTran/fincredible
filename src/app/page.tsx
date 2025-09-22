import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardStats from "@/components/dashboard-stats";
import RecentExpenses from "@/components/recent-expenses";
import SimpleDashboardWidgets from "@/components/simple-dashboard-widgets";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="px-2 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-rose-900">Dashboard</h1>
          <p className="text-rose-700">Wéll wèll! You're not broke — just supporting capitalism aggressively!</p>
        </div>
        <Link
          href="/expenses/add"
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-rose-600 to-rose-400 hover:from-rose-700 hover:to-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Link>
      </div>

      <div className="space-y-8">
        <DashboardStats userId={userId} />
        
        {/* Charts and Widgets Section */}
        <SimpleDashboardWidgets userId={userId} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentExpenses userId={userId} />
          </div>
          <div className="bg-white/80 rounded-xl border border-rose-200/60 p-6 shadow-lg">
            <h3 className="text-lg font-medium text-rose-900 mb-4">Quick Access</h3>
            <div className="grid grid-cols-1 gap-3">
              <Link
                href="/expenses/add"
                className="block w-full text-left p-3 rounded-lg border border-rose-200/60 hover:border-rose-300 hover:bg-rose-50/80 transition-colors text-rose-800"
              >
                <div className="font-medium text-rose-900">+ New expense</div>
                <div className="text-sm text-rose-600">Manually add a new expense</div>
              </Link>
              <Link
                href="/expenses"
                className="block w-full text-left p-3 rounded-lg border border-rose-200/60 hover:border-rose-300 hover:bg-rose-50/80 transition-colors text-rose-800"
              >
                <div className="font-medium text-rose-900">View All Expenses</div>
                <div className="text-sm text-rose-600">Browse and manage your expenses</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}