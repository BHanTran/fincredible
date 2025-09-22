import type { Metadata } from "next";
import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import "./globals.css";
import { Inter } from "next/font/google";
import Sidebar from "@/components/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fincredible - Expense Tracker",
  description: "Track and manage your expenses with AI-powered receipt parsing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className} suppressHydrationWarning={true}>
          <SignedOut>
            <div className="min-h-screen flex items-center justify-center bg-rose-50">
              <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                  <h2 className="text-3xl font-extrabold text-rose-900">
                    Welcome to Fincredible
                  </h2>
                  <p className="mt-2 text-sm text-rose-700">
                    Sign in to manage your expenses
                  </p>
                </div>
                <div className="flex flex-col space-y-4">
                  <SignInButton mode="modal">
                    <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="w-full flex justify-center py-2 px-4 border border-rose-300 rounded-md shadow-sm text-sm font-medium text-rose-800 bg-white hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          </SignedOut>
          
          <SignedIn>
            <div className="min-h-screen app-gradient text-rose-950">
              <div className="w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="rounded-3xl overflow-hidden bg-white/90 backdrop-blur border border-rose-200/50 shadow-2xl shadow-rose-200/20">
                  <div className="flex">
                    <Sidebar />
                    <main className="flex-1 p-6 md:p-8 bg-gradient-to-br from-rose-50/80 to-rose-100/60 min-h-[80vh] overflow-x-auto">
                      {children}
                    </main>
                  </div>
                </div>
              </div>
            </div>
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}