import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms information for the ChaseHorse Deploy platform.",
};

export default function TermsPage() {
  return (
    <div className="text-slate-text">
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight text-navy-midnight mb-8 sm:text-4xl">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-text mb-6">
            <strong>Effective date:</strong> Placeholder. This is a proposed
            product and not an operational ChaseHorse system.
          </p>
          <div className="space-y-6 text-sm leading-relaxed">
            <p>
              These Terms of Service govern your use of the ChaseHorse Deploy
              platform. The platform is a proposed product; it is not connected
              to any existing ChaseHorse internal systems, and no verified
              customer data or performance claims are represented here.
            </p>
            <h3 className="font-semibold text-navy-midnight mb-2">Use of the platform</h3>
            <p className="text-slate-text mb-4">
              You may use the platform to manage logistics operations records,
              including assignments, inspections, inventory, documents, and
              reports. You are responsible for the accuracy of data you enter.
            </p>
            <h3 className="font-semibold text-navy-midnight mb-2">AI-assisted features</h3>
            <p className="text-slate-text mb-4">
              AI-generated content (reports, extraction results, assistant
              answers) is a draft suggestion only. It must be reviewed and
              confirmed by an authorized user before it changes official
              records. Uncertain predictions are not presented as facts.
            </p>
            <h3 className="font-semibold text-navy-midnight mb-2">No warranties</h3>
            <p className="text-slate-text mb-4">
              The platform is provided on an &quot;as is&quot; basis without warranties
              of any kind, express or implied. Placeholder information is used
              where verified company details are unavailable.
            </p>
            <h3 className="font-semibold text-navy-midnight mb-2">Limitation of liability</h3>
            <p className="text-slate-text mb-4">
              To the fullest extent permitted by law, the platform provider is
              not liable for indirect, incidental, or consequential damages
              arising from use of the platform.
            </p>
            <h3 className="font-semibold text-navy-midnight mb-2">Changes to terms</h3>
            <p className="text-slate-text mb-4">
              These terms may be updated. Continued use of the platform
              constitutes acceptance of the revised terms.
            </p>
            <h3 className="font-semibold text-navy-midnight mb-2">Contact</h3>
            <p className="text-slate-text">
              Questions may be sent to hello@chasehorse.example (placeholder
              address).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
