// src/data/constants.js



export const CAN_SEE_PRE  = ["super_admin", "admin", "pre_sales_admin", "pre_sales_user"];
export const CAN_SEE_POST = ["super_admin", "admin", "post_sales_admin"];

export const ROLE = {
  isSuperAdmin:   r => r === "super_admin",
  isAdmin:        r => ["super_admin", "admin"].includes(r),
  isPreFull:      r => ["super_admin", "admin", "pre_sales_admin"].includes(r),
  isPreUser:      r => r === "pre_sales_user",
  isPostFull:     r => ["super_admin", "admin", "post_sales_admin"].includes(r),
  isBankAdmin:    r => r === "bank_admin",
  canSendToBank:  r => ["super_admin", "admin"].includes(r),
  canChangeState: r => ["super_admin", "admin", "pre_sales_admin", "post_sales_admin"].includes(r),
};

export const ROLE_LABELS = {
  super_admin:      "Super Admin",
  admin:            "Admin",
  pre_sales_admin:  "Pre-Sales Admin",
  pre_sales_user:   "Pre-Sales User",
  post_sales_admin: "Post-Sales Admin",
  bank_admin:       "Bank Admin",
};

export const roleConfig = {
  super_admin:      { label: "Super Admin",      color: "#f59e0b", bg: "#f59e0b11", border: "#f59e0b44" },
  admin:            { label: "Admin",            color: "#9333ea", bg: "#9333ea11", border: "#9333ea44" },
  pre_sales_admin:  { label: "Pre-Sales Admin",  color: "#0891b2", bg: "#0891b211", border: "#0891b244" },
  pre_sales_user:   { label: "Pre-Sales User",   color: "#0284c7", bg: "#0284c711", border: "#0284c744" },
  post_sales_admin: { label: "Post-Sales Admin", color: "#16a34a", bg: "#16a34a11", border: "#16a34a44" },
  bank_admin:       { label: "Bank Admin",       color: "#0369a1", bg: "#0369a111", border: "#0369a144" },
};

export const stateStyle = {
  new_lead:                { bg: "#eef2ff", border: "#6366f144", text: "#6366f1" },
  opportunity_open:        { bg: "#f5f3ff", border: "#8b5cf644", text: "#8b5cf6" },
  opportunity_in_progress: { bg: "#ecfeff", border: "#0891b244", text: "#0891b2" },
  opportunity_submitted:   { bg: "#f0f9ff", border: "#0284c744", text: "#0284c7" },
  under_review:            { bg: "#fffbeb", border: "#d9770644", text: "#d97706" },
  documents_pending:       { bg: "#fff7ed", border: "#ea580c44", text: "#ea580c" },
  qualified:               { bg: "#f0fdf4", border: "#16a34a44", text: "#16a34a" },
  not_qualified:           { bg: "#fef2f2", border: "#dc262644", text: "#dc2626" },
  sent_to_bank:            { bg: "#f0f9ff", border: "#0369a144", text: "#0369a1" },
  bank_processing:         { bg: "#faf5ff", border: "#7c3aed44", text: "#7c3aed" },
  bank_approved:           { bg: "#f0fdf4", border: "#15803d44", text: "#15803d" },
  bank_rejected:           { bg: "#fef2f2", border: "#b91c1c44", text: "#b91c1c" },
  loan_disbursed:          { bg: "#dcfce7", border: "#16a34a44", text: "#16a34a" },
  deal_lost:               { bg: "#f8fafc", border: "#64748b44", text: "#64748b" },
  default:                 { bg: "#fff1f2", border: "#9f123944", text: "#9f1239" },
};

export const STATUS_COLOR = {
  "New":         { bg: "#7c3aed18", border: "#7c3aed44", text: "#7c3aed" },
  "Contacted":   { bg: "#0891b218", border: "#0891b244", text: "#0891b2" },
  "Qualified":   { bg: "#05966918", border: "#05966944", text: "#059669" },
  "Unqualified": { bg: "#dc262618", border: "#dc262644", text: "#dc2626" },
};

export const STAGE_STYLE = {
  "New Lead":           { bg: "#6366f118", border: "#6366f144", text: "#6366f1" },
  "In Progress":        { bg: "#0891b218", border: "#0891b244", text: "#0891b2" },
  "Under Review":       { bg: "#d9770618", border: "#d9770644", text: "#d97706" },
  "Documents Pending":  { bg: "#ea580c18", border: "#ea580c44", text: "#ea580c" },
  "Qualified":          { bg: "#05966918", border: "#05966944", text: "#059669" },
  "Not Qualified":      { bg: "#dc262618", border: "#dc262644", text: "#dc2626" },
};

export const TOPBAR_INFO = {
  sales:    { title: "Sales Overview",        sub: "Full pipeline · cross-team · all 15 states" },
  contacts: { title: "Contacts",              sub: "All enquiries · walk-ins · contact form submissions" },
  leads:    { title: "Leads",                 sub: "Qualified prospects · loan interest pipeline" },
  pre:      { title: "Sales Dashboard",       sub: "Lead acquisition · qualification pipeline" },
  post:     { title: "Post-Sales Dashboard",  sub: "Bank pipeline · disbursement · closure" },
  bank:     { title: "Bank Dashboard",        sub: "Loan verification · approval workflow" },
  admins:   { title: "Admin Management",      sub: "Super Admin · create, edit & remove admin members" },
};

export const NAV_TABS = [
  { key: "sales",    label: "Sales Overview",       dot: "#ea580c", section: "Overview",    show: u => ["super_admin","admin"].includes(u?.role) },
  { key: "contacts", label: "Contacts",             dot: "#7c3aed", section: "CRM",         show: u => u?.role !== "bank_admin" },
  { key: "leads",    label: "Leads",                dot: "#f59e0b", section: "CRM",         show: u => u?.role !== "bank_admin" },
  { key: "pre",      label: "Sales Dashboard",      dot: "#0891b2", section: "Pre-Sales",   show: u => CAN_SEE_PRE.includes(u?.role) },
  { key: "post",     label: "Post-Sales Dashboard", dot: "#16a34a", section: "Post-Sales",  show: u => CAN_SEE_POST.includes(u?.role) },
  // bank_admin sees their own dashboard; super_admin sees the multi-bank view
  { key: "bank",     label: "Bank Dashboard",       dot: "#0369a1", section: "Bank",        show: u => ["bank_admin", "super_admin"].includes(u?.role) },
  { key: "admins",   label: "Manage Admins",        dot: "#f59e0b", section: "Management",  show: u => u?.role === "super_admin" },
];

export const TAB_BUTTONS = [
  { key: "sales",    label: "Sales",       active: "#ea580c", textColor: "#fff", show: u => ["super_admin","admin"].includes(u?.role) },
  { key: "contacts", label: "Contacts",   active: "#7c3aed", textColor: "#fff", show: u => u?.role !== "bank_admin" },
  { key: "leads",    label: "Leads",      active: "#f59e0b", textColor: "#000", show: u => u?.role !== "bank_admin" },
  { key: "pre",      label: "Pre-Sales",  active: "#0891b2", textColor: "#fff", show: u => CAN_SEE_PRE.includes(u?.role) },
  { key: "post",     label: "Post-Sales", active: "#16a34a", textColor: "#fff", show: u => CAN_SEE_POST.includes(u?.role) },
  { key: "bank",     label: "Bank",       active: "#0369a1", textColor: "#fff", show: u => ["bank_admin", "super_admin"].includes(u?.role) },
  { key: "admins",   label: "Admins",     active: "#f59e0b", textColor: "#000", show: u => u?.role === "super_admin" },
];