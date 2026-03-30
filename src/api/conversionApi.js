import api from "./api";

// Update contact state
export const updateContactState = (contact_id, data) => {
  return api.patch(`/api/pre-sales/contacts/${contact_id}/state`, {
    status: data.state,
    notes:  data.notes,
  });
};
// Update lead stage
export const updateLeadStage = (lead_id, data) => {
  return api.patch(`/api/pre-sales/leads/${lead_id}/stage`, data);
};

// Check contact eligibility before conversion
export const checkContactEligibility = (contact_id) => {
  return api.get(`/api/pre-sales/contacts/${contact_id}/convert-to-lead/check`);
};

// Convert contact to lead
export const convertContactToLead = (contact_id) => {
  return api.post(`/api/pre-sales/contacts/${contact_id}/convert-to-lead`);
};

// Convert lead to contact
export const convertLeadToContact = (lead_id) => {
  return api.post(
    `/api/pre-sales/leads/${lead_id}/convert-to-contact`,
    {}
  );
};