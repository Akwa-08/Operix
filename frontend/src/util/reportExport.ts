/**
 * reportExport.ts — Shared export utilities for Operix reports
 * Used by all pages for CSV download and print-friendly report generation.
 */

/** Full-precision money formatter for reports (₱1,234.56) */
export function fmtMoneyFull(v: number | undefined | null): string {
  const val = Number(v) || 0;
  return `₱${val.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format a number with commas */
export function fmtNum(v: number | undefined | null): string {
  return (Number(v) || 0).toLocaleString();
}

/** Current date string for filenames: 2026-05-13 */
function dateSlug(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Sanitize a CSV cell value (escape quotes, wrap in quotes if needed) */
function csvCell(v: unknown): string {
  const s = String(v ?? "").replace(/"/g, '""');
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
}

// ─── CSV Export ─────────────────────────────────────────────────────────────────

export interface CSVColumn {
  header: string;
  accessor: (row: any) => string | number;
}

/**
 * Download a dataset as a CSV file.
 * @param filename Base name without extension (date is appended)
 * @param columns Column definitions with headers and accessor functions
 * @param rows Array of data objects
 */
export function downloadCSV(
  filename: string,
  columns: CSVColumn[],
  rows: any[],
): void {
  const headerLine = columns.map((c) => csvCell(c.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((c) => csvCell(c.accessor(row))).join(","),
  );
  const csv = [headerLine, ...dataLines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${dateSlug()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Print-Friendly Report ──────────────────────────────────────────────────────

export interface ReportSection {
  title: string;
  content: string; // HTML content
}

/**
 * Open a new print-friendly window with the given report sections.
 * Uses a clean, professional layout optimized for printing.
 */
export function printReport(
  reportTitle: string,
  subtitle: string,
  sections: ReportSection[],
): void {
  const sectionsHtml = sections
    .map(
      (s) => `
    <div class="section">
      <h2>${s.title}</h2>
      ${s.content}
    </div>
  `,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { border-bottom: 3px solid #0ea5e9; padding-bottom: 16px; margin-bottom: 32px; }
    .header h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .header .subtitle { font-size: 14px; color: #64748b; }
    .header .date { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .section { margin-bottom: 28px; page-break-inside: avoid; }
    .section h2 { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
    .summary-text { font-size: 14px; line-height: 1.7; color: #334155; background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f1f5f9; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; color: #475569; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:nth-child(even) td { background: #fafafa; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .kpi-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .kpi-box .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px; }
    .kpi-box .value { font-size: 22px; font-weight: 800; color: #0f172a; }
    .kpi-box .sub { font-size: 10px; color: #94a3b8; margin-top: 2px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${reportTitle}</h1>
    <div class="subtitle">${subtitle}</div>
    <div class="date">Generated: ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "full", timeStyle: "short" })}</div>
  </div>
  ${sectionsHtml}
  <script>window.print();</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

/**
 * Build an HTML table string from columns and rows for use in printReport sections.
 */
export function buildHtmlTable(
  columns: { header: string; accessor: (row: any) => string | number; align?: "left" | "right" | "center" }[],
  rows: any[],
): string {
  const ths = columns
    .map((c) => `<th class="text-${c.align || "left"}">${c.header}</th>`)
    .join("");
  const trs = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td class="text-${c.align || "left"}">${c.accessor(row)}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

/**
 * Build KPI boxes HTML for printReport sections.
 */
export function buildKpiHtml(
  kpis: { label: string; value: string; sub?: string }[],
): string {
  const boxes = kpis
    .map(
      (k) => `
    <div class="kpi-box">
      <div class="label">${k.label}</div>
      <div class="value">${k.value}</div>
      ${k.sub ? `<div class="sub">${k.sub}</div>` : ""}
    </div>
  `,
    )
    .join("");
  return `<div class="kpi-grid">${boxes}</div>`;
}
