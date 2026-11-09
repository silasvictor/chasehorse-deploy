"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";

const NAV_LINKS = [
  { href: "/services", label: "Platform" },
  { href: "/industries", label: "Industries" },
  { href: "/technology-ai", label: "Technology" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav aria-label="Main navigation" className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="ChaseHorse Deploy home">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-slate-950 text-xs font-bold tracking-tight text-white shadow-sm transition group-hover:bg-blue-700">
            CH
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-slate-950">ChaseHorse</span>
            <span className="mt-0.5 block text-[10px] font-medium tracking-wide text-slate-500">OPERATIONS PLATFORM</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 xl:flex">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-[13px] font-medium transition ${pathname === "/" ? "text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
          >
            Home
          </Link>
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-[13px] font-medium transition ${active ? "text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Operations portal
                <ArrowUpRight className="h-3 w-3 text-slate-400" />
              </Link>
              <Dropdown>
                <DropdownTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 px-2.5 text-slate-700">
                    <UserRound className="h-4 w-4 text-slate-500" />
                    <span className="max-w-[100px] truncate text-xs font-medium">{user?.name || "Account"}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                </DropdownTrigger>
                <DropdownContent align="end" className="w-48">
                  <DropdownItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center gap-2 text-sm text-slate-700">
                      <UserRound className="h-4 w-4 text-slate-400" />
                      Profile
                    </Link>
                  </DropdownItem>
                  <DropdownItem
                    onSelect={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer border-t border-slate-100 text-red-600 focus:bg-red-50 focus:text-red-700"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </span>
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            </>
          ) : (
            <>
              <Link href="/signin" className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950">
                Sign in
              </Link>
              <Link href="/contact" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800">
                Talk to our team <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-site-navigation"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 xl:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-site-navigation" className="border-t border-slate-200 bg-white px-5 pb-5 pt-3 shadow-lg md:hidden">
          <div className="mx-auto max-w-7xl space-y-1">
            {[{ href: "/", label: "Home" }, ...NAV_LINKS].map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-blue-50 text-blue-800" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              {session ? (
                <>
                  <Link href="/dashboard" className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-semibold text-white">
                    <LayoutDashboard className="h-4 w-4" /> Operations portal
                  </Link>
                  <Link href="/dashboard/profile" className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signin" className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">
                    Sign in
                  </Link>
                  <Link href="/contact" className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
                    Contact us
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
