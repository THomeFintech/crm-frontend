// src/components/ui/Toast.jsx
import { useEffect } from "react";

/**
 * Toast — bottom-right slide-in notification. Auto-dismisses after 3s.
 *
 * Props:
 *   msg    {string}   — message text
 *   color  {string}   — accent hex color for the dot and border
 *   onDone {function} — called when the timer expires (use to clear state)
 */
export default function Toast({ msg, color = "#16a34a", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position:    "fixed",
        bottom:      24,
        right:       24,
        zIndex:      300,
        background:  "#111827",
        border:      `1px solid ${color}55`,
        borderRadius: 10,
        padding:     "12px 18px",
        fontSize:    13,
        display:     "flex",
        alignItems:  "center",
        gap:         8,
        boxShadow:   "0 8px 24px #00000055",
        animation:   "slideIn 0.2s ease",
        fontFamily:  "'Cabinet Grotesk', sans-serif",
        color:       "#f1f5f9",
      }}
    >
      <span style={{ color, fontSize: 15 }}>●</span>
      {msg}
    </div>
  );
}
