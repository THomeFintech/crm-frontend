import api from "./api";

// Get all leads
export const getLeads = () => {
  return api.get("/api/leads/");
};

// Create new lead
export const createLead = (data) => {
  return api.post("/api/leads/", data);
};

// Get single lead
export const getLead = (lead_id) => {
  return api.get(`/api/leads/${lead_id}`);
};

// Update lead
export const updateLead = (lead_id, data) => {
  return api.put(`/api/leads/${lead_id}`, data);
};

// Delete lead
export const deleteLead = (lead_id) => {
  return api.delete(`/api/leads/${lead_id}`);
};

// Update lead state (NEW → QUALIFIED → REJECTED etc.)
export const updateLeadState = (lead_id, data) => {
  return api.patch(`/api/leads/${lead_id}/state`, data);
};

// Send lead to bank
export const sendLeadToBank = (lead_id) => {
  return api.post(`/api/leads/${lead_id}/send-to-bank`);
};