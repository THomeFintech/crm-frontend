// src/pages/LoginPage.jsx

import { useState } from "react";
import { loginUser } from "../api/authApi";

// ── EDIT THESE 4 LINES ──
const LOGO_TYPE = "image";
const LOGO_SRC = "/src/assets/logo.png";
const COMPANY_NAME = "T-Home Fintech";
const COMPANY_TAGLINE = "Your Trusted Partner";

export default function LoginPage({ onLogin }) {

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── LOGIN FUNCTION ─────────────────────────────
  const handleLogin = async () => {

    if (!email || !pass) {
      setError("Please enter email and password");
      return;
    }

    try {

      setLoading(true);
      setError("");

      const res = await loginUser({
        email: email,
        password: pass
      });

      const data = res.data;

      // ── STORE AUTH DATA ───────────────────────
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user_role", data.user.role);
      localStorage.setItem("user_name", data.user.name);
      localStorage.setItem("user_email", data.user.email);
      localStorage.setItem("user_id", data.user.id);

      // ── PASS LOGIN DATA TO APP ─────────────────
      onLogin(data);

    } catch (err) {

      setError(
        err?.response?.data?.detail ||
        "Invalid email or password"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 20,
        background:
          "radial-gradient(ellipse at 30% 20%, #0f2d4422 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, #16a34a11 0%, transparent 60%), #0b0f19",
        fontFamily: "'Cabinet Grotesk', sans-serif",
        color: "#f1f5f9",
      }}
    >

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#111827",
          border: "1px solid #1e293b",
          borderRadius: 20,
          padding: 40,
        }}
      >

        {/* ── LOGO SECTION ───────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginBottom: 32
          }}
        >

          {LOGO_TYPE === "image" ? (
            <img
              src={LOGO_SRC}
              alt={COMPANY_NAME}
              style={{
                width: 44,
                height: 44,
                objectFit: "contain",
                borderRadius: "50%",
                boxShadow: "0 0 12px #0891b244, 0 0 24px #0891b222",
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "linear-gradient(135deg, #0891b2, #0369a1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 900,
                color: "#fff",
              }}
            >
              {COMPANY_NAME[0]}
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>
              {COMPANY_NAME}
            </div>

            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                color: "#64748b",
                letterSpacing: 1,
                marginTop: 3,
              }}
            >
              {COMPANY_TAGLINE}
            </div>
          </div>

        </div>

        {/* ── HEADER ───────────────────────────── */}
        <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
          Welcome back
        </h2>

        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>
          Sign in to access your dashboard
        </p>

        {/* ── EMAIL FIELD ─────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@crm.com"
            style={inputStyle}
          />
        </div>

        {/* ── PASSWORD FIELD ──────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Password</label>

          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        {/* ── LOGIN BUTTON ────────────────────── */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            background: "#0891b2",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: 13,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          {loading ? "Signing in..." : "Sign In →"}
        </button>

        {/* ── ERROR MESSAGE ───────────────────── */}
        {error && (
          <div
            style={{
              background: "#1f0a0a",
              border: "1px solid #ef444433",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12,
              color: "#f87171",
              marginTop: 12,
            }}
          >
            {error}
          </div>
        )}

      </div>

    </div>
  );
}

const labelStyle = {
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  letterSpacing: 1.5,
  color: "#64748b",
  textTransform: "uppercase",
  marginBottom: 6,
  display: "block",
};

const inputStyle = {
  width: "100%",
  background: "#1a2235",
  border: "1px solid #1e293b",
  borderRadius: 8,
  padding: "11px 14px",
  fontSize: 14,
  color: "#f1f5f9",
  outline: "none",
};
