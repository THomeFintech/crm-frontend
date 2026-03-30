// src/utils/formatters.js

/**
 * Format a numeric loan amount into ₹ Lakhs display string.
 * e.g. 500000 → "₹5.0L"
 */
export function fmtAmount(v) {
  if (!v) return "—";
  return "₹" + (v / 100000).toFixed(1) + "L";
}

/**
 * Format an ISO date string into a short Indian locale date.
 * e.g. "2025-03-01T09:12:00Z" → "01 Mar"
 */
export function fmtDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/**
 * Format a large number with commas.
 * e.g. 8750000 → "8,750,000"
 */
export function fmtNumber(v) {
  if (v == null) return "—";
  return v.toLocaleString("en-IN");
}
