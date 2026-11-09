import Link from "next/link";
import { ArrowUpRight, Boxes, ClipboardCheck, FileCheck2, ScanSearch, ShieldCheck } from "lucide-react";

const platformLinks = [
  { href: "/services#assignments", label: "Assignments", icon: ClipboardCheck },
  { href: "/services#inspections", label: "Inspections & quality", icon: ScanSearch },
  { href: "/services#documents", label: "Documents & evidence", icon: FileCheck2 },
  { href: "/services#inventory", label: "Inventory reconciliation", icon: Boxes },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-5 pb-7 pt-14 sm:px-8 sm:pt-16 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] lg:gap-14">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-blue-600 text-xs font-bold tracking-tight text-white">CH</span>
              <span>
                <span className="block text-sm font-semibold tracking-tight text-white">ChaseHorse</span>
                <span className="mt-0.5 block text-[9px] font-medium tracking-wide text-slate-400">OPERATIONS PLATFORM</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              A connected workspace for logistics assignments, field inspections,
              inventory checks and operational records.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-slate-300">
              <ShieldCheck className="h-4 w-4 text-blue-300" />
              Built around clear operational records
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Platform</h2>
            <ul className="mt-4 space-y-3">
              {platformLinks.map((item) => {
                return (
                  <li key={item.href}>
                    <Link href={item.href} className="group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
                      <item.icon className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-blue-300" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Explore</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li><Link href="/industries" className="transition hover:text-white">Industries</Link></li>
              <li><Link href="/technology-ai" className="transition hover:text-white">Technology</Link></li>
              <li><Link href="/about" className="transition hover:text-white">About ChaseHorse</Link></li>
              <li><Link href="/contact" className="transition hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Workspace</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <Link href="/signin" className="inline-flex items-center gap-1.5 transition hover:text-white">
                  Sign in <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li><Link href="/privacy" className="transition hover:text-white">Privacy policy</Link></li>
              <li><Link href="/terms" className="transition hover:text-white">Terms of service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-800 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© ChaseHorse Deploy.</p>
          <p>Operational visibility, from assignment to evidence.</p>
        </div>
      </div>
    </footer>
  );
}
