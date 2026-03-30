// src/components/layout/Topbar.jsx
import { TAB_BUTTONS, TOPBAR_INFO } from "../../data/constants";

/**
 * Topbar — page title on the left, tab switcher buttons on the right.
 *
 * Props:
 *   user        {object}    — current user (used to conditionally show tabs)
 *   activeTab   {string}    — currently selected tab key
 *   onTabChange {function}  — called with new tab key
 */
export default function Topbar({ user, activeTab, onTabChange }) {
  const info = TOPBAR_INFO[activeTab] || { title: "Dashboard", sub: "" };
  const visibleTabs = TAB_BUTTONS.filter(t => t.show(user));

  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        marginBottom:   28,
        fontFamily:     "'Cabinet Grotesk', sans-serif",
      }}
    >
      {/* Title */}
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, color: "#f1f5f9" }}>
          {info.title}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          {info.sub}
        </div>
      </div>

      {/* Tab buttons — hidden on Admin Management page */}
      {activeTab !== "admins" && (
        <div
          style={{
            display:    "flex",
            background: "#111827",
            border:     "1px solid #1e293b",
            borderRadius: 10,
            padding:    4,
            gap:        4,
          }}
        >
          {visibleTabs.map(t => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                style={{
                  padding:     "7px 18px",
                  borderRadius: 7,
                  fontSize:    12,
                  fontWeight:  700,
                  border:      "none",
                  cursor:      "pointer",
                  fontFamily:  "'Cabinet Grotesk', sans-serif",
                  transition:  "all 0.15s",
                  background:  isActive ? t.active : "none",
                  color:       isActive ? (t.textColor || "#fff") : "#64748b",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
