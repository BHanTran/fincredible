"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import {
  Home,
  Wallet,
  Settings,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const items: NavItem[] = [
    { label: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
    { label: "Expenses", href: "/expenses", icon: <Wallet className="h-4 w-4" /> },
    { label: "Reimbursement", href: "/reimbursement", icon: <Receipt className="h-4 w-4" /> },
    { label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <aside className={`hidden md:flex md:flex-col flex-shrink-0 bg-gradient-to-b from-rose-100/80 to-rose-200/70 text-rose-800 rounded-l-3xl border-r border-rose-200/60 transition-all duration-300 ${
      isCollapsed ? "md:w-16" : "md:w-64"
    }`}>
      {/* Header with toggle button */}
      <div className={`p-6 flex items-center border-b border-rose-200/60 ${isCollapsed ? "justify-center" : "space-x-3"}`}>
        {!isCollapsed && (
          <>
            <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-rose-300/60">
              <UserButton appearance={{ elements: { userButtonAvatarBox: "h-10 w-10" } }} />
            </div>
            <div className="leading-tight flex-1">
              <div className="text-sm text-rose-700 font-medium">{user?.fullName || "Welcome"}</div>
              <div className="text-xs text-rose-500/90 font-semibold">Fincredible</div>
            </div>
          </>
        )}
        {isCollapsed && (
          <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-rose-300/60">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "h-10 w-10" } }} />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-rose-200/60 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="p-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg transition-colors ${
                isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2"
              } ${
                active
                  ? "bg-rose-200/80 text-rose-900 border border-rose-300/50 shadow-sm"
                  : "text-rose-600 hover:text-rose-800 hover:bg-rose-100/60"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="mt-auto p-4 border-t border-rose-200/60">
          <div className="text-xs text-rose-500/70 font-semibold">FINCREDIBLE</div>
          <div className="text-lg font-semibold tracking-wide text-rose-400">·</div>
        </div>
      )}
    </aside>
  );
}




