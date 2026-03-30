// src/components/SendToBankModal.jsx
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

export default function SendToBankModal({ lead, onClose, onSuccess }) {
  const [bankName,  setBankName]  = useState("");
  const [bankers,   setBankers]   = useState([]);
  const [bankerId,  setBankerId]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(false);
  const [error,     setError]     = useState("");

  // fetch active bankers whenever bank changes
  useEffect(() => {
    if (!bankName) { setBankers([]); setBankerId(""); return; }
    setFetching(true);
    setBankerId("");
    api
      .get("/api/users/bankers", { params: { bank_name: bankName } })
      .then((r) => setBankers(r.data ?? []))
      .catch(() => setBankers([]))
      .finally(() => setFetching(false));
  }, [bankName]);

  // close on Escape
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!bankName)  return setError("Please select a bank.");
    if (!bankerId)  return setError("Please select a banker.");
    setError("");
    setLoading(true);
    try {
      await api.post(`/api/leads/${lead.id}/send-to-bank`, {
        bank_name: bankName,
        banker_id: bankerId,
      });
      onSuccess?.(`${lead.contact_name ?? "Lead"} sent to ${bankName} successfully.`);
    } catch (err) {
      const msg = err?.response?.data?.detail;
      setError(
        typeof msg === "string"
          ? msg
          : Array.isArray(msg)
          ? msg[0]?.msg ?? "Failed to send lead to bank."
          : "Failed to send lead to bank."
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
        borderTop: "3px solid #29b6f6",
        borderRadius: 14,
        width: "100%", maxWidth: 440,
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        fontFamily: "'DM Mono','Courier New',monospace",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #0f1f35" }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#29b6f6", letterSpacing: "0.03em" }}>
              Send to Bank
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#4a6080" }}>
              {lead?.contact_name ?? "Lead"} · {lead?.loan_id ?? lead?.id}
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
            <label style={labelStyle}>Bank <span style={{ color: "#ef5350" }}>*</span></label>
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

          {/* Banker selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelStyle}>
              Banker <span style={{ color: "#ef5350" }}>*</span>
              {fetching && <span style={{ color: "#4a6080", fontSize: 10 }}> loading...</span>}
            </label>
            <select
              value={bankerId}
              onChange={(e) => { setBankerId(e.target.value); setError(""); }}
              disabled={!bankName || fetching}
              style={{
                ...selectStyle,
                opacity: !bankName || fetching ? 0.5 : 1,
                cursor:  !bankName || fetching ? "not-allowed" : "pointer",
              }}
            >
              <option value="">
                {!bankName           ? "— Select a bank first —"      :
                 fetching            ? "Loading bankers..."            :
                 bankers.length === 0 ? "No active bankers found"      :
                                       "— Select banker —"}
              </option>
              {bankers.map((b) => (
                <option key={b.id} value={b.id} style={{ background: "#0c1929" }}>
                  {b.name}
                  {b.branch      ? ` · ${b.branch}`      : ""}
                  {b.employee_id ? ` (${b.employee_id})` : ""}
                </option>
              ))}
            </select>
            {bankName && !fetching && bankers.length === 0 && (
              <span style={{ fontSize: 11, color: "#ef9a9a" }}>
                No active bank admins found for {bankName}.
              </span>
            )}
          </div>

          {/* Lead summary */}
          <div style={{ background: "#0a1628", border: "1px solid #0f1f35", borderRadius: 8, padding: "12px 16px" }}>
            {[
              ["Loan Type",     lead?.loan_type ?? "—"],
              ["Amount",        lead?.amount
                                  ? `₹${(lead.amount / 100000).toFixed(1)}L`
                                  : lead?.loan_amount_requested
                                  ? `₹${(lead.loan_amount_requested / 100000).toFixed(1)}L`
                                  : "—"],
              ["CIBIL",         lead?.cibil_score ?? lead?.credit_score ?? "—"],
              ["Current Stage", (lead?.state ?? lead?.stage ?? "—").replace(/_/g, " ")],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #0f1f3566" }}>
                <span style={{ fontSize: 11, color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</span>
                <span style={{ fontSize: 13, color: "#c5d0e0", fontWeight: 600 }}>{String(v)}</span>
              </div>
            ))}
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
            disabled={loading || !bankName || !bankerId}
            style={{
              background: "#0d2137", border: "1px solid #29b6f6", borderRadius: 8,
              padding: "9px 24px", color: "#29b6f6", fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Mono',monospace", cursor: "pointer",
              opacity: loading || !bankName || !bankerId ? 0.5 : 1,
            }}
          >
            {loading ? "Sending…" : "Confirm & Send"}
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