import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
  BarChart3,
  Bell,
  Box,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  MapPinned,
  PackageCheck,
  ScanSearch,
  Settings,
  Sparkles,
  Truck,
  UserCog,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Platform capabilities",
  description:
    "Explore ChaseHorse operations modules for assignments, inspections, inventory, documents, reports, team access and AI settings.",
};

const modules = [
  {
    category: "Operations",
    title: "Overview",
    description: "See key activity and operational status together on the dashboard.",
    icon: LayoutDashboard,
  },
  {
    category: "Operations",
    title: "Assignments",
    description: "Create and track work with owners, locations, priorities and due dates.",
    icon: ClipboardCheck,
  },
  {
    category: "Operations",
    title: "Goods Tracker",
    description: "Connect inventory goods to an assignment and destination, then follow driver phone GPS updates on a Google Maps route.",
    icon: MapPinned,
  },
  {
    category: "Operations",
    title: "Inspections",
    description: "Record inspection results, findings and follow-up needs.",
    icon: ScanSearch,
  },
  {
    category: "Operations",
    title: "Warehouse & Inventory",
    description: "Record stock activity and review inventory information.",
    icon: Box,
  },
  {
    category: "Operations",
    title: "Discrepancies",
    description: "Track variances and keep resolution notes with the operational record.",
    icon: AlertTriangle,
  },
  {
    category: "Operations",
    title: "Loading Checklists",
    description: "Capture loading and unloading checklist progress and completion.",
    icon: Truck,
  },
  {
    category: "Operations",
    title: "POD & Documents",
    description: "Keep uploaded files and proof-of-delivery records organized.",
    icon: FileText,
  },
  {
    category: "Operations",
    title: "Quality Records",
    description: "Review quality checks and related findings.",
    icon: PackageCheck,
  },
  {
    category: "Operations",
    title: "Tasks",
    description: "Keep follow-up work and next steps visible to the team.",
    icon: ClipboardCheck,
  },
  {
    category: "Operations",
    title: "Reports",
    description: "Review summaries generated from the records captured in the workspace.",
    icon: BarChart3,
  },
  {
    category: "Operations",
    title: "Notifications",
    description: "Review updates and notices related to workspace activity.",
    icon: Bell,
  },
  {
    category: "Operations",
    title: "AI Assistant",
    description: "Use AI assistance when a supported provider is configured.",
    icon: Sparkles,
  },
  {
    category: "Account",
    title: "User Profile",
    description: "View and manage your own account profile.",
    icon: UserCog,
  },
  {
    category: "Administration",
    title: "User & Role Management",
    description: "For administrators: manage workspace users and role assignments.",
    icon: Settings,
  },
  {
    category: "Administration",
    title: "AI Provider Settings",
    description: "For administrators: configure the AI provider used by the workspace.",
    icon: Sparkles,
  },
];

const steps = [
  { number: "01", title: "Set up the assignment", description: "Define the task, location, owner and timing in the operations workspace." },
  { number: "02", title: "Capture field activity", description: "Record progress, inspection outcomes, checklist results and relevant documents." },
  { number: "03", title: "Review the record", description: "Use the captured information to follow up, resolve issues and prepare reports." },
];

export default function ServicesPage() {
  return (
    <div className="text-slate-700">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.28),transparent_52%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-blue-300">Platform capabilities</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-end">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
              A connected workspace for logistics operations.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Explore the operational, account and administration areas available
              in the ChaseHorse workspace. Access depends on your account role.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Discuss your workflow <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/signin" className="inline-flex h-11 items-center rounded-lg border border-slate-700 px-4 text-sm font-semibold text-white transition hover:bg-slate-900">
              Sign in to the workspace
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Inside the workspace</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Explore the available modules</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Sign-in and role permissions protect workspace areas. Restricted sections remain visible to explain what is available to administrators.
            </p>
          </div>
          <Link href="/signin" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
            Sign in to the workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <article key={module.title} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-[0_16px_40px_-28px_rgba(15,23,42,0.36)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                  <module.icon className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{module.category}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-950">{module.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
              {module.category === "Administration" && (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                  <LockKeyhole className="h-3 w-3" /> Administrator access
                </span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f7f9fc]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16 lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">A simple operating rhythm</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Make the next step clear.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Organize the work, keep the evidence close, and make follow-up easier
              for everyone involved.
            </p>
          </div>
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">
            {steps.map((step) => (
              <div key={step.number} className="grid gap-2 py-5 sm:grid-cols-[52px_1fr] sm:gap-4">
                <span className="font-mono text-xs font-semibold text-blue-700">{step.number}</span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
