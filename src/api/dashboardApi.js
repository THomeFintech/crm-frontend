import api from "./api";

// Sales Overview Dashboard
export const getSalesOverview = () => {
  return api.get("/api/dashboard/sales");
};

// Pre-Sales Dashboard
export const getPreSalesDashboard = () => {
  return api.get("/api/dashboard/pre");
};

// Post-Sales Dashboard
export const getPostSalesDashboard = () => {
  return api.get("/api/dashboard/post");
};

// Trends data (for charts)
export const getTrends = () => {
  return api.get("/api/dashboard/trends");
};

// Pipeline data
export const getPipeline = () => {
  return api.get("/api/dashboard/pipeline");
};
export const getDisbursedLoanRecords = () => {
  return api.get("/api/disbursed");
};

export const getBankPerformance = () => {
  return api.get("/api/performance/bank");
};
