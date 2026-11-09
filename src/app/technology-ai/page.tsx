import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  FileSearch,
  LockKeyhole,
  Server,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Technology & AI",
  description:
    "Learn about optional AI-assisted workflows in ChaseHorse, provider configuration and the role of human review.",
};

const capabilities = [
  {
    title: "Operations assistant",
    description:
      "A chat workspace for asking about operational records and getting help with day-to-day logistics workflows.",
    icon: Bot,
  },
  {
    title: "Document analysis",
    description:
      "AI-assisted extraction and summarization for supported document types, with people responsible for reviewing the result.",
    icon: FileSearch,
  },
  {
    title: "Operational insights",
    description:
      "Tools for exploring recorded activity and surfacing patterns that may warrant a closer look.",
    icon: BrainCircuit,
  },
];

const safeguards = [
  "Provider credentials are configured on the server and should not be placed in browser code.",
  "AI output is an aid for review—not a verified operational fact or approval.",
  "Provider availability depends on valid administrator configuration and network access.",
];

export default function TechnologyAIPage() {
  return (
    <div className="text-slate-700">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(8,145,178,0.22),transparent_44%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
              <BrainCircuit className="h-4 w-4" />
              Technology & AI
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
              Useful assistance. People stay in control.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              AI features can help teams work with operational records and
              documents. They are designed to support review—not to replace
              inspection, authorization or human judgment.
            </p>
            <Link href="/contact" className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Discuss AI configuration <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          {capabilities.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <item.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-base font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f7f9fc]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
              <Server className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Provider configuration</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">The connection is configured by your administrator.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              The application supports a provider abstraction for Gemini, OpenAI
              and Anthropic. AI features require valid server-side credentials;
              availability is not assumed.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <LockKeyhole className="h-4 w-4 text-blue-700" />
              Responsible use
            </h3>
            <ul className="mt-5 space-y-4">
              {safeguards.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
