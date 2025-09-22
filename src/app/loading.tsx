import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600 mx-auto mb-4" />
        <p className="text-rose-700">Loading...</p>
      </div>
    </div>
  );
}