import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, FileSpreadsheet, FileText } from "lucide-react";

/**
 * "Export ▾" split button — offers CSV (raw data) and PDF (formatted report).
 * Drop-in replacement for a single "Export CSV" button.
 */
function ExportMenu({ onCsv, onPdf, csvLabel = "Export as CSV", pdfLabel = "Export as PDF (Report)", disabled }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const run = (fn) => {
    setOpen(false);
    fn?.();
  };

  return (
    <div ref={rootRef} className="export-menu">
      <button
        type="button"
        className="export-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Export
        <ChevronDown size={14} className="export-menu-chevron" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div className="export-menu-list" role="menu">
          <button type="button" role="menuitem" className="export-menu-item" onClick={() => run(onCsv)}>
            <FileSpreadsheet size={15} />
            <span>
              {csvLabel}
              <small>Raw data, opens in Excel/Sheets</small>
            </span>
          </button>
          <button type="button" role="menuitem" className="export-menu-item" onClick={() => run(onPdf)}>
            <FileText size={15} />
            <span>
              {pdfLabel}
              <small>Formatted, ready to share/print</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
