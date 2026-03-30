// src/components/ui/AccessDenied.jsx

/**
 * AccessDenied — shown when a user navigates to a tab their role can't access.
 *
 * Props:
 *   role {string} — the current user's role (displayed in the message)
 *   tab  {string} — the tab key they tried to access
 */
export default function AccessDenied({ role, tab }) {
  const tabLabel = {
    pre:    "Pre-Sales",
    post:   "Post-Sales",
    sales:  "Sales Overview",
    admins: "Admin Management",
  }[tab] || tab;

  return (
    <div
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        minHeight:      300,
        gap:            12,
        fontFamily:     "'Cabinet Grotesk', sans-serif",
      }}
    >
      <div style={{ fontSize: 40 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>Access Denied</div>
      <div style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>
        Your role <strong style={{ color: "#f1f5f9" }}>{role}</strong> does not have
        access to the <strong style={{ color: "#f1f5f9" }}>{tabLabel}</strong> section.
      </div>
    </div>
  );
}
