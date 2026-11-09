import { withAuthz } from "@/lib/api";
import { db } from "@/lib/db";
import type { RouteParams } from "@/lib/api";

export const GET = withAuthz(async (ctx, req, params) => {
  try {
    const { id } = params as { id: string };
    const format = new URL(req.url).searchParams.get("format") || "csv";
    const report = await db.report.findUnique({ where: { id } });
    if (!report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (report.generatedById !== ctx.userId && ctx.role !== "ADMINISTRATOR") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (format === "csv") {
      const csv = `"Title","Type","Status","Generated"\n"${report.title}","${report.type}","${report.status}","${report.createdAt}"\n\n${(report.content || "").replace(/"/g, '""')}`;
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="report-${id}.csv"`,
        },
      });
    }

    // PDF
    const pdfkitModule: any = await import("pdfkit");
    const PDFDocument = pdfkitModule.default || pdfkitModule;
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });
    doc.fontSize(16).text(report.title, { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(`Type: ${report.type}`);
    doc.text(`Status: ${report.status}`);
    doc.text(`Generated: ${new Date(report.createdAt).toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(11).text(report.content || "");
    doc.end();
    const pdfBuffer = await done;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${id}.pdf"`,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Export failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}, { roles: ["ADMINISTRATOR", "OPERATIONS_MANAGER", "AUDITOR"] });