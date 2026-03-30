// src/components/ui/StateBadge.jsx
import { stateStyle } from "../../data/constants";

/**
 * StateBadge — colored pill label for a lead's state.
 *
 * Props:
 *   state {string} — snake_case state key (e.g. "qualified", "bank_approved")
 */
export default function StateBadge({ state }) {
  const s = stateStyle[state] || { bg: "#1e293b", border: "#334155", text: "#94a3b8" };

  return (
    <span
      style={{
        fontFamily:  "'DM Mono', monospace",
        fontSize:    9,
        padding:     "3px 9px",
        borderRadius: 10,
        border:      `1px solid ${s.border}`,
        background:  s.bg,
        color:       s.text,
        fontWeight:  500,
        whiteSpace:  "nowrap",
        display:     "inline-block",
      }}
    >
      {state.replace(/_/g, " ")}
    </span>
  );
}
