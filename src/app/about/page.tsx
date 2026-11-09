import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileCheck2,
  ScanSearch,
  Workflow,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About ChaseHorse",
  description:
    "Learn about the ChaseHorse logistics operations platform and its approach to operational visibility and record keeping.",
};

const principles = [
  {
    title: "The work should be easy to follow",
    description:
      "Assignments, owners, status and deadlines belong together, so teams can see the next step without piecing together separate updates.",
    icon: ClipboardList,
  },
  {
    title: "Evidence should stay with the work",
    description:
      "Inspection findings, checklists and documents provide context to an operation and should be traceable alongside it.",
    icon: FileCheck2,
  },
  {
    title: "Reviews should lead to action",
    description:
      "Discrepancies and quality findings are useful when they can be reviewed, assigned and followed through to resolution.",
    icon: ScanSearch,
  },
];

export default function AboutPage() {
  return (
    <div className="text-slate-700">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(37,99,235,0.28),transparent_44%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.75fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-blue-300">About ChaseHorse</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                Make the details of logistics work easier to see.
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              ChaseHorse Deploy is an operations platform for organizing logistics
              assignments, inspections, inventory checks and evidence in a shared
              workspace.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/services" className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Explore the platform <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex h-11 items-center rounded-lg border border-slate-700 px-4 text-sm font-semibold text-white transition hover:bg-slate-900">
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Workflow className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">A practical platform</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Built around operational clarity.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Logistics work crosses teams, locations and systems. The platform
              provides a shared structure for recording activity and keeping
              supporting information together.
            </p>
          </div>
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">
            {principles.map((item, index) => (
              <article key={item.title} className="grid gap-3 py-5 sm:grid-cols-[44px_1fr] sm:gap-4 sm:py-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-mono text-[10px] font-semibold tracking-wide text-slate-400">0{index + 1}</p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f7f9fc]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">A platform is only useful when it fits the work.</h2>
            <p className="mt-2 text-sm text-slate-600">Explore the workspace and its current operational capabilities.</p>
          </div>
          <Link href="/services" className="inline-flex h-10 items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:self-auto">
            View platform capabilities <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
