// src/pages/PreSalesPage.jsx
import { useEffect, useMemo, useState } from "react";
import KpiCard from "../components/ui/KpiCard";
import StateBadge from "../components/ui/StateBadge";
import ChartCanvas from "../components/charts/ChartCanvas";
import { getPreSalesDashboard, getTrends } from "../api/dashboardApi";
import { getLeads } from "../api/leadsApi";
import { getContacts } from "../api/contactsApi";
import {
  updateContactState,
  updateLeadStage,
  checkContactEligibility,
  convertContactToLead,
} from "../api/conversionApi";
import { ROLE, stateStyle } from "../data/constants";
import { fmtAmount, fmtDate } from "../utils/formatters";
import { sendLoanForm, getLoanFormStatus } from "../api/loanformApi";
import LogToBankModal from "../components/LogToBankModal";
import AssignBankerModal from "../components/AssignBankerModal";


// ─── Stage definitions ───────────────────────────────────────────────────────

const LEAD_STATES = [
  "new_lead",
  "opportunity_open",
  "opportunity_in_progress",
  "opportunity_submitted",
  "under_review",
  "documents_pending",
  "qualified",
  "not_qualified",
  "sent_to_bank",
  "logged_to_bank",      // ← add this
];

const CONTACT_STATES = [
  "new_contact",
  "attempted_contact",
  "contacted",
  "documents_pending",
  "not_interested",
  "converted",
];

const ALL_STATES = [...new Set([...LEAD_STATES, ...CONTACT_STATES])];

// ─── CRITICAL: maps frontend snake_case → backend Title Case ─────────────────
// Backend VALID_STAGES: "New Lead" | "In Progress" | "Under Review" |
//                       "Documents Pending" | "Qualified" | "Not Qualified" | "Sent to Bank"
const API_STAGE_MAP = {
  new_lead:                "New Lead",
  opportunity_open:        "In Progress",
  opportunity_in_progress: "In Progress",
  opportunity_submitted:   "In Progress",
  under_review:            "Under Review",
  documents_pending:       "Documents Pending",
  qualified:               "Qualified",
  not_qualified:           "Not Qualified",
  sent_to_bank:            "Sent to Bank",
};

// ─── maps backend Title Case → frontend snake_case (for normalising responses) 
const STAGE_TO_SNAKE = {
  "New Lead":           "new_lead",
  "In Progress":        "opportunity_in_progress",
  "Under Review":       "under_review",
  "Documents Pending":  "documents_pending",
  "Qualified":          "qualified",
  "Not Qualified":      "not_qualified",
  "Sent to Bank":       "sent_to_bank",
  "Logged to Bank":        "logged_to_bank",   // ← add this
  logged_to_bank:          "logged_to_bank",
  // keep snake_case pass-through so already-normalised values survive
  new_lead:                "new_lead",
  opportunity_open:        "opportunity_open",
  opportunity_in_progress: "opportunity_in_progress",
  opportunity_submitted:   "opportunity_submitted",
  under_review:            "under_review",
  documents_pending:       "documents_pending",
  qualified:               "qualified",
  not_qualified:           "not_qualified",
  sent_to_bank:            "sent_to_bank",
};

