// src/components/ui/KpiCard.jsx

/**
 * KpiCard — stat card with a colored top accent bar.
 *
 * Props:
 *   icon    {string}  — emoji icon
 *   label   {string}  — metric name (shown as small uppercase label)
 *   val     {string|number} — the main displayed value
 *   color   {string}  — hex accent color
 *   wide    {boolean} — if true, spans 2 grid columns
 */
export default function KpiCard({ icon, label, val, color, wide = false }) {
  return (
    <div
      style={{
        background:   "#111827",
        border:       "1px solid #1e293b",
        borderTop:    `2px solid ${color}`,
        borderRadius: 12,
        padding:      16,
        position:     "relative",
        overflow:     "hidden",
        transition:   "transform 0.15s",
        cursor:       "default",
        ...(wide ? { gridColumn: "span 2" } : {}),
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, lineHeight: 1, color }}>
        {val}
      </div>
      <div
        style={{
          fontFamily:    "'DM Mono', monospace",
          fontSize:      9,
          color:         "#64748b",
          letterSpacing: 1,
          textTransform: "uppercase",
          marginTop:     5,
        }}
      >
        {label}
      </div>
    </div>
  );
}
