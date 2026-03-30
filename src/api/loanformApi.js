import api from "./api";

// Send loan form link to customer email
export const sendLoanForm = (contact_id) => {
  return api.post(`/api/forms/send-loan-form/${contact_id}`);
};

// Validate loan form token
export const validateLoanFormToken = (token) => {
  return api.get(`/api/forms/validate-token`, {
    params: { token },
  });
};

// Submit loan application form with documents
export const submitLoanForm = (data) => {
  return api.post(`/api/forms/loan-details`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Check if loan form was submitted
export const getLoanFormStatus = (contact_id) => {
  return api.get(`/api/forms/status/${contact_id}`);
};

// Get loan form submission details for admin review
export const getLoanFormSubmission = (contact_id) => {
  return api.get(`/api/forms/submission/${contact_id}`);
};