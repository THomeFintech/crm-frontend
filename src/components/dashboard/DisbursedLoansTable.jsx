import { useEffect, useState } from "react";
import { getDisbursedLoanRecords } from "../../api/dashboardApi";

export default function DisbursedLoansTable() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLoans = async () => {
    try {
      setLoading(true);

      const res = await getDisbursedLoanRecords();

      // backend returns paginated response
      setLoans(res.data?.items || res.data || []);

    } catch (err) {
      console.error("Failed to load disbursed loans", err);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, color: "#94a3b8" }}>
        Loading disbursed loans...
      </div>
    );
  }

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(10,20,39,0.98) 0%, rgba(8,16,31,0.98) 100%)",
        border: "1px solid rgba(40,59,92,0.85)",
        borderRadius: 18,
        padding: 22,
        marginTop: 22,
        boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          marginBottom: 14,
          color: "#eef4ff",
        }}
      >
        Disbursed Loans
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #1e293b" }}>
            {[
              "Loan Ref",
              "Customer",
              "Email",
              "Mobile",
              "Bank",
              "Amount",
              "Loan Type",
              "Date",
            ].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "10px",
                  fontSize: 11,
                  letterSpacing: 1,
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loans.length === 0 && (
            <tr>
              <td
                colSpan="8"
                style={{
                  padding: 14,
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                No disbursed loans found
              </td>
            </tr>
          )}

          {loans.map((loan, i) => (
            <tr
              key={loan.loan_id}
              style={{
                borderBottom: "1px solid #ffffff08",
                background:
                  i % 2 === 0
                    ? "rgba(255,255,255,0.01)"
                    : "transparent",
              }}
            >
              <td style={{ padding: 10, fontFamily: "monospace" }}>
                {loan.loan_reference || "—"}
              </td>

              <td style={{ padding: 10, fontWeight: 600 }}>
                {loan.contact_name || "—"}
              </td>

              <td style={{ padding: 10 }}>
                {loan.contact_email ? (
                  <a
                    href={`mailto:${loan.contact_email}`}
                    style={{ color: "#38bdf8" }}
                  >
                    {loan.contact_email}
                  </a>
                ) : (
                  "—"
                )}
              </td>

              <td style={{ padding: 10 }}>
                {loan.phone ? (
                  <a
                    href={`tel:${loan.phone}`}
                    style={{ color: "#38bdf8" }}
                  >
                    {loan.phone}
                  </a>
                ) : (
                  "—"
                )}
              </td>

              <td style={{ padding: 10 }}>
                {loan.bank_name || "—"}
              </td>

              <td style={{ padding: 10 }}>
                ₹{Number(loan.disbursed_amount || 0).toLocaleString()}
              </td>

              <td style={{ padding: 10 }}>
                {loan.lead?.loan_type || "—"}
              </td>

              <td style={{ padding: 10 }}>
                {loan.disbursed_at
                  ? new Date(loan.disbursed_at).toLocaleDateString()
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}