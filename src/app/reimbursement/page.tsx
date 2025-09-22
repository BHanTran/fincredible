import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ReimbursementUpload from "@/components/reimbursement-upload";

export default async function ReimbursementPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="px-2 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-rose-900">Reimbursement</h1>
          <p className="text-rose-700">Upload and manage reimbursement data from CSV files</p>
        </div>
      </div>

      <div className="space-y-8">
        <ReimbursementUpload userId={userId} />
      </div>
    </div>
  );
}