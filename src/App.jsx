// src/App.jsx
import { useState, useEffect } from "react";
import "./styles/globals.css";

import LoginPage           from "./pages/LoginPage";
import SalesOverviewPage   from "./pages/SalesOverviewPage";
import PreSalesPage        from "./pages/PreSalesPage";
import PostSalesPage       from "./pages/PostSalesPage";
import ContactsPage        from "./pages/ContactsPage";
import LeadsPage           from "./pages/LeadsPage";
import AdminManagementPage from "./pages/AdminManagementPage";
import BankAdminPage       from "./pages/BankAdminPage";
import SuperAdminBankPage from "./pages/SuperAdminBankPage";
import Sidebar      from "./components/layout/Sidebar";
import Topbar       from "./components/layout/Topbar";
import Toast        from "./components/ui/Toast";
import AccessDenied from "./components/ui/AccessDenied";

import { useToast }  from "./hooks/useToast";
import { CAN_SEE_PRE, CAN_SEE_POST } from "./data/constants";
import { logoutUser } from "./api/authApi";

function getStartTab(role) {
  if (["super_admin", "admin"].includes(role)) return "sales";
  if (role === "bank_admin")                   return "bank";
  if (CAN_SEE_PRE.includes(role))              return "pre";
  return "post";
}

function canViewTab(user, tab) {
  if (!user) return false;
  const r = user.role;
  if (tab === "sales")    return ["super_admin", "admin"].includes(r);
  if (tab === "admins")   return r === "super_admin";
  if (tab === "pre")      return CAN_SEE_PRE.includes(r);
  if (tab === "post")     return CAN_SEE_POST.includes(r);
  if (tab === "bank") return ["bank_admin", "admin", "super_admin"].includes(r);
  if (tab === "contacts") return r !== "bank_admin";
  if (tab === "leads")    return r !== "bank_admin";
  return true;
}

export default function App() {
  const [user,        setUser]        = useState(null);
  const [tab,         setTab]         = useState("pre");
  const [authChecked, setAuthChecked] = useState(false);

  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const token    = localStorage.getItem("access_token");
    const role     = localStorage.getItem("user_role");
    const name     = localStorage.getItem("user_name");
    const email    = localStorage.getItem("user_email");
    const id       = localStorage.getItem("user_id");
    const savedTab = localStorage.getItem("active_tab");

    if (token && role) {
      const restoredUser = { id, name, email, role };
      setUser(restoredUser);

      if (savedTab && canViewTab(restoredUser, savedTab)) {
        setTab(savedTab);
      } else {
        setTab(getStartTab(role));
      }
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (user && tab) {
      localStorage.setItem("active_tab", tab);
    }
  }, [user, tab]);

  const handleLogin = (data) => {
    const loggedUser = data.user;
    setUser(loggedUser);
    const startTab = getStartTab(loggedUser.role);
    setTab(startTab);
    localStorage.setItem("active_tab", startTab);
  };

  const handleLogout = async () => {
    try { await logoutUser(); } catch (e) {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_id");
    localStorage.removeItem("active_tab");
    setUser(null);
    setTab("pre");
  };

  const handleTabChange = (newTab) => {
    if (canViewTab(user, newTab)) {
      setTab(newTab);
      localStorage.setItem("active_tab", newTab);
    }
  };

  if (!authChecked) return null;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  const renderPage = () => {
    if (!canViewTab(user, tab)) {
      return <AccessDenied role={user.role} tab={tab} />;
    }

    switch (tab) {
      case "sales":    return <SalesOverviewPage />;
      case "pre":      return <PreSalesPage user={user} showToast={showToast} />;
      case "post":     return <PostSalesPage user={user} />;
      case "contacts": return <ContactsPage />;
      case "leads":    return <LeadsPage />;
      case "admins":   return <AdminManagementPage showToast={showToast} />;
      case "bank":
  if (user.role === "super_admin" || user.role === "admin") {
    return <SuperAdminBankPage user={user} showToast={showToast} />;
  }
  return <BankAdminPage user={user} showToast={showToast} />;
      default:         return null;
    }
  };

  return (
    <div style={{ background: "#0b0f19", minHeight: "100vh", fontFamily: "'Cabinet Grotesk', sans-serif", color: "#f1f5f9" }}>
      <Sidebar user={user} activeTab={tab} onTabChange={handleTabChange} onLogout={handleLogout} />
      <main style={{ marginLeft: 220, minHeight: "100vh", padding: "28px 28px 60px" }}>
        <Topbar user={user} activeTab={tab} onTabChange={handleTabChange} />
        {renderPage()}
      </main>
      {toast && <Toast msg={toast.msg} color={toast.color} onDone={clearToast} />}
    </div>
  );
}