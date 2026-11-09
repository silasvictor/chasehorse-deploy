import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Privacy information for the ChaseHorse Deploy platform.",
};

export default function PrivacyPage() {
  return (
    <div className="text-slate-text">
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight text-navy-midnight mb-8 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-text mb-6">
            <strong>Effective date:</strong> Placeholder. This is a proposed
            product and not an operational ChaseHorse system.
          </p>
          <div className="space-y-6 text-sm leading-relaxed">
            <p>
              This Privacy Policy describes how ChaseHorse Deploy (the
              &quot;platform&quot;) handles user information. It is a proposed policy for
              a proposed product and does not reflect an existing live system.
            </p>
            <h3 className="font-semibold text-navy-midnight mb-2">Information we collect</h3>
            <ul className="list-disc list-inside mb-4 text-slate-text">
              <li>Account information (email, name, role) provided at sign-in.</li>
              <li>Operational records you create or upload (assignments, inspections, documents).</li>
              <li>Usage and audit-log information for security and troubleshooting.</li>
            </ul>
            <h3 className="font-semibold text-navy-midnight mb-2">AI data handling</h3>
            <p className="text-slate-text mb-4">
              If an AI provider is configured, only the minimum data necessary
              to answer a request is sent to that provider. API keys are stored
              server-side and never exposed to the browser. Data retention by
              external AI providers depends on each provider&apos;s terms, which are
              not verified by this platform.
            </p>
            <h3 className="font-semibold text-navy-midnight mb-2">Your rights</h3>
            <p className="text-slate-text mb-4">
              You may request access to, correction of, or deletion of your
              account data and uploaded documents by contacting us. Document
              retention and deletion practices are described in the platform
              documentation.
            </p>
            <h3 className="font-semibold text-navy-midnight mb-2">Contact</h3>
            <p className="text-slate-text">
              Questions about this policy may be sent to
              hello@chasehorse.example (placeholder address).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
