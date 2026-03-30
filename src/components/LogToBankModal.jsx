// src/components/LogToBankModal.jsx
import { useState, useEffect } from "react";
import api from "../api/api";

const VALID_BANKS = [
  "HDFC Bank",
  "SBI",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Bank",
  "Bank of Baroda",
  "PNB",
  "Canara Bank",
];

export default function LogToBankModal({ lead, onClose, onSuccess }) {
  const [bankName, setBankName] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // close on Escape
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!bankName) return setError("Please select a bank.");
    setError("");
    setLoading(true);
    try {
      const res = await api.post(
        `/api/bank-logging/leads/${lead.id}/log-to-bank`,
        { bank_name: bankName }
      );
      const msg =
        res?.data?.message ||
        `${lead.contact_name ?? "Lead"} logged to ${bankName}. Awaiting banker assignment.`;
      onSuccess?.(msg);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg ?? "Failed to log lead to bank."
          : "Failed to log lead to bank."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(4,10,20,0.88)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{
        background: "#080f1c",
        border: "1px solid #1e3050",
        borderTop: "3px solid #16a34a",
        borderRadius: 14,
        width: "100%", maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        fontFamily: "'DM Mono','Courier New',monospace",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #0f1f35" }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#16a34a", letterSpacing: "0.03em" }}>
              Log to Bank
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#4a6080" }}>
              {lead?.contact_name ?? "Lead"} · {lead?.loan_id ?? lead?.id}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 10, color: "#4a6080", background: "#0a1628", border: "1px solid #0f1f35", borderRadius: 6, padding: "4px 8px", display: "inline-block" }}>
              ℹ Banker will be assigned by Admin after review
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a6080", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Bank selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelStyle}>
              Bank <span style={{ color: "#ef5350" }}>*</span>
            </label>
            <select
              value={bankName}
              onChange={(e) => { setBankName(e.target.value); setError(""); }}
              style={selectStyle}
            >
              <option value="">— Select bank —</option>
              {VALID_BANKS.map((b) => (
                <option key={b} value={b} style={{ background: "#0c1929" }}>{b}</option>
              ))}
            </select>
          </div>

          {/* Lead summary */}
          <div style={{ background: "#0a1628", border: "1px solid #0f1f35", borderRadius: 8, padding: "12px 16px" }}>
            {[
              ["Lead ID",       lead?.loan_id ?? "—"],
              ["Loan Type",     lead?.loan_type ?? lead?.raw?.loan_type ?? "—"],
              ["Amount",        lead?.loan_amount_requested
                                  ? `₹${(lead.loan_amount_requested / 100000).toFixed(1)}L`
                                  : "—"],
              ["CIBIL",         lead?.credit_score ?? lead?.cibil_score ?? "—"],
              ["Current Stage", (lead?.state ?? lead?.stage ?? "—").replace(/_/g, " ")],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #0f1f3566" }}>
                <span style={{ fontSize: 11, color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</span>
                <span style={{ fontSize: 13, color: "#c5d0e0", fontWeight: 600 }}>{String(v)}</span>
              </div>
            ))}
          </div>

          {/* What happens next */}
          <div style={{ background: "#0a1a10", border: "1px solid #16a34a33", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#4ade80", fontWeight: 600, marginBottom: 6 }}>What happens next:</p>
            <p style={{ margin: 0, fontSize: 11, color: "#4a6080", lineHeight: 1.7 }}>
              1. Loan record created with <strong style={{ color: "#c5d0e0" }}>{bankName || "selected bank"}</strong><br />
              2. Admin reviews and assigns a banker<br />
              3. Banker receives the loan in their dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <p style={{ margin: 0, fontSize: 12, color: "#ef5350", background: "#1a0a0a", border: "1px solid #ef535033", borderRadius: 7, padding: "8px 12px" }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 24px 20px", borderTop: "1px solid #0f1f35" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ background: "none", border: "1px solid #1e3050", borderRadius: 8, padding: "9px 20px", color: "#8892a4", fontSize: 13, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !bankName}
            style={{
              background: "#0a2218", border: "1px solid #16a34a", borderRadius: 8,
              padding: "9px 24px", color: "#16a34a", fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Mono',monospace", cursor: "pointer",
              opacity: loading || !bankName ? 0.5 : 1,
            }}
          >
            {loading ? "Logging…" : "Confirm & Log to Bank"}
          </button>
        </div>

      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 11,
  color: "#8892a4",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const selectStyle = {
  background: "#0c1929",
  border: "1px solid #1e3050",
  borderRadius: 8,
  padding: "10px 13px",
  color: "#e8edf5",
  fontSize: 13,
  outline: "none",
  width: "100%",
  fontFamily: "'DM Mono','Courier New',monospace",
};