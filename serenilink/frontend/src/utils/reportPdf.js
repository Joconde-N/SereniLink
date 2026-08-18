import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";


const ACCENT = [225, 154, 134];      // #E19A86 — used sparingly (rule, bullets, totals tint)
const ACCENT_TEXT = [176, 104, 80];  // darkened accent — legible as small text on white
const HEADER_BG = [42, 38, 35];      // charcoal — table header fill
const INK = [30, 27, 25];            // near-black body/heading text
const MUTED = [128, 120, 112];       // secondary/meta text
const LINE = [224, 218, 211];        // hairlines
const STRIPE = [248, 246, 243];      // alternate row tint
const TOTALS_TINT = [250, 240, 234]; // subtle accent tint for a totals row

const PAGE_W = 210; // A4, mm
const PAGE_H = 297;
const MARGIN = 16;

function trackedText(doc, text, x, y, opts) {
  // Manual letter-spacing for the small-caps wordmark (jsPDF has no native tracking).
  doc.text(text.split("").join("  "), x, y, opts);
}

function addHeader(doc, { title, subtitle, generatedBy, filters }) {
  // Slim brand stripe at the very top edge — the only large accent shape on the page.
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, PAGE_W, 2.4, "F");

  doc.setTextColor(...ACCENT_TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  trackedText(doc, "SERENILINK", MARGIN, 13);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text(title, MARGIN, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(`Generated ${new Date().toLocaleString()}`, PAGE_W - MARGIN, 12, { align: "right" });
  if (generatedBy) {
    doc.text(`By ${generatedBy}`, PAGE_W - MARGIN, 17, { align: "right" });
  }

  let y = 31;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 7;

  if (subtitle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(subtitle, MARGIN, y);
    y += 7;
  }

  if (filters && filters.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text("FILTERS", MARGIN, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const text = doc.splitTextToSize(filters.join("   ·   "), PAGE_W - MARGIN * 2 - 22);
    doc.text(text, MARGIN + 22, y);
    y += 5 * text.length + 3;
  }

  return y + 3;
}

function addFooter(doc, footerNote) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(footerNote || "SereniLink — confidential platform report", MARGIN, PAGE_H - 7);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 7, { align: "right" });
  }
}


export function buildReportPdf({ title, subtitle, generatedBy, filters, sections, footerNote, disclaimer }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = addHeader(doc, { title, subtitle, generatedBy, filters });

  sections.forEach((section) => {
    if (!section.rows?.length) return;

    if (y > PAGE_H - 40) {
      doc.addPage();
      y = 20;
    }

    
    doc.setFillColor(...ACCENT);
    doc.rect(MARGIN, y - 3, 2.6, 2.6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...INK);
    doc.text(section.title, MARGIN + 5.5, y);
    y += 2;

    if (section.note) {
      y += 4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(section.note, MARGIN + 5.5, y);
    }

    const lastRowIndex = section.rows.length - 1;

    autoTable(doc, {
      startY: y + 4,
      margin: { left: MARGIN, right: MARGIN, bottom: 18 },
      head: [section.columns],
      body: section.rows,
      theme: "striped",
      styles: {
        fontSize: 8.5,
        textColor: INK,
        lineColor: LINE,
        lineWidth: 0.1,
        cellPadding: 3,
        overflow: "linebreak",
      },
      headStyles: { fillColor: HEADER_BG, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      alternateRowStyles: { fillColor: STRIPE },
      columnStyles: section.columnStyles || {},
      didParseCell: (data) => {
        if (section.boldLastRow && data.section === "body" && data.row.index === lastRowIndex) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = TOTALS_TINT;
          data.cell.styles.textColor = INK;
        }
      },
    });

    y = doc.lastAutoTable.finalY + 10;
  });

  if (disclaimer) {
    if (y > PAGE_H - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, MARGIN, y + 10);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(disclaimer, PAGE_W - MARGIN * 2 - 6);
    doc.text(lines, MARGIN + 4, y + 4);
  }

  addFooter(doc, footerNote);
  return doc;
}
