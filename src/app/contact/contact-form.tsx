"use client";

import { useState } from "react";
import { ArrowUpRight, Mail } from "lucide-react";

export function ContactForm({ contactEmail }: { contactEmail: string }) {
  const [notice, setNotice] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const subject = `Website inquiry from ${name}`;
    const body = [
      `Name: ${name}`,
      `Work email: ${email}`,
      `Company: ${company || "Not provided"}`,
      "",
      message,
    ].join("\n");
    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setNotice("Your email app should open with a draft. Review it and press Send to complete your inquiry.");
    window.location.assign(mailto);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.28)] sm:p-8">
      <div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Mail className="h-4 w-4" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">Send an inquiry</h2>
        <p className="mt-1 text-sm text-slate-600">Your email app will open with a message draft for review.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="text-xs font-semibold text-slate-700">Full name</label>
            <input id="contact-name" name="name" autoComplete="name" required maxLength={120} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Your name" />
          </div>
          <div>
            <label htmlFor="contact-email" className="text-xs font-semibold text-slate-700">Work email</label>
            <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="you@company.com" />
          </div>
        </div>
        <div>
          <label htmlFor="contact-company" className="text-xs font-semibold text-slate-700">Company <span className="font-normal text-slate-400">(optional)</span></label>
          <input id="contact-company" name="company" autoComplete="organization" maxLength={160} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Company name" />
        </div>
        <div>
          <label htmlFor="contact-message" className="text-xs font-semibold text-slate-700">How can we help?</label>
          <textarea id="contact-message" name="message" required maxLength={4000} rows={5} className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Tell us about your operation or question." />
        </div>
        <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto">
          Open email draft <ArrowUpRight className="h-4 w-4" />
        </button>
        {notice && <p role="status" className="text-xs leading-5 text-emerald-800">{notice}</p>}
        <p className="text-xs leading-5 text-slate-500">
          Nothing is sent or saved by this page. You will need to send the draft from your email app.
        </p>
      </form>
    </div>
  );
}
