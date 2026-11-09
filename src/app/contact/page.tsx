import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact ChaseHorse to discuss logistics workflows, platform capabilities or operations workspace access.",
};

export default function ContactPage() {
  const contactEmail = process.env.CONTACT_EMAIL?.trim() || "";

  return (
    <div className="text-slate-700">
      <section className="bg-[#f7f9fc]">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-18 lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-blue-700">Contact</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Tell us what your operation needs.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Ask about the platform, discuss a workflow or get help accessing
              the operations workspace.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.65fr)] lg:gap-16 lg:px-10">
        <div>
          {contactEmail ? (
            <ContactForm contactEmail={contactEmail} />
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                <Mail className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-slate-950">Contact email is not configured</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700">
                This website does not yet have a verified contact address, so it
                cannot receive inquiries. Configure <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">CONTACT_EMAIL</code> on
                the server to enable the email inquiry form.
              </p>
              <p className="mt-4 text-xs leading-5 text-slate-600">
                We have not sent or stored a message. The form will be enabled
                only after a real contact address is provided.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <MessageSquareText className="h-4 w-4" />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-slate-900">Looking for the operations workspace?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Existing users can sign in to manage assignments, inspections and operational records.
            </p>
            <Link href="/signin" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800">
              Go to sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-slate-900">About this website</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              We avoid publishing unverified office addresses, customer names or performance claims.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
