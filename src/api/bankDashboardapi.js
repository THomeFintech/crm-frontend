// src/api/bankDashboardApi.js
import api from "./api";

// Bank admin: full dashboard on login — returns { banker_name, bank_name, kpis, loans[] }
export const getBankDashboard = () =>
  api.get("/api/bank-dashboard/");

// Bank admin: filtered loans list — params: { stage, search, page, limit }
export const getMyLoans = (params = {}) =>
  api.get("/api/bank-dashboard/loans", { params });

// Bank admin: single loan detail — 404 if not assigned to current banker
export const getLoanDetail = (loan_id) =>
  api.get(`/api/bank-dashboard/loans/${loan_id}`);

// Bank admin: update loan stage — comment is mandatory
export const updateLoanStage = (loan_id, stage, comment, notes = null) =>
  api.patch(`/api/bank-dashboard/loans/${loan_id}/stage`, {
    stage,
    comment,
    ...(notes ? { notes } : {}),
  });

// Pre-sales admin: get all active bank_admin users for Route to Bank dropdown
export const getBankers = () =>
  api.get("/api/bank-dashboard/bankers");
