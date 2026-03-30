// src/pages/LeadsPage.jsx

import { useState, useEffect } from "react";
import { getLeads } from "../api/leadsApi";
import { STAGE_STYLE } from "../data/constants";

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [stageF, setStageF] = useState("");
  const [typeF, setTypeF] = useState("");

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);

      const res = await getLeads();

      const data = res.data?.results || res.data || [];
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading leads:", err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();

    return (
      (!q ||
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.loan_id?.toLowerCase().includes(q)) &&
      (!stageF || l.stage === stageF) &&
      (!typeF || l.loan_type === typeF)
    );
  });

  const stageCounts = {};
  leads.forEach((l) => {
    if (l.stage) {
      stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1;
    }
  });

  const kpis = [
    { label: "Total Leads", value: leads.length, color: "#f59e0b" },
    { label: "New Leads", value: stageCounts["New Lead"] || 0, color: "#6366f1" },
    { label: "In Progress", value: stageCounts["In Progress"] || 0, color: "#0891b2" },
    { label: "Under Review", value: stageCounts["Under Review"] || 0, color: "#d97706" },
    { label: "Docs Pending", value: stageCounts["Documents Pending"] || 0, color: "#ea580c" },
    { label: "Qualified", value: stageCounts["Qualified"] || 0, color: "#059669" },
    { label: "Not Qualified", value: stageCounts["Not Qualified"] || 0, color: "#dc2626" },
  ];

  const STAGES = [
    "New Lead",
    "In Progress",
    "Under Review",
    "Documents Pending",
    "Qualified",
    "Not Qualified",
  ];

  const LOAN_TYPES = [
    "Home Loan",
    "Personal Loan",
    "Business Loan",
    "Vehicle Loan",
    "Loan Against Property",
  ];

  if (loading) {
    return <div style={{ padding: 40 }}>Loading leads...</div>;
  }

  return (
    <div>
      {/* KPI CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderTop: `2px solid ${k.color}`,
              borderRadius: 14,
              padding: "16px 14px",
            }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: k.color,
              }}
            >
              {k.value}
            </div>

            <div
              style={{
                fontSize: 9,
                color: "#64748b",
                marginTop: 4,
                fontFamily: "'DM Mono',monospace",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* TABLE CARD */}
      <div
        style={{
          background: "#111827",
          border: "1px solid #1e293b",
          borderRadius: 14,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #1e293b",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>All Leads</div>

            <div style={{ fontSize: 11, color: "#64748b" }}>
              qualified prospects in the loan pipeline
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, city, email…"
              style={{
                width: 220,
                background: "#1a2235",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                color: "#f1f5f9",
              }}
            />

            <Select
              value={stageF}
              onChange={setStageF}
              options={STAGES}
              placeholder="All Stages"
            />

            <Select
              value={typeF}
              onChange={setTypeF}
              options={LOAN_TYPES}
              placeholder="All Loan Types"
            />
          </div>
        </div>

        {/* TABLE */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1a2235" }}>
                {[
                  "Loan ID",
                  "Name / City",
                  "Contact",
                  "Loan Type",
                  "Amount",
                  "Stage",
                  "CIBIL",
                  "Employment",
                  "Assigned",
                  "Notes",
                ].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length ? (
                filtered.map((l) => {
                  const ss = STAGE_STYLE?.[l.stage] || {
                    bg: "#33333318",
                    border: "#33333344",
                    text: "#94a3b8",
                  };

                  const amt = l.amount
                    ? "₹" + (l.amount / 100000).toFixed(1) + "L"
                    : "-";

                  const cc =
                    l.cibil_score >= 750
                      ? "#059669"
                      : l.cibil_score >= 680
                      ? "#d97706"
                      : "#dc2626";

                  return (
                    <tr
                      key={l.id}
                      style={{ borderBottom: "1px solid #ffffff05" }}
                    >
                      <td style={td}>{l.loan_id || l.id}</td>

                      <td style={td}>
                        <div style={{ fontWeight: 700 }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {l.city}
                        </div>
                      </td>

                      <td style={td}>
                        <div>{l.phone}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {l.email}
                        </div>
                      </td>

                      <td style={td}>{l.loan_type}</td>

                      <td
                        style={{
                          ...td,
                          color: "#f59e0b",
                          fontWeight: 700,
                        }}
                      >
                        {amt}
                      </td>

                      <td style={td}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 20,
                            background: ss.bg,
                            border: `1px solid ${ss.border}`,
                            color: ss.text,
                            fontSize: 10,
                          }}
                        >
                          {l.stage}
                        </span>
                      </td>

                      <td style={{ ...td, color: cc, fontWeight: 700 }}>
                        {l.cibil_score || "-"}
                      </td>

                      <td style={td}>{l.employment_type || "-"}</td>

                     <td style={td}>
  {l.stage === "Sent to Bank" && l.bank_name ? (
    <span style={{
      fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 700,
      background: "#0369a122", border: "1px solid #0369a144", color: "#0369a1",
      whiteSpace: "nowrap",
    }}>
      🏦 {l.bank_name}
    </span>
  ) : (
    l.assigned_to_name || l.assigned_to || "-"
  )}
</td>

                      <td
                        style={{
                          ...td,
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {l.notes || "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "#64748b",
                    }}
                  >
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            padding: "12px 22px",
            borderTop: "1px solid #1e293b",
            fontSize: 10,
            color: "#64748b",
          }}
        >
          Showing {filtered.length} of {leads.length} leads
        </div>
      </div>
    </div>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={selectStyle}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

const selectStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #1e293b",
  background: "#1a2235",
  color: "#f1f5f9",
  fontSize: 12,
};

const thStyle = {
  padding: "11px 16px",
  textAlign: "left",
  fontSize: 9,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "#64748b",
};

const td = {
  padding: "12px 16px",
};