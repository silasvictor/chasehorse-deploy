"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  PackageCheck,
  Truck,
  Box,
  AlertTriangle,
  FileText,
  BarChart3,
  Bell,
  UserCog,
  Settings,
  ChevronRight,
  LogOut,
  ExternalLink,
  Sparkles,
  LockKeyhole,
  MapPinned,
  Menu,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: string[]; // if undefined, visible to all authenticated users
}

const NAV_ITEMS: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "Assignments",
    href: "/dashboard/assignments",
    icon: ClipboardList,
  },
  {
    title: "Goods Tracker",
    href: "/dashboard/tracker",
    icon: MapPinned,
  },
  {
    title: "Inspections",
    href: "/dashboard/inspections",
    icon: PackageCheck,
  },
  {
    title: "Warehouse & Inventory",
    href: "/dashboard/inventory",
    icon: Box,
  },
  {
    title: "Discrepancies",
    href: "/dashboard/discrepancies",
    icon: AlertTriangle,
  },
  {
    title: "Loading Checklists",
    href: "/dashboard/checklists",
    icon: Truck,
  },
  {
    title: "POD & Documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Quality Records",
    href: "/dashboard/quality",
    icon: PackageCheck,
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks",
    icon: ClipboardList,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "AI Assistant",
    href: "/dashboard/ai-assistant",
    icon: Sparkles,
  },
  {
    title: "User Profile",
    href: "/dashboard/profile",
    icon: UserCog,
  },
];

const ADMIN_ITEMS: NavItem[] = [
  { title: "User & Role Management", href: "/dashboard/admin/users", icon: Settings, roles: ["ADMINISTRATOR"] },
  { title: "AI Provider Settings", href: "/dashboard/admin/ai-settings", icon: Settings, roles: ["ADMINISTRATOR"] },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userRole = session?.user?.role;

  useEffect(() => {
    const openSidebar = () => setMobileOpen(true);
    window.addEventListener("ch:open-sidebar", openSidebar);
    return () => window.removeEventListener("ch:open-sidebar", openSidebar);
  }, []);

  return (
    <>
    {mobileOpen && (
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={() => setMobileOpen(false)}
        className="fixed inset-0 z-30 bg-slate-950/40 md:hidden"
      />
    )}
    <aside className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-border-grey bg-white transition-transform duration-200 md:w-64 md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      {/* Brand header */}
      <div className="flex items-center justify-between p-4 border-b border-border-grey h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            CH
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-navy-midnight block">
              ChaseHorse
            </span>
            <span className="text-[10px] font-medium text-blue-600 block leading-none">
              Operations Portal
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation items scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Operations
        </div>
        {NAV_ITEMS.map((item) => {
          const canAccess = !item.roles || item.roles.includes(userRole ?? "");
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const className = `
            flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
            ${canAccess
              ? active
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-navy-midnight"
              : "cursor-not-allowed text-slate-400"}
          `;
          const content = (
            <>
              <item.icon className={`w-4 h-4 ${canAccess && active ? "text-blue-600" : "text-slate-400"}`} />
              <span className="truncate">{item.title}</span>
              {!canAccess && <LockKeyhole aria-hidden="true" className="ml-auto h-3.5 w-3.5 shrink-0" />}
              {canAccess && active && <ChevronRight size={14} className="ml-auto text-blue-500" />}
            </>
          );

          return canAccess ? (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={className}
            >
              {content}
            </Link>
          ) : (
            <div
              key={item.href}
              aria-disabled="true"
              aria-label={`${item.title}, access restricted`}
              title="Your account does not have permission to access this section."
              className={className}
            >
              {content}
            </div>
          );
        })}

        {ADMIN_ITEMS.length > 0 && (
          <>
            <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-2">
              Administration
            </div>
            {ADMIN_ITEMS.map((item) => {
              const canAccess = !item.roles || item.roles.includes(userRole ?? "");
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const className = `
                flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${canAccess
                  ? active
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-navy-midnight"
                  : "cursor-not-allowed text-slate-400"}
              `;
              const content = (
                <>
                  <item.icon className={`w-4 h-4 ${canAccess && active ? "text-blue-600" : "text-slate-400"}`} />
                  <span className="truncate">{item.title}</span>
                  {!canAccess && <LockKeyhole aria-hidden="true" className="ml-auto h-3.5 w-3.5 shrink-0" />}
                  {canAccess && active && <ChevronRight size={14} className="ml-auto text-blue-500" />}
                </>
              );

              return canAccess ? (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={className}
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={item.href}
                  aria-disabled="true"
                  aria-label={`${item.title}, administrator access required`}
                  title="Administrator access is required for this section."
                  className={className}
                >
                  {content}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom user / sign out section */}
      <div className="p-3 border-t border-border-grey space-y-1 bg-slate-50/50">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-white hover:text-blue-600 transition-colors"
        >
          <ExternalLink size={14} className="text-slate-400" />
          <span>Public Website</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/signin" })}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
    </>
  );
}

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border-grey bg-white/90 px-3 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => window.dispatchEvent(new Event("ch:open-sidebar"))}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="hidden font-semibold text-navy-midnight text-sm sm:block sm:text-base">ChaseHorse Operations</h2>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("ch:open-command-palette"))}
          className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700 sm:px-3"
          aria-label="Search pages"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-sans text-[10px] sm:inline">⌘ K</kbd>
        </button>
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-sm font-medium text-navy-midnight">{user?.name || "User"}</span>
          <span className="text-xs text-slate-400">
            {user?.role
              ? user.role.split("_").map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")
              : "Viewer"}
          </span>
        </div>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <span className={`w-2.5 h-2.5 rounded-full ${user?.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
          <span className="text-xs font-medium text-slate-600">
            {user?.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <Link href="/dashboard/profile">
          <Button variant="outline" size="sm" className="hidden sm:flex bg-white">
            <UserCog size={15} className="mr-1.5 text-slate-500" />
            Profile
          </Button>
        </Link>
      </div>
    </header>
  );
}
