"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Database,
  BarChart3,
  Settings,
  Menu,
  X,
  Youtube,
  ChevronLeft,
  ChevronRight,
  Home,
  Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Landing Page", href: "/landing", icon: Home },
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Live Scraping", href: "/scraping", icon: Radio },
  { name: "Leads Library", href: "/leads", icon: Database },
  { name: "YouTube Replies", href: "/leads/youtube", icon: Youtube },
  { name: "Lead Sources", href: "/sources", icon: LinkIcon },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Save collapse state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 backdrop-blur-xl border-r border-slate-700/60 shadow-2xl shadow-black/50 transition-all duration-300 ease-in-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          "w-64" // Always full width on mobile
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700/60">
            <div className={cn("flex items-center gap-2 transition-all", isCollapsed && "lg:justify-center lg:w-full")}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/50">
                <span className="text-white font-bold text-sm">EL</span>
              </div>
              <span className={cn("font-semibold text-white whitespace-nowrap transition-opacity", isCollapsed && "lg:hidden")}>
                Eko Leads
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-gray-300 hover:bg-slate-800 hover:text-white",
                    isCollapsed && "lg:justify-center"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className={cn("whitespace-nowrap transition-opacity", isCollapsed && "lg:hidden")}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Collapse Toggle (Desktop only) */}
          <div className="hidden lg:block border-t border-slate-700/60 p-2">
            <button
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="font-medium">Collapse</span>
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className={cn("p-4 border-t border-slate-700/60 transition-all", isCollapsed && "lg:px-2")}>
            <div className={cn("text-xs text-gray-500 text-center", isCollapsed && "lg:hidden")}>
              Eko Lead Generator v1.0
            </div>
            {isCollapsed && (
              <div className="hidden lg:block text-xs text-gray-500 text-center">v1.0</div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn("transition-all duration-300", isCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        {/* Mobile menu button - only visible on mobile */}
        <div className="lg:hidden fixed top-4 left-4 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-900/70 backdrop-blur-lg border border-slate-700/60 rounded-lg text-gray-400 hover:text-white transition-colors shadow-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6 relative min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
