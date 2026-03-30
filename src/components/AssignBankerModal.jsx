// src/components/AssignBankerModal.jsx
// Used when a lead is already in "logged_to_bank" state.
// Fetches the loan UUID from unassigned list by lead_id, then assigns a banker.

import { useState, useEffect } from "react";
import api from "../api/api";

export default function AssignBankerModal({ lead, onClose, onSuccess }) {
  const [loan,     setLoan]     = useState(null);
  const [bankers,  setBankers]  = useState([]);
  const [bankerId, setBankerId] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error,    setError]    = useState("");

  // close on Escape
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    fetchLoanAndBankers();
  }, []);

  const fetchLoanAndBankers = async () => {
    try {
      setFetching(true);
      setError("");

      // Step 1 — fetch unassigned loans and match by lead_id (numeric)
      const unassignedRes = await api.get("/api/bank-logging/unassigned");
      const unassigned = unassignedRes?.data ?? [];

      console.debug("[AssignBankerModal] lead object:", lead);
      console.debug("[AssignBankerModal] unassigned loans:", unassigned);

      // Primary match: lead.id (numeric DB id of the lead)
      // Fallback: contact_name match in case backend doesn't expose lead_id
      let matchedLoan =
        unassigned.find((l) => String(l.lead_id) === String(lead?.id)) ??
        unassigned.find((l) => l.contact_name?.trim().toLowerCase() === lead?.contact_name?.trim().toLowerCase()) ??
        null;

      if (!matchedLoan) {
        setError(
          "No unassigned loan found for this lead. It may have already been assigned or not yet logged."
        );
        setFetching(false);
        return;
      }

      setLoan(matchedLoan);

      // Step 2 — fetch bankers for this loan's bank
      const bankersRes = await api.get(
        `/api/bank-logging/bankers/${encodeURIComponent(matchedLoan.bank_name)}`
      );
      setBankers(bankersRes?.data ?? []);
    } catch (err) {
      console.error("AssignBankerModal fetch error:", err);
      setError("Failed to load loan details. Please try again.");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!bankerId) return setError("Please select a banker.");
    if (!loan)     return setError("Loan record not found.");
    setError("");
    setLoading(true);
    try {
      const res = await api.post(
        `/api/bank-logging/loans/${loan.loan_id}/assign-banker`,
        { banker_id: bankerId }
      );
      const msg =
        res?.data?.message ||
        `Banker assigned to ${lead.contact_name} successfully.`;
      onSuccess?.(msg);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg ?? "Failed to assign banker."
          : "Failed to assign banker."
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
        borderTop: "3px solid #f59e0b",
        borderRadius: 14,
        width: "100%", maxWidth: 440,
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        fontFamily: "'DM Mono','Courier New',monospace",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #0f1f35" }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.03em" }}>
              Assign Banker
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#4a6080" }}>
              {lead?.contact_name ?? "Lead"} · {lead?.loan_id ?? lead?.id}
            </p>
            {loan && (
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "#4a6080" }}>
                Bank: <span style={{ color: "#f59e0b" }}>{loan.bank_name}</span>
                {" · "}{loan.loan_reference}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a6080", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Loading */}
          {fetching && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#4a6080", fontSize: 13 }}>
              Loading loan details...
            </div>
          )}

          {/* Banker selector */}
          {!fetching && loan && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelStyle}>
                  Select Banker <span style={{ color: "#ef5350" }}>*</span>
                </label>
                <select
                  value={bankerId}
                  onChange={(e) => { setBankerId(e.target.value); setError(""); }}
                  disabled={bankers.length === 0}
                  style={{
                    ...selectStyle,
                    opacity: bankers.length === 0 ? 0.5 : 1,
                    cursor:  bankers.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">
                    {bankers.length === 0
                      ? `No active bankers for ${loan.bank_name}`
                      : "— Select banker —"}
                  </option>
                  {bankers.map((b) => (
                    <option key={b.id} value={b.id} style={{ background: "#0c1929" }}>
                      {b.name}
                      {b.branch      ? ` · ${b.branch}`      : ""}
                      {b.employee_id ? ` (${b.employee_id})` : ""}
                    </option>
                  ))}
                </select>
                {bankers.length === 0 && (
                  <span style={{ fontSize: 11, color: "#ef9a9a" }}>
                    No active bank admins found for {loan.bank_name}. Add a bank admin first.
                  </span>
                )}
              </div>

              {/* Loan summary */}
              <div style={{ background: "#0a1628", border: "1px solid #0f1f35", borderRadius: 8, padding: "12px 16px" }}>
                {[
                  ["Loan Ref",  loan.loan_reference ?? "—"],
                  ["Bank",      loan.bank_name ?? "—"],
                  ["Amount",    loan.loan_amount_requested
                                  ? `₹${(loan.loan_amount_requested / 100000).toFixed(1)}L`
                                  : "—"],
                  ["Stage",     (loan.stage ?? "—").replace(/_/g, " ")],
                  ["Logged On", loan.created_at
                                  ? new Date(loan.created_at).toLocaleDateString("en-IN", {
                                      day: "2-digit", month: "short", year: "numeric",
                                    })
                                  : "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #0f1f3566" }}>
                    <span style={{ fontSize: 11, color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</span>
                    <span style={{ fontSize: 13, color: "#c5d0e0", fontWeight: 600 }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

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
            disabled={loading || !bankerId || fetching || !loan}
            style={{
              background: "#1a1200", border: "1px solid #f59e0b", borderRadius: 8,
              padding: "9px 24px", color: "#f59e0b", fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Mono',monospace", cursor: "pointer",
              opacity: loading || !bankerId || fetching || !loan ? 0.5 : 1,
            }}
          >
            {loading ? "Assigning…" : "Assign Banker"}
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
