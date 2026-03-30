// src/pages/SalesOverviewPage.jsx

import { useEffect, useState } from "react";
import ChartCanvas from "../components/charts/ChartCanvas";
import {
  getSalesOverview,
  getTrends,
  getPipeline
} from "../api/dashboardApi";
import DisbursedLoansTable from "../components/dashboard/DisbursedLoansTable";
import BankPerformanceTable from "../components/dashboard/BankPerformanceTable";
import api from "../api/api";                              // ← NEW

const fmtAmount = (v) => {                                 // ← NEW
  if (!v) return "—";
  return "₹" + (Number(v) / 100000).toFixed(1) + "L";
};

const fmtDate = (v) => {                                   // ← NEW
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

export default function SalesOverviewPage() {
  const [kpis,        setKpis]        = useState({});
  const [pipeline,    setPipeline]    = useState([]);
  const [monthly,     setMonthly]     = useState([]);
  const [health,      setHealth]      = useState({});
  const [loading,     setLoading]     = useState(true);
  const [pendingDocs, setPendingDocs] = useState([]);      // ← NEW
  const [docsLoading, setDocsLoading] = useState(true);   // ← NEW
  const [sentLinks, setSentLinks] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDashboard();
    loadPendingDocs();                                      // ← NEW
  }, []);

  // ── NEW: load pending docs ────────────────────────────
  const loadPendingDocs = async () => {
    try {
      setDocsLoading(true);
      const res  = await api.get("/api/bank-dashboard/pending-docs");
      const data = res?.data;
      setPendingDocs(Array.isArray(data) ? data : []);
      const sentMap = {};

(data || []).forEach((loan) => {
  if (localStorage.getItem(`doc_link_sent_${loan.id}`)) {
    sentMap[loan.id] = true;
  }
});

setSentLinks(sentMap);
    } catch (err) {
      console.error("Pending docs load error:", err);
      setPendingDocs([]);
    } finally {
      setDocsLoading(false);
    }
  };
  const sendUploadLink = async (loanId) => {
  try {
    const res = await api.post(`/api/documents/send-upload-link/${loanId}`);

    setMessage(res?.data?.message || "Upload link sent");

    setSentLinks((prev) => ({
      ...prev,
      [loanId]: true
    }));

    localStorage.setItem(`doc_link_sent_${loanId}`, "true");

    setTimeout(() => setMessage(""), 3000);

  } catch (err) {
    console.error("Send upload link error:", err);
    setMessage("Failed to send upload link");
  }
};
  const normalizeArray = (res) => {
    const data = res?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

 const loadDashboard = async () => {
  try {
    setLoading(true);

    const [salesRes, pipelineRes, trendsRes] =
      await Promise.allSettled([
        getSalesOverview(),
        getPipeline(),
        getTrends()
      ]);

    const salesData =
      salesRes.status === "fulfilled" ? salesRes.value?.data || {} : {};

    const pipelineData =
      pipelineRes.status === "fulfilled"
        ? normalizeArray(pipelineRes.value)
        : [];

    const trendsData =
      trendsRes.status === "fulfilled"
        ? normalizeArray(trendsRes.value)
        : [];

    setKpis(salesData);
    setPipeline(pipelineData);
    setMonthly(trendsData);

  } catch (err) {
    console.error("Dashboard load error:", err);
  } finally {
    setLoading(false);
  }
};
  if (loading) {
    return (
      <div style={{ padding: 40, fontSize: 14, color: "#cbd5e1" }}>
        Loading Sales Dashboard...
      </div>
    );
  }

  const K = kpis || {};
  const P = Array.isArray(pipeline) ? pipeline : [];
  const M = Array.isArray(monthly) ? monthly : [];
  const H = health || {};
  const PRE = kpis || {};
  const BANK = kpis || {};

  const fmtLakhs = (v) => "₹" + ((Number(v || 0)) / 100000).toFixed(1) + "L";

  const totalActive = P.reduce((sum, s) => sum + Number(s.count || 0), 0);

  const preSalesHealth = [
  { label: "New Leads", value: Number(PRE.total_leads || 0), color: "#6366f1" },
  { label: "Qualified", value: Number(PRE.qualified || 0), color: "#22c55e" },
  { label: "Docs Pend", value: Number(PRE.docs_pending || 0), color: "#f97316" },
  { label: "Not Qual", value: Number(PRE.not_qualified || 0), color: "#ef4444" },
];

const preSalesNewLeads = Number(PRE.total_leads || 0);
const preSalesQualified = Number(PRE.qualified || 0);

const preSalesConversionPct =
  preSalesNewLeads > 0
    ? Math.round((preSalesQualified / preSalesNewLeads) * 100)
    : 0;

const pipelineSent = P.reduce((sum, x) => {
  const stage = String(x.label || x.stage || "").toLowerCase();

  if (
    [
      "submitted_to_bank",
      "under_review",
      "documents_required",
      "docs_review_complete",
      "bank_processing",
      "bank_approved",
      "bank_rejected",
      "loan_disbursed"
    ].includes(stage)
  ) {
    return sum + Number(x.count || 0);
  }

  return sum;
}, 0);

 const bankHealth = [
  { label: "Sent", value: Number(pipelineSent), color: "#0ea5e9" },

  { label: "Approved", value: Number(BANK.loan_disbursed || 0), color: "#22c55e" },

  { label: "Rejected", value: Number(BANK.bank_rejected || 0), color: "#dc2626" },

  {
    label: "Processing",
    value: Math.max(
      Number(pipelineSent) -
        Number(BANK.loan_disbursed || 0) -
        Number(BANK.bank_rejected || 0),
      0
    ),
    color: "#8b5cf6",
  },
];

  const sentCount     = Number(pipelineSent || 0);
  const approvedCount = Number(BANK.loan_disbursed || 0);
  const bankApprovalPct =
    sentCount > 0 ? Math.round((approvedCount / sentCount) * 100) : 0;

  const statCards = [
    { label: "Total Leads",    val: K.total_leads || 0,             sub: "Full pipeline volume",   color: "#f97316", progress: Math.min(Number(K.total_leads    || 0),     100) },
    { label: "Disbursed",      val: K.loan_disbursed || 0,          sub: "Completed loans",        color: "#22c55e", progress: Math.min(Number(K.loan_disbursed  || 0) * 8, 100) },
    { label: "Revenue",        val: fmtLakhs(K.total_disbursed_amount), sub: "Total disbursed",    color: "#f59e0b", progress: Number(K.total_disbursed_amount   || 0) > 0 ? 62 : 0 },
    { label: "E2E Conv. Rate", val: `${K.conversion_rate || 0}%`,   sub: "Lead to disbursal",      color: "#0ea5e9", progress: Math.min(Number(K.conversion_rate  || 0),     100) },
    { label: "Bank Approval",  val: `${bankApprovalPct}%`,          sub: "Sent to approved",       color: "#8b5cf6", progress: Math.min(Number(bankApprovalPct    || 0),     100) },
    
    { label: "Avg Qualify",    val: `${K.avg_days_qualify  || 0}d`, sub: "Lead to qualified",      color: "#f59e0b", progress: Math.min(Number(K.avg_days_qualify  || 0) * 8, 100) },
    { label: "Avg Disburse",   val: `${K.avg_days_disburse || 0}d`, sub: "Lead to disbursed",      color: "#0284c7", progress: Math.min(Number(K.avg_days_disburse || 0) * 4, 100) },
  ];

  const portfolioHealth = [
    { label: "Disbursed", value: K.loan_disbursed || 0, color: "#22c55e" },
    {
      label: "Defaulted",
      value:
        K.defaulted ||
        P.find((x) =>
          ["default", "defaulted"].includes(
            String(x.label || x.stage || "").toLowerCase()
          )
        )?.count || 0,
      color: "#e11d48",
    },
    {
      label: "Deal Lost",
      value:
        P.find((x) =>
          ["deal lost", "deal_lost", "not qualified", "not_qualified"].includes(
            String(x.label || x.stage || "").toLowerCase()
          )
        )?.count || 0,
      color: "#94a3b8",
    },
    { label: "Default%", value: `${K.default_rate || 0}%`, color: "#ef4444", isText: true },
  ];

  const monthlyDatasets = [
    {
      label: "New Leads",
      data: M.length > 1
        ? M.map((r) => r.new_leads || 0)
        : [0, ...(M.map((r) => r.new_leads || 0))],
      borderColor: "#f97316",
      backgroundColor: "rgba(249,115,22,0.10)",
      tension: 0.4,
      fill: true,
    },
    {
      label: "Disbursed",
      data: M.map((r) => r.disbursed ?? r.loan_disbursed ?? 0),
      borderColor: "#22c55e",
      backgroundColor: "rgba(34,197,94,0.10)",
      tension: 0.4,
      fill: true,
    },
  ];

  const funnelDatasets = [
    {
      data: P.map((s) => s.count || 0),
      backgroundColor: [
        "rgba(99,102,241,0.15)", "rgba(14,165,233,0.15)", "rgba(245,158,11,0.15)",
        "rgba(249,115,22,0.15)", "rgba(34,197,94,0.15)",  "rgba(2,132,199,0.15)",
        "rgba(139,92,246,0.15)", "rgba(34,197,94,0.15)",  "rgba(34,197,94,0.15)",
      ],
      borderColor: [
        "#6366f1", "#0ea5e9", "#f59e0b", "#f97316", "#22c55e",
        "#0284c7", "#8b5cf6", "#22c55e", "#22c55e",
      ],
      borderWidth: 2,
      borderRadius: 8,
    },
  ];

  return (
    <div style={{ color: "#e2e8f0" }}>

      {/* ── NEW: PENDING DOCS ALERT TABLE ──────────────── */}
      {!docsLoading && pendingDocs.length > 0 && (
        <div style={{ background: "linear-gradient(180deg,rgba(10,20,39,0.98),rgba(8,16,31,0.98))", border: "1px solid #ea580c66", borderRadius: 20, padding: "18px 20px", marginBottom: 22, boxShadow: "0 8px 30px rgba(0,0,0,0.22)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ background: "#ea580c22", border: "1px solid #ea580c44", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#ea580c", fontFamily: "'DM Mono',monospace", letterSpacing: 1 }}>
                  ACTION REQUIRED
                </div>
                <div style={{ background: "#ea580c", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff" }}>
                  {pendingDocs.length}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#eef4ff", marginBottom: 2 }}>
                Documents Required — Contact Customers
              </div>
              <div style={{ fontSize: 11, color: "#71809b" }}>
                Bank has requested additional documents. Please contact customers immediately.
              </div>
            </div>
            <button
              onClick={loadPendingDocs}
              style={{ background: "#1a2235", border: "1px solid #1e293b", borderRadius: 8, padding: "7px 14px", fontSize: 11, color: "#64748b", cursor: "pointer", fontFamily: "'DM Mono',monospace" }}
            >
              Refresh
            </button>
          </div>
          {message && (
  <div
    style={{
      marginBottom: 10,
      fontSize: 12,
      color: "#22c55e",
      fontWeight: 600
    }}
  >
    {message}
  </div>
)}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Loan ID", "Customer", "Email", "Phone", "Loan Amount", "Bank", "Banker's Note", "Flagged On", "Action"].map(h => (
                    <th key={h} style={{ padding: "9px 14px", fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#64748b", textAlign: "left", background: "#0f1a2e", borderBottom: "1px solid #1e293b", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingDocs.map((loan, i) => (
                  <tr key={loan.id} style={{ borderBottom: "1px solid #ffffff06", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td style={{ padding: "11px 14px", fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#0891b2", fontWeight: 700 }}>{loan.loan_id || "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{loan.contact_name || "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "#64748b" }}>{loan.contact_email || "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "#64748b" }}>{loan.phone || "—"}</td>
                    <td style={{ padding: "11px 14px", fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{fmtAmount(loan.loan_amount_requested)}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "#0369a1", fontWeight: 600 }}>{loan.bank_name || "—"}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "#ea580c", maxWidth: 220 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loan.last_comment || "—"}</span>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{fmtDate(loan.state_updated_at)}</td>
                    <td style={{ padding: "11px 14px" }}>
  <button
    onClick={() => sendUploadLink(loan.id)}
    style={{
      background: sentLinks[loan.id] ? "#16a34a" : "#ea580c",
      border: "none",
      borderRadius: 6,
      padding: "6px 10px",
      fontSize: 10,
      fontWeight: 700,
      color: "#fff",
      cursor: "pointer",
      fontFamily: "'DM Mono',monospace"
    }}
  >
    {sentLinks[loan.id] ? "Resend Link" : "Send Link"}
  </button>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ paddingTop: 10, fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#64748b", textAlign: "right", borderTop: "1px solid #1e293b", marginTop: 8 }}>
            {pendingDocs.length} loan{pendingDocs.length !== 1 ? "s" : ""} awaiting documents
          </div>
        </div>
      )}
      {/* ── END PENDING DOCS ──────────────────────────── */}

      {/* KPI GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        {statCards.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            val={s.val}
            sub={s.sub}
            color={s.color}
            progress={s.progress}
          />
        ))}
      </div>

      {/* PIPELINE FLOW */}
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(10,20,39,0.98) 0%, rgba(8,16,31,0.98) 100%)",
          border: "1px solid rgba(40,59,92,0.85)",
          borderRadius: 20,
          padding: "18px 16px",
          marginBottom: 22,
          boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#eef4ff", marginBottom: 2 }}>
              Full Pipeline Flow
            </div>
            <div style={{ fontSize: 11, color: "#71809b", letterSpacing: 0.3 }}>
              Live lead count at each stage — all {P.length} active stages
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#71809b", letterSpacing: 1.2 }}>
            Total active:{" "}
            <span style={{ color: "#eef4ff", fontWeight: 800 }}>{totalActive} leads</span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(P.length, 1)}, minmax(110px, 1fr))`,
            gap: 0,
            overflowX: "auto",
            borderRadius: 14,
          }}
        >
          {P.map((stage, idx) => {
            const label = stage.label || stage.stage || `Stage ${idx + 1}`;
            const count = Number(stage.count || 0);
            const color = stage.color || pipelineColor(label);
            return (
              <div
                key={`${label}-${idx}`}
                style={{
                  minWidth: 110,
                  padding: "14px 12px 10px",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  borderLeft: idx === 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  borderRight: "1px solid rgba(255,255,255,0.04)",
                  background: "rgba(255,255,255,0.01)",
                  position: "relative",
                }}
              >
                {idx < P.length - 1 && (
                  <div style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.12)", fontSize: 18, fontWeight: 700, zIndex: 2 }}>›</div>
                )}
                <div style={{ fontSize: 18, fontWeight: 900, color, textAlign: "center", lineHeight: 1.1, marginBottom: 10 }}>{count}</div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.4, color: "#7c8aa5", textAlign: "center", minHeight: 26, lineHeight: 1.4 }}>{label}</div>
                <div style={{ marginTop: 10, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(totalActive ? (count / totalActive) * 100 : 0, 100)}%`, height: "100%", background: color, borderRadius: 999 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HEALTH ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          gap: 18,
          marginBottom: 22,
        }}
      >
        <HealthCard title="Pre-Sales Health"  headline={`${preSalesConversionPct}%`}      subtitle="New → Qualified conversion"        color="#0ea5e9" items={preSalesHealth} />
        <HealthCard title="Bank Health"       headline={`${bankApprovalPct}%`}             subtitle="Approval rate (Sent → Approved)"   color="#8b5cf6" items={bankHealth} />
        <HealthCard title="Portfolio Health"  headline={fmtLakhs(K.total_disbursed_amount)} subtitle="Total disbursed this period"       color="#22c55e" items={portfolioHealth} />
      </div>

      {/* CHARTS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          marginBottom: 22,
        }}
      >
        <ChartCard title="Monthly Trend" sub="New leads vs Disbursals">
          <ChartCanvas
            id="monthly"
            type="line"
            labels={M.map((r) => r.date?.slice(5) || "")}
            datasets={monthlyDatasets}
          />
        </ChartCard>

        <ChartCard title="Stage Funnel" sub="Drop-off across active stages">
          <ChartCanvas
            id="funnel"
            type="bar"
            indexAxis="y"
            labels={P.map((s) => s.label || s.stage || "-")}
            datasets={funnelDatasets}
            showLegend={false}
          />
        </ChartCard>
      </div>
            {/* DISBURSED LOANS TABLE */}
      <div style={{ marginTop: 22 }}>
        <DisbursedLoansTable />
      </div>
      <BankPerformanceTable />
    </div>
  );
}

function pipelineColor(label) {
  const key = String(label || "").toLowerCase();
  if (key.includes("new"))        return "#6366f1";
  if (key.includes("progress"))   return "#0ea5e9";
  if (key.includes("review"))     return "#f59e0b";
  if (key.includes("docs"))       return "#f97316";
  if (key.includes("qualified"))  return "#22c55e";
  if (key.includes("sent"))       return "#0284c7";
  if (key.includes("approved"))   return "#22c55e";
  if (key.includes("disbursed"))  return "#22c55e";
  if (key.includes("processing")) return "#8b5cf6";
  return "#64748b";
}

function StatCard({ label, val, sub, color, progress }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(10,20,39,0.98) 0%, rgba(8,16,31,0.98) 100%)",
        border: `1px solid ${color}`,
        borderRadius: 18,
        padding: "18px 20px 16px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.20)",
      }}
    >
      <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 12, color: color, opacity: 0, height: 0 }}>.</div>
      <div style={{ fontSize: 22, fontWeight: 900, color, marginBottom: 4 }}>{val}</div>
      <div style={{ fontSize: 15, color: "#cbd5e1", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: "#71809b", marginBottom: 12 }}>{sub}</div>
      <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ width: `${Math.min(progress || 0, 100)}%`, height: "100%", background: color, borderRadius: 99 }} />
      </div>
    </div>
  );
}

