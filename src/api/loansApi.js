import api from "./api";

// Get all loans
export const getLoans = () => {
  return api.get("/api/loans/");
};

// Get single loan
export const getLoan = (loan_id) => {
  return api.get(`/api/loans/${loan_id}`);
};

// Update loan details
export const updateLoan = (loan_id, data) => {
  return api.put(`/api/loans/${loan_id}`, data);
};

// Update loan state (Processing / Approved / Rejected / Disbursed)
export const updateLoanState = (loan_id, data) => {
  return api.patch(`/api/loans/${loan_id}/state`, data);
};