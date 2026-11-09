"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

const COMMANDS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Assignments", href: "/dashboard/assignments" },
  { label: "Inspections", href: "/dashboard/inspections" },
  { label: "Inventory", href: "/dashboard/inventory" },
  { label: "Discrepancies", href: "/dashboard/discrepancies" },
  { label: "Documents", href: "/dashboard/documents" },
  { label: "Reports", href: "/dashboard/reports" },
  { label: "Tasks", href: "/dashboard/tasks" },
  { label: "AI Assistant", href: "/dashboard/ai-assistant" },
  { label: "AI Insights", href: "/dashboard/ai-insights" },
  { label: "Admin Users", href: "/dashboard/admin/users" },
  { label: "AI Provider Settings", href: "/dashboard/admin/ai-settings" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const openFromButton = () => setOpen(true);
    window.addEventListener("keydown", handler);
    window.addEventListener("ch:open-command-palette", openFromButton);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("ch:open-command-palette", openFromButton);
    };
  }, []);

  if (!open) return null;

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 pt-20 backdrop-blur-sm sm:pt-24"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Search pages" className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages..."
            aria-label="Search pages"
            className="flex-1 outline-none text-sm"
          />
          <button onClick={() => setOpen(false)} aria-label="Close">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto py-2">
          {filtered.map((c) => (
            <li key={c.href}>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
                onClick={() => {
                  router.push(c.href);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {c.label}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-2 text-sm text-slate-400">No results</li>
          )}
        </ul>
      </div>
    </div>
  );
}