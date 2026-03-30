// src/components/ui/Modal.jsx

/**
 * Modal — centered overlay modal wrapper.
 *
 * Props:
 *   onClose  {function}   — called when clicking the backdrop
 *   children {ReactNode}  — modal content
 *   maxWidth {number}     — max width in px (default 460)
 */
export default function Modal({ onClose, children, maxWidth = 460 }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:       "fixed",
        inset:          0,
        background:     "#000000aa",
        zIndex:         200,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        20,
        animation:      "fadeIn 0.15s ease",
      }}
    >
      <div
        style={{
          background:   "#111827",
          border:       "1px solid #1e293b",
          borderRadius: 16,
          padding:      28,
          width:        "100%",
          maxWidth,
          animation:    "slideIn 0.18s ease",
          fontFamily:   "'Cabinet Grotesk', sans-serif",
          color:        "#f1f5f9",
        }}
      >
        {children}
      </div>
    </div>
  );
}
