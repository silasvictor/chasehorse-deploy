import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Factory,
  PackageCheck,
  Truck,
  Warehouse,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "See how the ChaseHorse operations workspace supports warehousing, distribution, manufacturing, freight and third-party logistics workflows.",
};

const industries = [
  {
    title: "Warehousing & distribution",
    description:
      "Coordinate facility inspections, stock checks, discrepancy follow-ups and daily operational tasks across warehouse workflows.",
    icon: Warehouse,
    tags: ["Warehouse checks", "Inventory", "Task tracking"],
  },
  {
    title: "Manufacturing & production",
    description:
      "Keep quality checks, inbound and outbound handoffs, and supporting evidence together around the movement of goods.",
    icon: Factory,
    tags: ["Quality records", "Goods movement", "Evidence"],
  },
  {
    title: "Freight & transportation",
    description:
      "Organize loading and unloading steps, delivery documentation and work status across transport operations.",
    icon: Truck,
    tags: ["Loading checks", "POD records", "Assignments"],
  },
  {
    title: "Third-party logistics",
    description:
      "Bring operational tasks and verification records into a shared workspace for teams coordinating with logistics partners.",
    icon: Building2,
    tags: ["Operations", "Inspections", "Reporting"],
  },
];

export default function IndustriesPage() {
  return (
    <div className="text-slate-700">
      <section className="bg-[#f7f9fc]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-blue-700">Who it serves</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Designed for teams that move, store and verify goods.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              ChaseHorse gives operations teams a place to coordinate work and
              record what happened across warehouses, production sites and
              transportation workflows.
            </p>
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/contact" className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
              Discuss your operation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/services" className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Explore platform capabilities
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid gap-4 md:grid-cols-2">
          {industries.map((industry, index) => (
            <article key={industry.title} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-[0_16px_40px_-28px_rgba(15,23,42,0.36)] sm:p-8">
              <span className="absolute right-6 top-6 font-mono text-xs text-slate-300">0{index + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800 transition group-hover:bg-blue-50 group-hover:text-blue-700">
                <industry.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">{industry.title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{industry.description}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {industry.tags.map((tag) => (
                  <li key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">{tag}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-16 md:grid-cols-[1fr_auto] md:items-center lg:px-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
              <PackageCheck className="h-4 w-4" />
              Fit the workflow to the work
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Every operation has its own handoffs.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Talk with us about the records, roles and steps your teams need to bring together.
            </p>
          </div>
          <Link href="/contact" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
            Start a conversation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