const CONTACT_STATE_TO_SNAKE = {
  "New Contact":       "new_contact",
  "Attempted Contact": "attempted_contact",
  "Contacted":         "contacted",
  "Documents Pending": "documents_pending",
  "Not Interested":    "not_interested",
  "Converted":         "converted",
  // pass-through
  new_contact:       "new_contact",
  attempted_contact: "attempted_contact",
  contacted:         "contacted",
  documents_pending: "documents_pending",
  not_interested:    "not_interested",
  converted:         "converted",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

export default function PreSalesPage({ user, showToast }) {
  const [kpis, setKpis] = useState({
    total: 0, new_leads: 0, in_progress: 0, under_review: 0,
    docs_pending: 0, qualified: 0, not_qualified: 0, sent_to_bank: 0,
  });

  const [funnel,   setFunnel]   = useState([]);
  const [trends,   setTrends]   = useState([]);
  const [leads,    setLeads]    = useState([]);

  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("");
  const [drawer,  setDrawer]  = useState(null);

  const [convertModal,    setConvertModal]    = useState(null);
  const [converting,      setConverting]      = useState(false);
  const [checkingStatus,  setCheckingStatus]  = useState(false);
  const [loanFormCooldown, setLoanFormCooldown] = useState({});

  // Send to Bank modal state
 const [logBankLead, setLogBankLead] = useState(null);
 const [assignBankerLead, setAssignBankerLead] = useState(null);

  const [loading, setLoading] = useState(true);

  const role        = user?.role || "";
  const isAdmin     = ROLE.isPreFull(role);
  const isPreUser   = ROLE.isPreUser(role);
  const canSendBank = ROLE.canSendToBank(role);
  const showActions = isAdmin && !isPreUser;

  useEffect(() => { loadPageData(); }, []);

  // ─── data helpers ──────────────────────────────────────────────────────────

  const normalizeArray = (res) => {
    const data = res?.data;
    if (Array.isArray(data))           return data;
    if (Array.isArray(data?.results))  return data.results;
    if (Array.isArray(data?.items))    return data.items;
    return [];
  };

  const safeNum = (v) => Number(v || 0);

  const getErrorMessage = (err, fallback = "Something went wrong") => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const first = detail[0];
      if (typeof first === "string") return first;
      if (first?.msg) {
        const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : "";
        return field ? `${field}: ${first.msg}` : first.msg;
      }
      return fallback;
    }
    if (detail?.msg) return detail.msg;
    if (typeof err?.message === "string") return err.message;
    return fallback;
  };

  const normalizeLeadRecord = (item) => {
    const stageRaw = item?.stage || item?.lead_stage || item?.current_stage || item?.status || "New Lead";
    return {
      id:                    item?.id,
      loan_id:               item?.loan_id || item?.id || "—",
      contact_name:          item?.name || item?.full_name || item?.contact_name || "—",
      contact_email:         item?.email || item?.contact_email || "—",
      phone:                 item?.phone || item?.mobile || "—",
      pan_number:            item?.pan_number || item?.pan || "",
      loan_amount_requested: item?.loan_amount_requested || item?.loan_amount || item?.amount || 0,
      credit_score:          item?.cibil_score || item?.credit_score || null,
      assigned_to_name:      item?.assigned_to_name || item?.assigned_to || "—",
      state:                 STAGE_TO_SNAKE[stageRaw] || String(stageRaw).toLowerCase().replace(/\s+/g, "_"),
      state_updated_at:      item?.updated_at || item?.created_at || null,
      converted_at:          item?.converted_at || null,
      is_lead:               true,
      raw:                   item,
    };
  };

  const normalizeContactRecord = (item) => {
    const stateRaw = item?.state || item?.contact_state || item?.status || "new_contact";
    return {
      id:                    item?.id,
      loan_id:               item?.contact_id || item?.ref || item?.id || "—",
      contact_name:          item?.name || item?.full_name || item?.contact_name || "—",
      contact_email:         item?.email || item?.contact_email || "—",
      phone:                 item?.phone || item?.mobile || "—",
      pan_number:            item?.pan_number || item?.pan || "",
      loan_amount_requested: item?.loan_amount_requested || item?.loan_amount || item?.amount || 0,
      credit_score:          item?.cibil_score || item?.credit_score || null,
      assigned_to_name:      item?.assigned_to_name || item?.assigned_to || "—",
      state:                 CONTACT_STATE_TO_SNAKE[stateRaw] || stateRaw,
      state_updated_at:      item?.updated_at || item?.created_at || null,
      converted_at:          item?.converted_at || null,
      is_lead:               false,
      raw:                   item,
    };
  };

  // ─── load ──────────────────────────────────────────────────────────────────

  const loadPageData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, trendsRes, leadsRes, contactsRes] = await Promise.allSettled([
        getPreSalesDashboard(),
        getTrends(),
        getLeads(),
        getContacts(),
      ]);

      const dashboardData = dashboardRes.status === "fulfilled" ? dashboardRes.value?.data || {} : {};
      const trendsData    = trendsRes.status  === "fulfilled" ? normalizeArray(trendsRes.value)  : [];
      const leadsData     = leadsRes.status   === "fulfilled" ? normalizeArray(leadsRes.value).map(normalizeLeadRecord)   : [];
      const contactsData  = contactsRes.status === "fulfilled"
        ? normalizeArray(contactsRes.value).map(normalizeContactRecord).filter((c) => c.state !== "converted")
        : [];

      const merged = [...leadsData, ...contactsData];
      setLeads(merged);
      setTrends(trendsData);

      setKpis({
        total:        safeNum(dashboardData?.total)        || merged.length,
        new_leads:    safeNum(dashboardData?.new_leads)    || merged.filter((x) => x.is_lead && x.state === "new_lead").length,
        in_progress:  safeNum(dashboardData?.in_progress)  || merged.filter((x) => x.is_lead && ["opportunity_open","opportunity_in_progress","opportunity_submitted"].includes(x.state)).length,
        under_review: safeNum(dashboardData?.under_review) || merged.filter((x) => x.is_lead && x.state === "under_review").length,
        docs_pending: safeNum(dashboardData?.docs_pending) || safeNum(dashboardData?.documents_pending) || merged.filter((x) => x.state === "documents_pending").length,
        qualified:    safeNum(dashboardData?.qualified)    || merged.filter((x) => x.is_lead && x.state === "qualified").length,
        not_qualified:safeNum(dashboardData?.not_qualified)|| merged.filter((x) => x.is_lead && x.state === "not_qualified").length,
        sent_to_bank: safeNum(dashboardData?.sent_to_bank) || merged.filter((x) => x.is_lead && x.state === "sent_to_bank").length,
      });

      const backendFunnel = dashboardData?.funnel || {};
      setFunnel(
        Array.isArray(backendFunnel)
          ? backendFunnel
          : Object.entries(backendFunnel).map(([state, count]) => ({ state, count }))
      );
    } catch (err) {
      console.error("Pre-sales page load error:", err);
      showToast?.(getErrorMessage(err, "Failed to load Pre-Sales data"), "#dc2626");
    } finally {
      setLoading(false);
    }
  };

  // ─── actions ───────────────────────────────────────────────────────────────

  const replaceRecord = (updatedRecord) => {
    setLeads((prev) =>
      prev.map((l) => l.loan_id === updatedRecord.loan_id ? { ...l, ...updatedRecord } : l)
    );
    setDrawer((prev) =>
      prev?.loan_id === updatedRecord.loan_id ? { ...prev, ...updatedRecord } : prev
    );
  };

  /**
   * Central stage/state updater.
   * newState is always snake_case from the frontend.
   * For leads  → mapped to Title Case via API_STAGE_MAP before sending.
   * For contacts → sent as-is (snake_case, backend accepts it).
   */
  const applyStateChange = async (record, newState) => {
    if (record.is_lead) {
      const backendStage = API_STAGE_MAP[newState];
      if (!backendStage) {
        showToast?.(`Unknown stage: ${newState}`, "#dc2626");
        return;
      }
      await updateLeadStage(record.id, { stage: backendStage });
    } else {
      await updateContactState(record.id, { state: newState });
    }
  };

  const quickAction = async (loanId, newState) => {
    const record = leads.find((l) => l.loan_id === loanId);
    if (!record) return;

    if (newState === "sent_to_bank") {
  setLogBankLead(record);
  return;
}

    try {
      await applyStateChange(record, newState);

      replaceRecord({ ...record, state: newState, state_updated_at: new Date().toISOString() });

      const labels = {
        qualified:         "Qualified",
        not_qualified:     "Not Qualified",
        documents_pending: "Docs Pending",
        sent_to_bank:      "Sent to Bank",
        converted:         "Converted to Lead",
        not_interested:    "Not Interested",
        under_review:      "Under Review",
      };
      showToast?.(`${record.contact_name} — ${labels[newState] || newState}`, "#16a34a");
      setDrawer(null);
      await loadPageData();
    } catch (err) {
      console.error("Quick action error:", err);
      showToast?.(getErrorMessage(err, "Failed to update state"), "#dc2626");
    }
  };

  const handleDrawerStateChange = async (record, newState) => {
    // "sent_to_bank" requires modal
    if (record.is_lead && newState === "sent_to_bank") {
  setLogBankLead(record);
  return;
}
    try {
      await applyStateChange(record, newState);
      const updated = { ...record, state: newState, state_updated_at: new Date().toISOString() };
      replaceRecord(updated);
      await loadPageData();
    } catch (err) {
      console.error("Drawer state change error:", err);
      showToast?.(getErrorMessage(err, "Failed to update state"), "#dc2626");
    }
  };

  const handleSendLoanForm = async (contact) => {
    try {
      await sendLoanForm(contact.id);
      setLoanFormCooldown((prev) => ({ ...prev, [contact.id]: Date.now() + 20 * 60 * 1000 }));
      showToast?.(`Loan form sent to ${contact.contact_name}`, "#16a34a");
    } catch (err) {
      console.error("Send loan form error:", err);
      showToast?.(getErrorMessage(err, "Failed to send loan form"), "#dc2626");
      throw err;
    }
  };

  const handleCheckLoanFormStatus = async () => {
    if (!convertModal) return;
    try {
      setCheckingStatus(true);
      const res = await getLoanFormStatus(convertModal.id);
      const submitted = res?.data?.submitted ?? res?.data?.is_submitted ?? res?.data?.status === "submitted";
      showToast?.(submitted ? "Loan form submitted by customer" : "Loan form not submitted yet", submitted ? "#16a34a" : "#d97706");
    } catch (err) {
      showToast?.(getErrorMessage(err, "Failed to check loan form status"), "#dc2626");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleConversionConfirm = async () => {
    if (!convertModal) return;
    try {
      setConverting(true);
      await checkContactEligibility(convertModal.id);
      await convertContactToLead(convertModal.id);
      const now = new Date().toISOString();
      replaceRecord({ ...convertModal, is_lead: true, state: "new_lead", converted_at: now, state_updated_at: now });
      showToast?.(`${convertModal.contact_name} converted to Lead`, "#16a34a");
      setConverting(false);
      setConvertModal(null);
      setDrawer(null);
      await loadPageData();
    } catch (err) {
      console.error("Conversion error:", err);
      setConverting(false);
      showToast?.(getErrorMessage(err, "Conversion failed"), "#dc2626");
    }
  };

  // ─── derived ───────────────────────────────────────────────────────────────

  const total        = kpis.total    || 0;
  const qualified    = kpis.qualified || 0;
  const convRate     = total ? Math.round((qualified / total) * 100) : 0;
  const dropOff      = total ? Math.round(((total - qualified) / total) * 100) : 0;
  const docsPending  = kpis.docs_pending || 0;
  const leadsCount   = leads.filter((l) => l.is_lead).length;
  const contactsCount= leads.filter((l) => !l.is_lead).length;

  const filtered = useMemo(() =>
    leads.filter(
      (l) =>
        (!filter || l.state === filter) &&
        (!search  || l.contact_name.toLowerCase().includes(search.toLowerCase()) ||
                     (l.pan_number || "").toLowerCase().includes(search.toLowerCase()))
    ),
    [leads, search, filter]
  );

  const FUNNEL_ORDER = [
  "new_lead",
  "opportunity_in_progress",
  "under_review",
  "documents_pending",
  "qualified",
  "sent_to_bank"
];

const orderedFunnel = FUNNEL_ORDER
  .map(stage => {
    const item = funnel.find(f => f.state === stage);
    return {
      state: stage,
      count: item ? item.count : 0
    };
  })
  .filter(stage => stage.count > 0);

  // ─── chart datasets ────────────────────────────────────────────────────────

  const funnelDatasets = [{
    data: orderedFunnel.map((r) => Number(r.count || 0)),
    backgroundColor: ["#6366f133","#8b5cf633","#0891b233","#0284c733","#d9770633","#16a34a33","#dc262633","#0f766e33"],
    borderColor:     ["#6366f1","#8b5cf6","#0891b2","#0284c7","#d97706","#16a34a","#dc2626","#0f766e"],
    borderWidth: 2, borderRadius: 6,
  }];

  const trendDatasets = [{
    label: "New Leads",
    data: trends.map((r) => Number(r.new_leads || 0)),
    borderColor: "#0891b2", backgroundColor: "#0891b211",
    tension: 0.4, fill: true, pointRadius: 0, borderWidth: 2,
  }];

  // ─── render ────────────────────────────────────────────────────────────────

  if (loading) return <div style={{ padding: 24, color: "#94a3b8" }}>Loading Pre-Sales Dashboard...</div>;

  return (
    <div>
      {/* ── role notices ── */}
      {isPreUser && (
        <Notice text="Pre-Sales User — Read-only access. You can view leads but cannot change states." />
      )}
      {isAdmin && !ROLE.isAdmin(role) && (
        <Notice text="Pre-Sales Admin — Full pre-sales access. Only Admin+ can send leads to bank." border="#0891b244" bg="#001824" />
      )}

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard icon="total"        label="Total"        val={total}                  color="#0891b2" />
        <KpiCard icon="new"          label="New Leads"    val={kpis.new_leads || 0}    color="#6366f1" />
        <KpiCard icon="progress"     label="In Progress"  val={kpis.in_progress || 0}  color="#0891b2" />
        <KpiCard icon="review"       label="Under Review" val={kpis.under_review || 0} color="#d97706" />
        <KpiCard icon="docs"         label="Docs Pending" val={docsPending}            color="#ea580c" />
        <KpiCard icon="qualified"    label="Qualified"    val={qualified}              color="#16a34a" />
        <KpiCard icon="notqualified" label="Not Qualified"val={kpis.not_qualified || 0}color="#dc2626" />
        <KpiCard icon="leads"        label="Leads"        val={leadsCount}             color="#0891b2" />
        <KpiCard icon="contacts"     label="Contacts"     val={contactsCount}          color="#8b5cf6" />
      </div>

      {/* ── metric cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Conversion Rate",     val: `${convRate}%`,  color: "#16a34a", sub: "New Lead to Qualified",          pct: convRate },
        
          { label: "Drop-off Rate",       val: `${dropOff}%`,   color: "#dc2626", sub: "Leads lost before qualification", pct: dropOff },
        ].map((m) => (
          <div key={m.label} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1, lineHeight: 1, color: m.color }}>{m.val}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{m.sub}</div>
            <div style={{ height: 4, borderRadius: 4, background: "#1a2235", marginTop: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, width: `${m.pct}%`, background: m.color, transition: "width 0.8s ease" }} />
            </div>
          </div>
        ))}
      </div>
     

      {/* ── charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <ChartCard title="Conversion Funnel" sub="Drop-off per stage · pre-sales pipeline">
          <ChartCanvas id="preFunnel" type="bar"
            labels={orderedFunnel.map((r) => r.state.replace(/_/g, " "))}
            datasets={funnelDatasets} />
        </ChartCard>
        <ChartCard title="New Leads — 30 Day Trend" sub="Daily incoming leads">
          <ChartCanvas id="preTrend" type="line"
            labels={trends.map((r) => r.date?.slice(5))}
            datasets={trendDatasets} />
        </ChartCard>
      </div>

      {/* ── table ── */}
      <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Pre-Sales Leads & Contacts</div>
          <div style={{ display: "flex", gap: 8 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, PAN..." />
            <FilterSelect value={filter} onChange={setFilter} options={ALL_STATES} placeholder="All States" />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <TableHead cols={["Name","Type","Contact","PAN","State","Loan Amt","CIBIL","Updated","Actions"]} />
            <tbody>
              {filtered.map((l) => (
                <tr key={`${l.is_lead ? "lead" : "contact"}-${l.loan_id}`} style={{ borderBottom: "1px solid #ffffff04" }}>
                  <td style={td}>
                    <strong style={{ cursor: "pointer", color: "#0891b2" }} onClick={() => setDrawer(l)}>{l.contact_name}</strong>
                    <br /><span style={mono9}>{l.loan_id}</span>
                  </td>
                  <td style={td}><TypeBadge isLead={l.is_lead} /></td>
                  <td style={{ ...td, color: "#64748b", fontSize: 11 }}>{l.contact_email}<br />{l.phone}</td>
                  <td style={{ ...td, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{l.pan_number || "—"}</td>
                  <td style={td}><StateBadge state={l.state} /></td>
                  <td style={{ ...td, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{fmtAmount(l.loan_amount_requested)}</td>
                  <td style={{ ...td, fontFamily: "'DM Mono',monospace", fontSize: 11, color: (l.credit_score || 0) >= 700 ? "#16a34a" : "#d97706" }}>{l.credit_score || "—"}</td>
                  <td style={{ ...td, color: "#64748b", fontSize: 11 }}>{fmtDate(l.state_updated_at)}</td>
                  <td style={td}><ActionBtn onClick={() => setDrawer(l)} color="#0891b2">View</ActionBtn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #1e293b", fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#64748b", textAlign: "right" }}>
          Showing {filtered.length} of {total} · {leadsCount} leads · {contactsCount} contacts
        </div>
      </div>

      {/* ── Convert to Lead modal ── */}
      {convertModal && (
        <>
          <div onClick={() => !converting && setConvertModal(null)}
            style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 200 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 28,
            zIndex: 201, width: 420, boxShadow: "0 24px 64px #000000aa",
            fontFamily: "'Cabinet Grotesk',sans-serif", color: "#f1f5f9",
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Convert to Lead</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
              This record will be promoted from Contact to Lead and its state will be reset to New Lead.
            </div>
            <div style={{ background: "#1a2235", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
              {[
                ["Name",         convertModal.contact_name],
                ["Email",        convertModal.contact_email],
                ["Phone",        convertModal.phone || "—"],
                ["Current Type", "Contact"],
                ["Current State",convertModal.state.replace(/_/g, " ")],
                ["Convert To",   "Lead"],
                ["New State",    "new lead"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1e293b", fontSize: 12 }}>
                  <span style={{ color: "#64748b" }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConvertModal(null)} disabled={converting}
                style={{ flex: 1, padding: 11, borderRadius: 10, border: "1px solid #1e293b", background: "#1a2235", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleCheckLoanFormStatus} disabled={checkingStatus}
                style={{ flex: 1, padding: 11, borderRadius: 10, border: "1px solid #0891b2", background: "#0891b222", color: "#0891b2", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: checkingStatus ? 0.6 : 1 }}>
                {checkingStatus ? "Checking..." : "Status"}
              </button>
              <button onClick={handleConversionConfirm} disabled={converting}
                style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: converting ? 0.6 : 1 }}>
                {converting ? "Converting..." : "Confirm Convert to Lead"}
              </button>
            </div>
          </div>
        </>
      )}


      {/* ── Drawer ── */}
      {drawer && (
        <>
          <div onClick={() => setDrawer(null)}
            style={{ position: "fixed", inset: 0, background: "#00000066", zIndex: 149 }} />
          <div style={{
            position: "fixed", top: 0, right: 0, width: 400, height: "100vh",
            background: "#111827", borderLeft: "1px solid #1e293b", zIndex: 150,
            padding: 24, overflowY: "auto", boxShadow: "-8px 0 32px #00000044",
            fontFamily: "'Cabinet Grotesk',sans-serif", color: "#f1f5f9",
          }}>
            <button onClick={() => setDrawer(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "#1a2235", border: "1px solid #1e293b", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ×
            </button>

            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{drawer.contact_name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>{drawer.loan_id} · {drawer.contact_email}</span>
              <TypeBadge isLead={drawer.is_lead} />
            </div>

            <DrawerSection label="Current State">
              <StateBadge state={drawer.state} />
            </DrawerSection>

            <DrawerSection label="Details">
              {[
                ["Phone",       drawer.phone || "—"],
                ["PAN Number",  drawer.pan_number || "—"],
                ["Loan Amount", fmtAmount(drawer.loan_amount_requested)],
                ["CIBIL Score", drawer.credit_score || "—"],
                ["Assigned To", drawer.assigned_to_name || "—"],
                ["Last Updated",fmtDate(drawer.state_updated_at)],
                ...(drawer.converted_at ? [["Converted At", fmtDate(drawer.converted_at)]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #1e293b" }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </DrawerSection>

            {showActions ? (
              <>
                <DrawerSection label="Change State">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {(drawer.is_lead ? LEAD_STATES : CONTACT_STATES).map((s) => {
                      const st = stateStyle[s] || { bg: "#1e293b", border: "#334155", text: "#94a3b8" };
                      const isCurrent = s === drawer.state;
                      return (
                        <div key={s}
                          onClick={() => handleDrawerStateChange(drawer, s)}
                          style={{
                            fontSize: 10, padding: "5px 11px", borderRadius: 8,
                            border: `1px solid ${st.border}`, background: st.bg, color: st.text,
                            cursor: "pointer",
                            outline: isCurrent ? "2px solid #0891b2" : "none", outlineOffset: 2,
                          }}>
                          {s.replace(/_/g, " ")}
                        </div>
                      );
                    })}
                  </div>
                </DrawerSection>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
                  {/* Lead quick actions */}
                  {drawer.is_lead && ["under_review","opportunity_submitted"].includes(drawer.state) && (
                    <>
                      <DrawerBtn onClick={() => quickAction(drawer.loan_id, "qualified")}   bg="#16a34a">Mark as Qualified</DrawerBtn>
                      <DrawerBtn onClick={() => quickAction(drawer.loan_id, "not_qualified")} bg="#dc2626">Mark as Not Qualified</DrawerBtn>
                      <DrawerBtn onClick={() => quickAction(drawer.loan_id, "documents_pending")} bg="#ea580c22" color="#ea580c" border="#ea580c44">Request Documents</DrawerBtn>
                    </>
                  )}

                  {drawer.is_lead && drawer.state === "qualified" && canSendBank && (
  <DrawerBtn onClick={() => { setDrawer(null); setLogBankLead(drawer); }} bg="#0369a1">
    Log to Bank
  </DrawerBtn>
)}
{drawer.is_lead && drawer.state === "logged_to_bank" && canSendBank && (
                    <DrawerBtn
                      onClick={() => { setDrawer(null); setAssignBankerLead(drawer); }}
                      bg="#1a1200" color="#f59e0b" border="#f59e0b44">
                      Assign Banker
                    </DrawerBtn>
                  )}

                  {/* Contact quick actions */}
                  {!drawer.is_lead && drawer.state === "contacted" && (
                    <DrawerBtn onClick={() => quickAction(drawer.loan_id, "documents_pending")} bg="#ea580c22" color="#ea580c" border="#ea580c44">Request Documents</DrawerBtn>
                  )}
                  {!drawer.is_lead && !["not_interested","converted"].includes(drawer.state) && (
                    <DrawerBtn onClick={() => quickAction(drawer.loan_id, "not_interested")} bg="#dc262622" color="#dc2626" border="#dc262644">Mark as Not Interested</DrawerBtn>
                  )}
                  {!drawer.is_lead && (
                    <DrawerBtn
                      onClick={async () => {
                        try {
                          await handleSendLoanForm(drawer);
                          setDrawer(null);
                          setConvertModal(drawer);
                        } catch (_) { /* handled inside */ }
                      }}
                      bg="#16a34a22" color="#16a34a" border="#16a34a44">
                      Convert to Lead
                    </DrawerBtn>
                  )}
                </div>
              </>
            ) : (
              <Notice text="View only — your role cannot modify lead states." />
            )}
          </div>
        </>
      )}

     {logBankLead && (
  <LogToBankModal
    lead={logBankLead}
    onClose={() => setLogBankLead(null)}
    onSuccess={(msg) => {
      showToast?.(msg, "#16a34a");
      setLogBankLead(null);
      setDrawer(null);
      loadPageData();
    }}
  />
)}
{assignBankerLead && (
  <AssignBankerModal
    lead={assignBankerLead}
    onClose={() => setAssignBankerLead(null)}
    onSuccess={(msg) => {
      showToast?.(msg, "#16a34a");
      setAssignBankerLead(null);
      setDrawer(null);
      loadPageData();
    }}
  />
)}


    </div>
  );
}

// ─── small presentational components ─────────────────────────────────────────

function TypeBadge({ isLead }) {
  return (
    <span style={{
      fontSize: 10, padding: "3px 9px", borderRadius: 20, fontWeight: 700,
      fontFamily: "'DM Mono',monospace", letterSpacing: 0.5,
      background: isLead ? "#0891b222" : "#8b5cf622",
      border:     isLead ? "1px solid #0891b244" : "1px solid #8b5cf644",
      color:      isLead ? "#0891b2" : "#8b5cf6",
    }}>
      {isLead ? "Lead" : "Contact"}
    </span>
  );
}

function Notice({ text, border = "#1e293b", bg = "#0f172a" }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 16px", fontSize: 11, color: "#64748b", marginBottom: 16 }}>
      {text}
    </div>
  );
}

function ChartCard({ title, sub, children }) {
  return (
    <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#64748b", marginBottom: 16 }}>{sub}</div>
      {children}
    </div>
  );
}

function TableHead({ cols }) {
  return (
    <thead>
      <tr>
        {cols.map((h) => (
          <th key={h} style={{ padding: "10px 16px", fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#64748b", textAlign: "left", background: "#1a2235", borderBottom: "1px solid #1e293b" }}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ background: "#1a2235", border: "1px solid #1e293b", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "#f1f5f9", outline: "none", width: 180, fontFamily: "'Cabinet Grotesk',sans-serif" }} />
  );
}

function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ background: "#1a2235", border: "1px solid #1e293b", borderRadius: 8, padding: "7px 10px", fontSize: 11, color: "#64748b", fontFamily: "'DM Mono',monospace", outline: "none", cursor: "pointer" }}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function ActionBtn({ onClick, color, children }) {
  return (
    <button onClick={onClick}
      style={{ fontSize: 10, padding: "4px 9px", borderRadius: 6, border: `1px solid ${color}44`, background: `${color}11`, color, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", fontFamily: "'Cabinet Grotesk',sans-serif" }}>
      {children}
    </button>
  );
}

function DrawerSection({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function DrawerBtn({ onClick, bg, color = "#fff", border = "none", children }) {
  return (
    <button onClick={onClick}
      style={{ width: "100%", padding: 11, borderRadius: 10, border, fontSize: 13, fontWeight: 700, cursor: "pointer", background: bg, color, fontFamily: "'Cabinet Grotesk',sans-serif", transition: "opacity 0.15s" }}>
      {children}
    </button>
  );
}

const td    = { padding: "11px 16px" };
const mono9 = { fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#64748b" };