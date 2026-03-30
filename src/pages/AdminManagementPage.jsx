// src/pages/AdminManagementPage.jsx

import { useState, useEffect } from "react";
import KpiCard from "../components/ui/KpiCard";
import Modal from "../components/ui/Modal";

import {
  getUsers,
  createUser,
  createBankAdmin,
  updateUser,
  deleteUser,
  updateUserStatus,
} from "../api/userApi";

import { roleConfig } from "../data/constants";

// Valid banks matching backend VALID_BANKS
const BANK_OPTIONS = [
  "HDFC Bank",
  "SBI",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Bank",
  "Bank of Baroda",
  "PNB",
  "Canara Bank",
];

// Role options for regular users — bank_admin excluded (separate endpoint)
const ROLE_OPTIONS = [
  { role: "admin",            name: "Admin",            desc: "Full dashboard access" },
  { role: "pre_sales_admin",  name: "Pre-Sales Admin",  desc: "Manage pre-sales" },
  { role: "pre_sales_user",   name: "Pre-Sales User",   desc: "View pre-sales" },
  { role: "post_sales_admin", name: "Post-Sales Admin", desc: "Manage post-sales" },
];

const emptyUserForm = {
  name:  "",
  email: "",
  pass:  "",
  role:  "pre_sales_admin",
};

const emptyBankForm = {
  name:          "",
  email:         "",
  pass:          "",
  bank_name:     "HDFC Bank",
  employee_id:   "",
  branch:        "",
  manager_email: "",
  manager_phone: "",
};

