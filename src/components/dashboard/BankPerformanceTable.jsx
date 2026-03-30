import { useEffect, useState } from "react";
import { getBankPerformance } from "../../api/dashboardApi";

export default function BankPerformanceTable() {
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);

  const loadData = async () => {
    try {
      const res = await getBankPerformance();

      // flatten bankers
      const flat = [];

      (res.data || []).forEach((bank) => {
        (bank.bankers || []).forEach((b) => {
          flat.push({
            admin: b.banker_name,
            bank: bank.bank,
            sent: b.sent,
            approved: b.approved,
            rate: b.approval_rate,
          });
        });
      });

      setData(flat);
    } catch (err) {
      console.error("Bank performance load error", err);
    }
  };

  useEffect(() => {
    if (show) loadData();
  }, [show]);

  return (
    <div style={{ marginTop: 20 }}>
      
      {/* BUTTON */}
      <button
        onClick={() => setShow(!show)}
        style={{
          padding: "8px 14px",
          background: "#0ea5e9",
          border: "none",
          borderRadius: 6,
          color: "#fff",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600
        }}
      >
        {show ? "Hide Bank Performance" : "View Bank Performance"}
      </button>

      {/* TABLE */}
      {show && (
        <div
          style={{
            marginTop: 15,
            background:
              "linear-gradient(180deg, rgba(10,20,39,0.98) 0%, rgba(8,16,31,0.98) 100%)",
            border: "1px solid rgba(40,59,92,0.85)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e293b" }}>
                <th style={th}>Admin</th>
                <th style={th}>Bank</th>
                <th style={th}>Leads Sent</th>
                <th style={th}>Approved</th>
                <th style={th}>Rate</th>
              </tr>
            </thead>

            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #ffffff10" }}>
                  <td style={td}>{row.admin}</td>
                  <td style={td}>{row.bank}</td>
                  <td style={td}>{row.sent}</td>
                  <td style={td}>{row.approved}</td>
                  <td style={td}>{row.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = {
  padding: "10px",
  textAlign: "left",
  fontSize: 12,
  color: "#64748b",
  textTransform: "uppercase"
};

const td = {
  padding: "10px",
  fontSize: 13
};