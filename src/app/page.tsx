import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  FileCheck2,
  FileText,
  ScanSearch,
  ShieldCheck,
  Truck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Logistics Operations Platform",
  description:
    "Coordinate logistics assignments, field inspections, inventory checks, delivery evidence and operational reports in one workspace.",
};

const capabilities = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Assignments & field work",
    description:
      "Give operational work a clear owner, deadline and status. Keep field teams and coordinators aligned from assignment to completion.",
    href: "/services#assignments",
  },
  {
    number: "02",
    icon: ScanSearch,
    title: "Inspections & quality",
    description:
      "Capture findings in a consistent format and bring inspection records, discrepancies and follow-up work into one view.",
    href: "/services#inspections",
  },
  {
    number: "03",
    icon: FileCheck2,
    title: "Documents & evidence",
    description:
      "Organize operational files alongside the work they support, including delivery evidence, checklists and reports.",
    href: "/services#documents",
  },
];

const workflow = [
  { step: "01", title: "Plan the work", text: "Create an assignment with the location, owner, priority and due date." },
  { step: "02", title: "Record the work", text: "Track progress, inspections, checklist results and supporting evidence." },
  { step: "03", title: "Review and report", text: "Bring the operational record together for review, follow-up and reporting." },
];

const capabilitiesStrip = [
  { label: "Assignments", icon: ClipboardCheck },
  { label: "Warehouse operations", icon: Boxes },
  { label: "Delivery evidence", icon: Truck },
  { label: "Operational reports", icon: FileText },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden text-slate-700">
      <section className="relative isolate bg-[#f7f9fc]">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-32 -top-56 h-[600px] w-[760px] rounded-full bg-blue-100/70 blur-3xl" />
          <div className="absolute -left-48 bottom-[-18rem] h-[520px] w-[600px] rounded-full bg-cyan-100/45 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:px-10 lg:pb-28 lg:pt-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-800 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              LOGISTICS OPERATIONS, MADE VISIBLE
            </div>
            <h1 className="mt-7 text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[3.75rem]">
              Keep every handoff
              {" "}
              <span className="block text-blue-700">in clear view.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              ChaseHorse brings assignments, inspections, inventory checks and
              operational documents together—so teams can follow the work from
              the warehouse floor to the final record.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/services"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Explore the platform <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-300 bg-white/80 px-5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-white"
              >
                Talk to our team
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Role-aware operations workspace</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
              <span>Records built around real operational activity</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[600px]">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-blue-200/50 via-white/20 to-cyan-100/50 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.38)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold tracking-tight text-white">CH</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Operations workspace</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">A single view for the work in motion</p>
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">PRODUCT PREVIEW</span>
              </div>

              <div className="grid gap-0 sm:grid-cols-[1fr_0.82fr]">
                <div className="p-5 sm:border-r sm:border-slate-100 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Operational flow</p>
                      <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">From task to evidence</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Truck className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="relative mt-7 space-y-5 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-slate-200">
                    {[
                      { title: "Assignment created", text: "Location and owner recorded", icon: ClipboardCheck, color: "bg-blue-600 text-white" },
                      { title: "Field check underway", text: "Inspection findings captured", icon: ScanSearch, color: "bg-cyan-600 text-white" },
                      { title: "Evidence attached", text: "Documents linked to the work", icon: FileCheck2, color: "bg-emerald-600 text-white" },
                    ].map((item) => (
                      <div key={item.title} className="relative flex items-start gap-3">
                        <span className={`relative z-10 flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full ring-4 ring-white ${item.color}`}>
                          <item.icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{item.text}</p>
                        </div>
                        <ArrowUpRight className="ml-auto mt-1 h-3.5 w-3.5 shrink-0 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50/80 p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-800">Work areas</p>
                    <span className="text-[10px] text-slate-400">Connected workflows</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      { title: "Assignments", detail: "Owners, status, deadlines", icon: ClipboardCheck, color: "text-blue-700 bg-blue-100" },
                      { title: "Inspections", detail: "Checks, findings, follow-ups", icon: ScanSearch, color: "text-cyan-700 bg-cyan-100" },
                      { title: "Inventory", detail: "Counts and discrepancies", icon: Boxes, color: "text-violet-700 bg-violet-100" },
                      { title: "Documents", detail: "Evidence and records", icon: FileText, color: "text-emerald-700 bg-emerald-100" },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-slate-800">{item.title}</span>
                          <span className="mt-0.5 block truncate text-[10px] text-slate-500">{item.detail}</span>
                        </span>
                        <ArrowDownRight className="h-3.5 w-3.5 text-slate-300" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[10px] leading-4 text-slate-400">
                    Illustrative interface preview. Operational records appear after they are entered in your workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-5 px-5 py-6 sm:px-8 md:grid-cols-4 lg:px-10">
          {capabilitiesStrip.map((item, index) => (
            <div key={item.label} className={`flex items-center gap-3 ${index > 0 ? "md:border-l md:border-slate-200 md:pl-7" : ""}`}>
              <item.icon className="h-[18px] w-[18px] text-blue-700" />
              <span className="text-xs font-semibold text-slate-700 sm:text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">A clearer operating picture</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                The detail behind every delivery matters.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              Replace scattered updates with structured records that help your team
              understand what was assigned, what happened, and what needs attention.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {capabilities.map((item) => (
              <Link
                key={item.number}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.3)] sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800 transition group-hover:bg-blue-50 group-hover:text-blue-700">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-slate-400">{item.number}</span>
                </div>
                <h3 className="mt-6 text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                  Explore capability <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f7f9fc] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20 lg:px-10">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">One connected workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              From a plan to a record your team can use.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Give each part of the operation a clear place to live. Keep the
              workflow practical for coordinators, supervisors and field teams.
            </p>
            <Link href="/services" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
              See how the platform works <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">
            {workflow.map((item) => (
              <div key={item.step} className="grid gap-3 py-5 sm:grid-cols-[56px_1fr] sm:gap-5 sm:py-6">
                <span className="font-mono text-xs font-semibold tracking-wide text-blue-700">{item.step}</span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Bring your operations into focus</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              See how ChaseHorse fits your workflow.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Explore the platform or get in touch to discuss your operational needs.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Contact us <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/signin" className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-700 px-4 text-sm font-semibold text-white transition hover:bg-slate-900">
              Sign in to portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