export default function AdminManagementPage({ showToast }) {
  const [users,      setUsers]      = useState([]);
  const [modal,      setModal]      = useState(null);   // "add" | "add_bank" | "edit" | "delete"
  const [editId,     setEditId]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form,     setForm]     = useState(emptyUserForm);
  const [bankForm, setBankForm] = useState(emptyBankForm);

  useEffect(() => { loadUsers(); }, []);

  // ── Data ────────────────────────────────────────────
  const loadUsers = async () => {
    try {
      const res  = await getUsers();
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
        ? res.data.results
        : [];
      setUsers(data);
    } catch (err) {
      console.error("Load users error:", err);
      showToast("❌ Failed to load users", "#ef4444");
    }
  };

  // ── Helpers ─────────────────────────────────────────
  const getApiError = (err, fallback = "Something went wrong") => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0)
      return detail.map((d) => d?.msg || "Invalid input").join(", ");
    return fallback;
  };

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const formatDate = (value) => {
    if (!value) return "—";
    try { return new Date(value).toISOString().slice(0, 10); }
    catch { return "—"; }
  };

  // ── Stats ────────────────────────────────────────────
  const stats = {
    total:  users.length,
    active: users.filter((u) => String(u.status || "").toLowerCase() === "active").length,
    pre:    users.filter((u) => ["pre_sales_admin", "pre_sales_user"].includes(u.role)).length,
    post:   users.filter((u) => u.role === "post_sales_admin").length,
    bank:   users.filter((u) => u.role === "bank_admin").length,
  };

  // ── Actions ──────────────────────────────────────────
  const toggleStatus = async (id) => {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    try {
      await updateUserStatus(id, {
        status: String(u.status || "").toLowerCase() === "active" ? "inactive" : "active",
      });
      showToast("✅ Status updated", "#16a34a");
      loadUsers();
    } catch (err) {
      showToast(`❌ ${getApiError(err, "Status update failed")}`, "#ef4444");
    }
  };

  // Create regular user (no bank_admin)
  const submitAdd = async () => {
    const name     = form.name.trim();
    const email    = form.email.trim();
    const password = form.pass;

    if (!name || !email || !password) {
      showToast("⚠️ Please fill all fields", "#f59e0b"); return;
    }
    if (!validateEmail(email)) {
      showToast("⚠️ Please enter a valid email", "#f59e0b"); return;
    }
    if (password.length < 8) {
      showToast("⚠️ Password must be at least 8 characters", "#f59e0b"); return;
    }

    try {
      setSubmitting(true);
      await createUser({ name, email, password, role: form.role });
      showToast("✅ User created successfully", "#16a34a");
      await loadUsers();
      setModal(null);
      setForm(emptyUserForm);
    } catch (err) {
      showToast(`❌ ${getApiError(err, "Failed to create user")}`, "#ef4444");
    } finally {
      setSubmitting(false);
    }
  };

  // Create bank admin — POST /api/users/bank-admin
  const submitAddBank = async () => {
    const name        = bankForm.name.trim();
    const email       = bankForm.email.trim();
    const password    = bankForm.pass;
    const employee_id = bankForm.employee_id.trim();
    const branch      = bankForm.branch.trim();

    if (!name || !email || !password || !employee_id || !branch) {
      showToast("⚠️ Please fill all required fields", "#f59e0b"); return;
    }
    if (!validateEmail(email)) {
      showToast("⚠️ Please enter a valid email", "#f59e0b"); return;
    }
    if (password.length < 8) {
      showToast("⚠️ Password must be at least 8 characters", "#f59e0b"); return;
    }
    if (bankForm.manager_email && !validateEmail(bankForm.manager_email)) {
      showToast("⚠️ Manager email is invalid", "#f59e0b"); return;
    }

    try {
      setSubmitting(true);
      await createBankAdmin({
        name,
        email,
        password,
        bank_name:     bankForm.bank_name,
        employee_id,
        branch,
        manager_email: bankForm.manager_email.trim() || undefined,
        manager_phone: bankForm.manager_phone.trim() || undefined,
      });
      showToast("✅ Bank admin created successfully", "#16a34a");
      await loadUsers();
      setModal(null);
      setBankForm(emptyBankForm);
    } catch (err) {
      showToast(`❌ ${getApiError(err, "Failed to create bank admin")}`, "#ef4444");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit — works for both regular users and bank admins
  const submitEdit = async () => {
    const name  = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      showToast("⚠️ Name and email are required", "#f59e0b"); return;
    }
    if (!validateEmail(email)) {
      showToast("⚠️ Please enter a valid email", "#f59e0b"); return;
    }

    const editingUser = users.find((u) => u.id === editId);

    // For bank admins only send name/email — role stays bank_admin and
    // bank fields are managed via the bank admin form.
    // For regular users send role too (but never bank_admin).
    const payload =
      editingUser?.role === "bank_admin"
        ? { name, email }
        : { name, email, role: form.role };

    try {
      setSubmitting(true);
      await updateUser(editId, payload);
      showToast("✅ User updated successfully", "#16a34a");
      await loadUsers();
      setModal(null);
    } catch (err) {
      showToast(`❌ ${getApiError(err, "Update failed")}`, "#ef4444");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUserHandler = async () => {
    try {
      setSubmitting(true);
      await deleteUser(editId);
      showToast("🗑 User removed", "#ef4444");
      await loadUsers();
      setModal(null);
    } catch (err) {
      showToast(`❌ ${getApiError(err, "Delete failed")}`, "#ef4444");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Modal openers ────────────────────────────────────
  const openAdd     = () => { setEditId(null); setForm(emptyUserForm);  setModal("add"); };
  const openAddBank = () => { setEditId(null); setBankForm(emptyBankForm); setModal("add_bank"); };

  const openEdit = (id) => {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setEditId(id);
    setForm({ name: u.name || "", email: u.email || "", pass: "", role: u.role || "pre_sales_admin" });
    setModal("edit");
  };

  const openDelete = (id) => { setEditId(id); setModal("delete"); };

  const editingUser = users.find((u) => u.id === editId);

  // ── Render ───────────────────────────────────────────
  return (
    <div>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Total Admins" val={stats.total}  color="#f59e0b" />
        <KpiCard label="Active"       val={stats.active} color="#22c55e" />
        <KpiCard label="Pre-Sales"    val={stats.pre}    color="#38bdf8" />
        <KpiCard label="Post-Sales"   val={stats.post}   color="#84cc16" />
        <KpiCard label="Bank Admins"  val={stats.bank}   color="#60a5fa" />
      </div>

      {/* Header + action buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc" }}>Admin Members</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {users.length} total · {stats.active} active
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {/* Add regular user */}
          <button onClick={openAdd} style={addUserBtn}>
            + Add User
          </button>
          {/* Add bank admin — separate endpoint */}
          <button onClick={openAddBank} style={addBankBtn}>
            + Add Bank Admin
          </button>
        </div>
      </div>

      {/* User cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {users.map((u) => {
          const rc       = roleConfig?.[u.role] || {};
          const isActive = String(u.status || "").toLowerCase() === "active";
          const isBank   = u.role === "bank_admin";

          return (
            <div key={u.id} style={cardStyle}>
              {/* Status dot */}
              <div style={{ position: "absolute", top: 16, right: 16, width: 8, height: 8, borderRadius: "50%",
                background: isActive ? "#84cc16" : "#64748b",
                boxShadow: isActive ? "0 0 10px rgba(132,204,22,0.5)" : "none" }} />

              <div style={{ paddingRight: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#f8fafc", marginBottom: 2 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>{u.email}</div>
              </div>

              <div style={roleBadge}>{rc.label || u.role}</div>

              {/* Bank admin extra info */}
              {isBank && (u.bank_name || u.employee_id || u.branch) && (
                <div style={{ fontSize: 11, color: "#60a5fa", lineHeight: 1.8, marginBottom: 10,
                  background: "#0c1e35", border: "1px solid #1e3a5f", borderRadius: 8, padding: "8px 10px" }}>
                  {u.bank_name   && <div>🏦 {u.bank_name}</div>}
                  {u.employee_id && <div>ID: {u.employee_id}</div>}
                  {u.branch      && <div>Branch: {u.branch}</div>}
                </div>
              )}

              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.7,
                borderBottom: "1px solid #1e293b", paddingBottom: 12, marginBottom: 14 }}>
                Created: {formatDate(u.created_at)}<br />
                Last login: {formatDate(u.last_login)}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => openEdit(u.id)} style={secondaryBtn}>Edit</button>
                <button onClick={() => toggleStatus(u.id)} style={{
                  ...actionBtn,
                  background: isActive ? "#3b2a0f" : "#132c1c",
                  color:      isActive ? "#f59e0b" : "#84cc16",
                  border:     isActive ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(132,204,22,0.25)",
                }}>
                  {isActive ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => openDelete(u.id)} style={deleteBtn}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Delete modal ── */}
      {modal === "delete" && (
        <Modal onClose={() => setModal(null)}>
          <div style={modalWrap}>
            <h3 style={modalTitle}>Remove Admin</h3>
            <p style={modalText}>Are you sure you want to remove <b>{editingUser?.name}</b>?</p>
            <div style={modalActions}>
              <button onClick={() => setModal(null)} disabled={submitting} style={cancelBtn}>Cancel</button>
              <button onClick={deleteUserHandler} disabled={submitting} style={dangerBtn}>
                {submitting ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add regular user modal ── */}
      {modal === "add" && (
        <Modal onClose={() => setModal(null)}>
          <div style={modalWrap}>
            <h3 style={modalTitle}>Add User</h3>
            <p style={{ ...modalText, marginBottom: 4 }}>Creates admin, pre-sales, or post-sales users.</p>

            <input placeholder="Full name *" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
            <input placeholder="Email *" value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} style={inputStyle} />
            <input placeholder="Password (min 8 characters) *" type="password" value={form.pass}
              onChange={(e) => setForm((p) => ({ ...p, pass: e.target.value }))} style={inputStyle} />

            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} style={inputStyle}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.role} value={r.role}>{r.name}</option>
              ))}
            </select>

            <div style={modalActions}>
              <button onClick={() => setModal(null)} disabled={submitting} style={cancelBtn}>Cancel</button>
              <button onClick={submitAdd} disabled={submitting} style={primaryBtn}>
                {submitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add bank admin modal ── */}
      {modal === "add_bank" && (
        <Modal onClose={() => setModal(null)}>
          <div style={{ ...modalWrap, minWidth: 420 }}>
            <h3 style={modalTitle}>Add Bank Admin</h3>
            <p style={{ ...modalText, marginBottom: 4 }}>
              Creates a bank admin account. Role is fixed to <span style={{ color: "#60a5fa" }}>bank_admin</span>.
            </p>

            <div style={sectionLabel}>Account details</div>
            <input placeholder="Full name *" value={bankForm.name}
              onChange={(e) => setBankForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
            <input placeholder="Email *" value={bankForm.email}
              onChange={(e) => setBankForm((p) => ({ ...p, email: e.target.value }))} style={inputStyle} />
            <input placeholder="Password (min 8 characters) *" type="password" value={bankForm.pass}
              onChange={(e) => setBankForm((p) => ({ ...p, pass: e.target.value }))} style={inputStyle} />

            <div style={sectionLabel}>Bank details</div>
            <select value={bankForm.bank_name}
              onChange={(e) => setBankForm((p) => ({ ...p, bank_name: e.target.value }))} style={inputStyle}>
              {BANK_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <input placeholder="Employee ID * (e.g. HDFC-001)" value={bankForm.employee_id}
              onChange={(e) => setBankForm((p) => ({ ...p, employee_id: e.target.value }))} style={inputStyle} />
            <input placeholder="Branch *" value={bankForm.branch}
              onChange={(e) => setBankForm((p) => ({ ...p, branch: e.target.value }))} style={inputStyle} />

            <div style={sectionLabel}>Manager info <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span></div>
            <input placeholder="Manager email" value={bankForm.manager_email}
              onChange={(e) => setBankForm((p) => ({ ...p, manager_email: e.target.value }))} style={inputStyle} />
            <input placeholder="Manager phone" value={bankForm.manager_phone}
              onChange={(e) => setBankForm((p) => ({ ...p, manager_phone: e.target.value }))} style={inputStyle} />

            <div style={modalActions}>
              <button onClick={() => setModal(null)} disabled={submitting} style={cancelBtn}>Cancel</button>
              <button onClick={submitAddBank} disabled={submitting} style={bankPrimaryBtn}>
                {submitting ? "Creating..." : "Create Bank Admin"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit modal (shared for all roles) ── */}
      {modal === "edit" && (
        <Modal onClose={() => setModal(null)}>
          <div style={modalWrap}>
            <h3 style={modalTitle}>Edit User</h3>

            {editingUser?.role === "bank_admin" && (
              <div style={{ fontSize: 11, color: "#60a5fa", background: "#0c1e35",
                border: "1px solid #1e3a5f", borderRadius: 8, padding: "8px 10px", marginBottom: 4 }}>
                Bank admin — only name and email can be updated here.
              </div>
            )}

            <input placeholder="Full name *" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
            <input placeholder="Email *" value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} style={inputStyle} />

            {/* Only show role selector for non-bank-admin users */}
            {editingUser?.role !== "bank_admin" && (
              <select value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} style={inputStyle}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.role} value={r.role}>{r.name}</option>
                ))}
              </select>
            )}

            <div style={modalActions}>
              <button onClick={() => setModal(null)} disabled={submitting} style={cancelBtn}>Cancel</button>
              <button onClick={submitEdit} disabled={submitting} style={primaryBtn}>
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────
const cardStyle = {
  background: "linear-gradient(180deg, rgba(17,24,39,1) 0%, rgba(15,23,42,1) 100%)",
  border: "1px solid #1e293b",
  borderRadius: 14,
  padding: 18,
  position: "relative",
  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
};

const roleBadge = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  color: "#94a3b8",
  background: "#122033",
  border: "1px solid #23324a",
  marginBottom: 14,
};

const actionBtn = {
  padding: "8px 14px",
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn = {
  ...actionBtn,
  background: "#182234",
  color: "#cbd5e1",
  border: "1px solid #243247",
};

const deleteBtn = {
  ...actionBtn,
  background: "#31161b",
  color: "#f87171",
  border: "1px solid rgba(248,113,113,0.2)",
  minWidth: 84,
};

const addUserBtn = {
  background: "#f59e0b",
  border: "none",
  padding: "10px 18px",
  borderRadius: 12,
  fontWeight: 800,
  cursor: "pointer",
  color: "#111827",
  boxShadow: "0 8px 20px rgba(245,158,11,0.22)",
};

const addBankBtn = {
  background: "#1d4ed8",
  border: "none",
  padding: "10px 18px",
  borderRadius: 12,
  fontWeight: 800,
  cursor: "pointer",
  color: "#fff",
  boxShadow: "0 8px 20px rgba(29,78,216,0.25)",
};

const modalWrap = {
  minWidth: 360,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const modalTitle = {
  fontSize: 20,
  fontWeight: 800,
  color: "#f8fafc",
  margin: 0,
};

const modalText = {
  fontSize: 13,
  color: "#94a3b8",
  margin: 0,
};

const sectionLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginTop: 4,
};

const inputStyle = {
  width: "100%",
  background: "#111827",
  border: "1px solid #1e293b",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 14,
  color: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 8,
};

const cancelBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#111827",
  color: "#cbd5e1",
  fontWeight: 700,
  cursor: "pointer",
};

const primaryBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#f59e0b",
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
};

const bankPrimaryBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#1d4ed8",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const dangerBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#b91c1c",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};