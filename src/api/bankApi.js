import api from "./api";

// Get bank dashboard
export const getBankDashboard = () => {
  return api.get("/api/bank-dashboard/");
};

// Update loan stage
export const updateBankLoanStage = (loanId, data) => {
  return api.patch(`/api/bank-dashboard/loans/${loanId}/stage`, data);
};