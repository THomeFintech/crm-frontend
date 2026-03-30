// src/pages/BankAdminPage.jsx
import { useEffect, useState, useMemo } from "react";
import KpiCard   from "../components/ui/KpiCard";
import { fmtAmount, fmtDate } from "../utils/formatters";
import { getBankDashboard, updateLoanStage } from "../api/bankDashboardApi";
import api from "../api/api";
const BANK_STAGES = [
  { key: "submitted_to_bank",    label: "1. Submitted to Bank",    color: "#0369a1" },
  { key: "under_review",         label: "2. Under Review",         color: "#7c3aed" },
  { key: "documents_required",   label: "3. Documents Required",   color: "#ea580c" },
  { key: "docs_review_complete", label: "4. Docs Review Complete", color: "#0891b2" },

  { key: "bank_processing",      label: "5. Bank Processing",      color: "#8b5cf6" },
  { key: "sanctioned",           label: "6. Sanctioned",            color: "#0ea5e9" },

  { key: "bank_approved",        label: "7. Approved",              color: "#15803d" },
  { key: "partially_approved",   label: "7. Partially Approved",    color: "#d97706" },
  { key: "bank_rejected",        label: "7. Rejected",              color: "#b91c1c" },

  { key: "disbursement_initiated", label: "8. Disbursement Initiated", color: "#9333ea" },

  { key: "loan_disbursed",       label: "9. Loan Disbursed",        color: "#16a34a" },
];
export default function BankAdminPage({ user, showToast }) {
  const [dashData, setDashData] = useState(null);
  const [loans,    setLoans]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [drawer,   setDrawer]   = useState(null);
  const [comment,  setComment]  = useState("");
  const [stage,    setStage]    = useState("");
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [docs, setDocs] = useState([]);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res  = await getBankDashboard();
      const data = res?.data;
      setDashData(data);
      setLoans(Array.isArray(data?.loans) ? data.loans : []);
    } catch (err) {
      console.error("Bank dashboard error:", err);
      showToast?.("Failed to load bank dashboard", "#dc2626");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return loans.filter(l =>
      (!filter || l.stage === filter) &&
      (!search ||
        (l.contact_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.loan_id      || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.pan_number   || "").toLowerCase().includes(search.toLowerCase()))
    );
  }, [loans, search, filter]);

  const kpis = dashData?.kpis || {};

  const openDrawer = (loan) => {
    setDrawer(loan);
    setStage(loan.stage);
    setComment("");
  };

  const handleUpdate = async () => {
    if (!comment.trim()) {
      showToast?.("Comment is mandatory for every step", "#d97706");
      return;
    }
    if (!stage) {
      showToast?.("Please select a stage", "#d97706");
      return;
    }
    setSaving(true);
    try {
      const res     = await updateLoanStage(drawer.id, stage, comment.trim());
      const updated = res?.data;
      setLoans(prev => prev.map(l => l.id === drawer.id ? { ...l, ...updated } : l));
      setDrawer(prev => ({ ...prev, ...updated }));
      setComment("");
      const stageLabel = BANK_STAGES.find(s => s.key === stage)?.label || stage;
      showToast?.(`Updated to "${stageLabel}"`, "#16a34a");
    } catch (err) {
      console.error("Stage update error:", err);
      const detail = err?.response?.data?.detail;
      showToast?.(typeof detail === "string" ? detail : "Failed to update stage", "#dc2626");
    } finally {
      setSaving(false);
    }
  };

  const viewDocuments = async (loanId) => {
  try {
    const res = await api.get(`/api/documents/loan/${loanId}`);
    setDocs(res.data || []);
    setShowDocs(true);
  } catch (err) {
    console.error("Failed to load documents", err);
    showToast?.("Failed to load documents", "#dc2626");
  }
};

  const stageInfo = (key) =>
    BANK_STAGES.find(s => s.key === key) || { label: (key || "").replace(/_/g, " "), color: "#64748b" };

  const parseComments = (notes) => {
    if (!notes) return [];
    return notes.split("\n")
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/^\[(.+?)\]\s(.+)$/);
        return match ? { date: match[1], text: match[2] } : { date: "", text: line };
      });
  };

  if (loading) {
    return <div style={{ padding: 24, color: "#94a3b8" }}>Loading Bank Dashboard...</div>;
  }

  return (
    <div>
      {/* Notice */}
      <div style={{ background: "#001020", border: "1px solid #0369a144", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#64748b", marginBottom: 20 }}>
        <span style={{ color: "#0369a1", fontWeight: 700 }}>
          {dashData?.bank_name || "Bank"} — {dashData?.banker_name}
        </span>
        — Only leads assigned to your account are visible. Comment is mandatory at every stage update.
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard icon="total"        label="Total Routed"  val={kpis.total              || 0} color="#0369a1" />
        <KpiCard icon="new"          label="Submitted"     val={kpis.submitted_to_bank  || 0} color="#0891b2" />
        <KpiCard icon="review"       label="Under Review"  val={kpis.under_review       || 0} color="#7c3aed" />
        <KpiCard icon="docs"         label="Docs Required" val={kpis.documents_required || 0} color="#ea580c" />
        <KpiCard icon="progress"     label="Processing"    val={kpis.bank_processing    || 0} color="#8b5cf6" />
        <KpiCard icon="qualified"    label="Approved"      val={kpis.bank_approved      || 0} color="#15803d" />
        <KpiCard icon="notqualified" label="Rejected"      val={kpis.bank_rejected      || 0} color="#b91c1c" />
      </div>

      {/* Table */}
      <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1e293b" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Leads Assigned to You</div>
            <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'DM Mono',monospace", marginTop: 2 }}>
              {dashData?.banker_name} · {dashData?.bank_name || "—"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, loan ID, PAN..."
              style={{ background: "#1a2235", border: "1px solid #1e293b", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "#f1f5f9", outline: "none", width: 210, fontFamily: "'Cabinet Grotesk',sans-serif" }}
            />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ background: "#1a2235", border: "1px solid #1e293b", borderRadius: 8, padding: "7px 10px", fontSize: 11, color: "#64748b", fontFamily: "'DM Mono',monospace", outline: "none", cursor: "pointer" }}
            >
              <option value="">All Stages</option>
              {BANK_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <button
              onClick={loadDashboard}
              style={{ background: "#1a2235", border: "1px solid #1e293b", borderRadius: 8, padding: "7px 14px", fontSize: 11, color: "#64748b", cursor: "pointer", fontFamily: "'DM Mono',monospace" }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Loan ID", "Name", "Contact", "PAN", "Amount", "CIBIL", "Stage", "Last Comment", "Routed On", "Documents", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#64748b", textAlign: "left", background: "#1a2235", borderBottom: "1px solid #1e293b", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px 16px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    No leads assigned to your account yet.
                  </td>
                </tr>
              ) : filtered.map(l => {
                const si = stageInfo(l.stage);
                return (
                  <tr key={l.id} style={{ borderBottom: "1px solid #ffffff04" }}>
                    <td style={{ padding: "11px 14px", fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#0891b2" }}>
                      {l.loan_id || "—"}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <strong style={{ cursor: "pointer", color: "#f1f5f9", fontSize: 12 }} onClick={() => openDrawer(l)}>
                        {l.contact_name || "—"}
                      </strong>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#64748b", fontSize: 11 }}>
                      {l.contact_email || "—"}<br />{l.phone || "—"}
                    </td>
                    <td style={{ padding: "11px 14px", fontFamily: "'DM Mono',monospace", fontSize: 11 }}>
                      {l.pan_number || "—"}
                    </td>
                    <td style={{ padding: "11px 14px", fontFamily: "'DM Mono',monospace", fontSize: 11 }}>
                      {fmtAmount(l.loan_amount_requested)}
                    </td>
                    <td style={{ padding: "11px 14px", fontFamily: "'DM Mono',monospace", fontSize: 11, color: (l.credit_score || 0) >= 700 ? "#16a34a" : "#d97706" }}>
                      {l.credit_score || "—"}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 700, background: si.color + "22", border: `1px solid ${si.color}44`, color: si.color, whiteSpace: "nowrap" }}>
                        {si.label}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "#64748b", maxWidth: 160 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.last_comment || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#64748b", fontSize: 11, whiteSpace: "nowrap" }}>
                      {fmtDate(l.created_at)}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
  <button
    onClick={() => viewDocuments(l.id)}
    style={{
      fontSize: 10,
      padding: "4px 10px",
      borderRadius: 6,
      border: "1px solid #0891b244",
      background: "#0891b211",
      color: "#0891b2",
      cursor: "pointer",
      fontWeight: 600
    }}
  >
    Docs Received
  </button>
</td>
                    <td style={{ padding: "11px 14px" }}>
                      <button
                        onClick={() => openDrawer(l)}
                        style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid #0369a144", background: "#0369a111", color: "#0369a1", cursor: "pointer", fontWeight: 600, fontFamily: "'Cabinet Grotesk',sans-serif" }}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #1e293b", fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#64748b", textAlign: "right" }}>
          Showing {filtered.length} of {loans.length} loans · Total ₹{((kpis.total_amount_requested || 0) / 100000).toFixed(1)}L
        </div>
      </div>
      {showDocs && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 200
    }}
  >
    <div
      style={{
        background: "#111827",
        padding: 24,
        borderRadius: 12,
        width: 420,
        border: "1px solid #1e293b"
      }}
    >
      <h3 style={{ marginBottom: 12 }}>Uploaded Documents</h3>

      {docs.length === 0 && (
        <div style={{ fontSize: 12, color: "#64748b" }}>
          No documents uploaded yet
        </div>
      )}

      {docs.map(doc => (
        <div
          key={doc.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8
          }}
        >
          <span>{doc.filename}</span>

          <a
            href={`/api/documents/download/${doc.id}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#0ea5e9", fontSize: 12 }}
          >
            Download
          </a>
        </div>
      ))}

      <button
        onClick={() => setShowDocs(false)}
        style={{
          marginTop: 12,
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid #1e293b",
          background: "#1a2235",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        Close
      </button>
    </div>
  </div>
)}
      {/* Drawer */}
      {drawer && (
        <>
          <div onClick={() => setDrawer(null)} style={{ position: "fixed", inset: 0, background: "#00000066", zIndex: 149 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: 440, height: "100vh", background: "#111827", borderLeft: "1px solid #1e293b", zIndex: 150, padding: 24, overflowY: "auto", boxShadow: "-8px 0 32px #00000044", fontFamily: "'Cabinet Grotesk',sans-serif", color: "#f1f5f9" }}>
            <button
              onClick={() => setDrawer(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "#1a2235", border: "1px solid #1e293b", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
            >×</button>

            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{drawer.contact_name}</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#0891b2", marginBottom: 20 }}>
              {drawer.loan_id} · {drawer.bank_name}
            </div>

            {/* Loan details */}
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Loan Details</div>
            <div style={{ background: "#1a2235", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
              {[
                ["Bank",          drawer.bank_name                                               || "—"],
                ["Loan Amount",   fmtAmount(drawer.loan_amount_requested)],
                ["Approved Amt",  drawer.loan_amount_approved ? fmtAmount(drawer.loan_amount_approved) : "—"],
                ["CIBIL Score",   drawer.credit_score                                            || "—"],
                ["PAN Number",    drawer.pan_number                                              || "—"],
                ["Email",         drawer.contact_email                                           || "—"],
                ["Phone",         drawer.phone                                                   || "—"],
                ["Current Stage", stageInfo(drawer.stage).label],
                ["Routed On",     fmtDate(drawer.created_at)],
                ["Last Updated",  fmtDate(drawer.state_updated_at)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1e293b", fontSize: 12 }}>
                  <span style={{ color: "#64748b" }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Comment history */}
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#64748b", marginBottom: 10 }}>
              Comment History
            </div>
            <div style={{ marginBottom: 20 }}>
              {parseComments(drawer.notes).length === 0 ? (
                <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", marginBottom: 8 }}>No comments yet</div>
              ) : parseComments(drawer.notes).map((c, i) => (
                <div key={i} style={{ background: "#1a2235", borderRadius: 8, padding: "10px 14px", marginBottom: 8, borderLeft: "3px solid #0369a1" }}>
                  <div style={{ fontSize: 12, color: "#f1f5f9", marginBottom: 4 }}>{c.text}</div>
                  {c.date && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#64748b" }}>{c.date}</div>}
                </div>
              ))}
            </div>

            {/* Update stage */}
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#64748b", marginBottom: 10 }}>
              Update Stage
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {BANK_STAGES.map(s => (
                <div
                  key={s.key}
                  onClick={() => setStage(s.key)}
                  style={{
                    fontSize: 10, padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                    border:      `1px solid ${s.color}44`,
                    background:  stage === s.key ? s.color + "33" : s.color + "11",
                    color:       s.color,
                    outline:     stage === s.key ? `2px solid ${s.color}` : "none",
                    outlineOffset: 2,
                    fontWeight:  stage === s.key ? 700 : 400,
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>

            {stage === "documents_required" && (
              <div style={{ background: "#ea580c11", border: "1px solid #ea580c44", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 11, color: "#ea580c" }}>
                Selecting this will notify the Sales team to contact the customer for additional documents.
              </div>
            )}

            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>
              Comment <span style={{ color: "#ea580c" }}>* mandatory</span>
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Enter your comment for this stage update..."
              rows={4}
              style={{ width: "100%", background: "#1a2235", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#f1f5f9", fontFamily: "'Cabinet Grotesk',sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />

            <button
              onClick={handleUpdate}
              disabled={saving}
              style={{ width: "100%", marginTop: 14, padding: 12, borderRadius: 10, border: "none", background: saving ? "#1a2235" : "#0369a1", color: saving ? "#64748b" : "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Cabinet Grotesk',sans-serif" }}
            >
              {saving ? "Saving..." : "Update Status"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}