// src/pages/PostSalesPage.jsx
import { useState, useEffect } from "react";

import KpiCard from "../components/ui/KpiCard";
import StateBadge from "../components/ui/StateBadge";
import ChartCanvas from "../components/charts/ChartCanvas";

import {
  getPostSalesDashboard,
  getTrends,
  getPipeline
} from "../api/dashboardApi";

import { getLoans } from "../api/loansApi";

import { ROLE } from "../data/constants";
import { fmtAmount, fmtDate } from "../utils/formatters";

export default function PostSalesPage({ user }) {
  const [kpis, setKpis] = useState({});
  const [funnel, setFunnel] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loans, setLoans] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const [loading, setLoading] = useState(true);

  const isBankAdmin = ROLE?.isBankAdmin
    ? ROLE.isBankAdmin(user?.role || "")
    : false;

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [postRes, trendRes, pipeRes, loansRes] = await Promise.allSettled([
        getPostSalesDashboard(),
        getTrends(),
        getPipeline(),
        getLoans(),
      ]);

      const postData =
        postRes.status === "fulfilled" ? postRes.value?.data || {} : {};

      const trendData =
        trendRes.status === "fulfilled"
          ? Array.isArray(trendRes.value?.data)
            ? trendRes.value.data
            : trendRes.value?.data?.results || []
          : [];

      const pipelineData =
        pipeRes.status === "fulfilled"
          ? Array.isArray(pipeRes.value?.data)
            ? pipeRes.value.data
            : pipeRes.value?.data?.results || []
          : [];

      const loanData =
        loansRes.status === "fulfilled"
          ? Array.isArray(loansRes.value?.data)
            ? loansRes.value.data
            : loansRes.value?.data?.results || []
          : [];

      setKpis(postData);
      setTrends(trendData);
      setFunnel(pipelineData);
      setLoans(loanData);
    } catch (error) {
      console.error("PostSales dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        Loading Post-Sales Dashboard...
      </div>
    );
  }

  const POST_STAGES = [
    "sent_to_bank",
    "bank_processing",
    "bank_approved",
    "bank_rejected",
    "loan_disbursed",
    "deal_lost",
    "default",
    "defaulted"
  ];

  const filtered = loans.filter((l) =>
    (!filter || l.stage === filter) &&
    (!search ||
      l.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.loan_id?.toLowerCase().includes(search.toLowerCase()))
  );

  const funnelDatasets = [{
    data: funnel.map((r) => r.count),
    backgroundColor: [
      "#0369a133",
      "#7c3aed33",
      "#15803d33",
      "#b91c1c33",
      "#16a34a33",
      "#64748b33",
      "#9f123933"
    ],
    borderColor: [
      "#0369a1",
      "#7c3aed",
      "#15803d",
      "#b91c1c",
      "#16a34a",
      "#64748b",
      "#9f1239"
    ],
    borderWidth: 2,
    borderRadius: 6
  }];

  const trendDatasets = [
    {
      label: "Disbursed",
      data: trends.map((r) => r.disbursed || 0),
      borderColor: "#16a34a",
      tension: 0.4,
      fill: false
    },
    {
      label: "Rejected",
      data: trends.map((r) => r.rejected || 0),
      borderColor: "#b91c1c",
      tension: 0.4,
      fill: false
    },
    {
      label: "Default",
      data: trends.map((r) => r.defaulted || 0),
      borderColor: "#9f1239",
      tension: 0.4,
      fill: false
    }
  ];

  return (
    <div>
      {isBankAdmin && (
        <div style={{
          background: "#001020",
          border: "1px solid #0369a144",
          borderRadius: 10,
          padding: "10px 16px",
          fontSize: 11,
          color: "#64748b",
          marginBottom: 16
        }}>
          <strong>Bank Admin</strong> — You can view bank pipeline and update bank decisions only.
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
        gap: 14,
        marginBottom: 24
      }}>
        <KpiCard label="Total in Pipeline" val={kpis.total || 0} color="#16a34a" />
        <KpiCard label="Sent to Bank" val={kpis.sent_to_bank || 0} color="#0369a1" />
        <KpiCard label="Bank Processing" val={kpis.bank_processing || 0} color="#7c3aed" />
        <KpiCard label="Bank Approved" val={kpis.bank_approved || 0} color="#15803d" />
        <KpiCard label="Loan Disbursed" val={kpis.loan_disbursed || 0} color="#16a34a" />
        <KpiCard label="Bank Rejected" val={kpis.bank_rejected || 0} color="#b91c1c" />
        <KpiCard label="Defaults" val={kpis.defaulted || 0} color="#9f1239" />

        <KpiCard
          label="Total Disbursed"
          val={`₹${((kpis.total_disbursed_amount || 0) / 100000).toFixed(0)}L`}
          color="#f59e0b"
          wide
        />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 24
      }}>
        <ChartCard title="Bank Pipeline Funnel" sub="Loans per stage">
          <ChartCanvas
            id="postFunnel"
            type="bar"
            labels={funnel.map((r) => r.stage?.replace(/_/g, " "))}
            datasets={funnelDatasets}
          />
        </ChartCard>

        <ChartCard title="30 Day Outcomes Trend" sub="Disbursed vs Rejected vs Default">
          <ChartCanvas
            id="postTrend"
            type="line"
            labels={trends.map((r) => r.date?.slice(5))}
            datasets={trendDatasets}
          />
        </ChartCard>
      </div>

      <div style={{
        background: "#111827",
        border: "1px solid #1e293b",
        borderRadius: 12,
        overflow: "hidden"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #1e293b",
          flexWrap: "wrap",
          gap: 10
        }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            Post-Sales Loans
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name..."
              style={{
                background: "#1a2235",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: "7px 12px",
                fontSize: 12,
                color: "#fff"
              }}
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                background: "#1a2235",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: "7px 10px",
                fontSize: 11,
                color: "#fff"
              }}
            >
              <option value="">All Stages</option>
              {POST_STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Name", "Contact", "PAN", "Stage", "Loan Amt", "CIBIL", "Updated"]
                .map((h) => (
                  <th key={h} style={{
                    padding: "10px 16px",
                    fontSize: 10,
                    color: "#94a3b8",
                    textAlign: "left",
                    background: "#1a2235"
                  }}>
                    {h}
                  </th>
                ))}
            </tr>
          </thead>

          <tbody>
            {filtered.length ? filtered.map((l) => (
              <tr key={l.loan_id} style={{ borderBottom: "1px solid #ffffff05" }}>
                <td style={td}>
                  <strong>{l.contact_name}</strong><br />
                  <span style={{ fontSize: 9, color: "#64748b" }}>
                    {l.loan_id}
                  </span>
                </td>

                <td style={td}>
                  {l.contact_email}<br />
                  {l.phone}
                </td>

                <td style={td}>{l.pan_number || "—"}</td>

                <td style={td}>
                  <StateBadge state={l.stage} />
                </td>

                <td style={td}>
                  {fmtAmount(l.loan_amount_requested)}
                </td>

                <td style={td}>
                  {l.credit_score || "—"}
                </td>

                <td style={td}>
                  {fmtDate(l.stage_updated_at || l.updated_at)}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} style={{
                  padding: "20px 16px",
                  textAlign: "center",
                  color: "#94a3b8"
                }}>
                  No loans found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartCard({ title, sub, children }) {
  return (
    <div style={{
      background: "#111827",
      border: "1px solid #1e293b",
      borderRadius: 12,
      padding: 20
    }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 16 }}>{sub}</div>
      {children}
    </div>
  );
}

const td = { padding: "11px 16px" };