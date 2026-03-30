// src/components/layout/Sidebar.jsx
import { NAV_TABS, roleConfig, ROLE_LABELS } from "../../data/constants";
import logo from "../../assets/logo.PNG";

/**
 * Sidebar — fixed left navigation panel.
 *
 * Props:
 *   user        {object}   — current authenticated user
 *   activeTab   {string}   — currently selected tab key
 *   onTabChange {function} — called with new tab key on nav-item click
 *   onLogout    {function} — called when "Sign out" is clicked
 */
export default function Sidebar({ user, activeTab, onTabChange, onLogout }) {
  const rc = user ? (roleConfig[user.role] || {}) : {};

  // Group nav tabs by section, filtered by user access
  const sections = NAV_TABS
    .filter(t => t.show(user))
    .reduce((acc, tab) => {
      if (!acc[tab.section]) acc[tab.section] = [];
      acc[tab.section].push(tab);
      return acc;
    }, {});

  return (
    <nav
      className="sidebar"
      style={{
        position:      "fixed",
        top:           0,
        left:          0,
        width:         220,
        height:        "100vh",
        background:    "#111827",
        borderRight:   "1px solid #1e293b",
        display:       "flex",
        flexDirection: "column",
        zIndex:        100,
        padding:       "24px 0",
        fontFamily:    "'Cabinet Grotesk', sans-serif",
      }}
    >

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 18px", borderBottom: "1px solid #1e293b", marginBottom: 16 }}>
        <img
          src={logo}
          alt="T-Home Fintech"
          style={{
            width:        32,
            height:       32,
            objectFit:    "cover",
            borderRadius: "50%",
            flexShrink:   0,
            boxShadow:    "0 0 8px #0891b244, 0 0 16px #0891b222",
          }}
        />
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.3 }}>
            T-Home Fintech
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#64748b", letterSpacing: 1, marginTop: 2 }}>
            Your Trusted Partner
          </div>
        </div>
      </div>

      {/* Nav sections */}
      {Object.entries(sections).map(([section, tabs]) => (
        <div key={section} style={{ padding: "0 12px", marginBottom: 8 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2, color: "#64748b", padding: "0 8px", marginBottom: 6, textTransform: "uppercase" }}>
            {section}
          </div>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <div
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          10,
                  padding:      "9px 10px",
                  borderRadius: 8,
                  fontSize:     13,
                  fontWeight:   500,
                  color:        isActive ? "#f1f5f9" : "#64748b",
                  background:   isActive ? "#1a2235" : "transparent",
                  cursor:       "pointer",
                  transition:   "all 0.12s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#1a223566"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: tab.dot, opacity: isActive ? 1 : 0.3, flexShrink: 0 }} />
                {tab.label}
              </div>
            );
          })}
        </div>
      ))}

      {/* User chip + logout */}
      <div style={{ marginTop: "auto", padding: "16px 12px 0", borderTop: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 8, background: "#1a2235" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, background: rc.bg || "#0891b211", color: rc.color || "#0891b2", flexShrink: 0 }}>
            {user?.name?.[0] || "?"}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{user?.name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#64748b" }}>
              {user?.role?.replace(/_/g, " ")}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{ width: "100%", background: "none", border: "1px solid #1e293b", borderRadius: 8, padding: 8, fontSize: 12, color: "#64748b", cursor: "pointer", marginTop: 8, fontFamily: "'Cabinet Grotesk', sans-serif", transition: "all 0.12s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.color = "#64748b"; }}
        >
          Sign out
        </button>
      </div>

    </nav>
  );
}