function HealthCard({ title, headline, subtitle, color, items }) {
  const maxVal = Math.max(
    ...items.map((x) =>
      typeof x.value === "number"
        ? x.value
        : parseFloat(String(x.value).replace("%", "")) || 0
    ),
    1
  );
  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(10,20,39,0.98) 0%, rgba(8,16,31,0.98) 100%)",
        border: "1px solid rgba(40,59,92,0.85)",
        borderRadius: 18,
        padding: 22,
        boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
      }}
    >
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#7c8aa5", marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 900, color, lineHeight: 1, marginBottom: 6 }}>{headline}</div>
      <div style={{ fontSize: 13, color: "#7c8aa5", marginBottom: 16 }}>{subtitle}</div>
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => {
          const num = typeof item.value === "number"
            ? item.value
            : parseFloat(String(item.value).replace("%", "")) || 0;
          return (
            <div key={item.label} style={{ display: "grid", gridTemplateColumns: "88px 1fr 42px", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{item.label}</div>
              <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div style={{ width: `${Math.min((num / maxVal) * 100, 100)}%`, height: "100%", background: item.color, borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 12, color: item.color, textAlign: "right", fontWeight: 700 }}>{item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartCard({ title, sub, children }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(10,20,39,0.98) 0%, rgba(8,16,31,0.98) 100%)",
        border: "1px solid rgba(40,59,92,0.85)",
        borderRadius: 18,
        padding: 22,
        boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, color: "#eef4ff", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: "#71809b", marginBottom: 14 }}>{sub}</div>
      {children}
    </div>
  );
}