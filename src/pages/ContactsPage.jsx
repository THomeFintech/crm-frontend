// src/pages/ContactsPage.jsx

import { useEffect, useState } from "react";
import { getContacts } from "../api/contactsApi";
import { STATUS_COLOR } from "../data/constants";

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const [sourceF, setSourceF] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);

      const res = await getContacts();
      const data = res.data?.results || res.data || [];

      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Contacts load error:", err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40 }}>Loading contacts...</div>;
  }

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();

    return (
      (!q ||
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.contact_id?.toLowerCase().includes(q)) &&
      (!statusF || c.status === statusF) &&
      (!sourceF || c.source === sourceF)
    );
  });

  const kpis = [
    { label: "Total Contacts", value: contacts.length, color: "#7c3aed" },
    {
      label: "New",
      value: contacts.filter((c) => c.status === "New").length,
      color: "#7c3aed",
    },
    {
      label: "Contacted",
      value: contacts.filter((c) => c.status === "Contacted").length,
      color: "#0891b2",
    },
    {
      label: "Qualified",
      value: contacts.filter((c) => c.status === "Qualified").length,
      color: "#059669",
    },
    {
      label: "Unqualified",
      value: contacts.filter((c) => c.status === "Unqualified").length,
      color: "#dc2626",
    },
  ];

  return (
    <div>
      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 14,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: k.color,
              }}
            >
              {k.value}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div
        style={{
          background: "#111827",
          border: "1px solid #1e293b",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Header Filters */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #1e293b",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>All Contacts</div>

            <div style={{ fontSize: 11, color: "#64748b" }}>
              contact form submissions & walk-ins
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, city..."
              style={{ width: 220, ...inputStyle }}
            />

            <Select
              value={statusF}
              onChange={setStatusF}
              options={["New", "Contacted", "Qualified", "Unqualified"]}
              placeholder="All Statuses"
            />

            <Select
              value={sourceF}
              onChange={setSourceF}
              options={["website", "Website Form", "Referral", "Walk-in", "Social Media"]}
              placeholder="All Sources"
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                {[
                  "Contact ID",
                  "Name / City",
                  "Contact",
                  "Status",
                  "Loan Request",
                  "Source",
                  "Date",
                ].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length > 0 ? (
                filtered.map((c) => {
                  const sc = STATUS_COLOR?.[c.status] || {
                    bg: "#33333318",
                    border: "#33333344",
                    text: "#94a3b8",
                  };

                  return (
                    <tr key={c.id}>
                      <td style={tdStyle}>{c.contact_id || c.id}</td>

                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {c.city}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div>{c.phone}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {c.email}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "3px 10px",
                            borderRadius: 5,
                            background: sc.bg,
                            border: `1px solid ${sc.border}`,
                            color: sc.text,
                          }}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td style={tdStyle}>{c.loan_type || "-"}</td>

                      <td style={tdStyle}>{c.source || "-"}</td>

                      <td style={tdStyle}>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "20px 16px",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No contacts found
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
            fontSize: 11,
            color: "#64748b",
          }}
        >
          Showing {filtered.length} of {contacts.length} contacts
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
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid #1e293b",
        background: "#1a2235",
        color: "#f1f5f9",
        fontSize: 12,
      }}
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

const inputStyle = {
  background: "#1a2235",
  border: "1px solid #1e293b",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 13,
  color: "#f1f5f9",
};

const thStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 10,
  color: "#64748b",
  textTransform: "uppercase",
};

const tdStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid #1e293b",
};