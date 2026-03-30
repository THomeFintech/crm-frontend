import api from "./api";

// Get all contacts
export const getContacts = () => {
  return api.get("/api/contacts/");
};

// Create new contact
export const createContact = (data) => {
  return api.post("/api/contacts/", data);
};

// Get single contact
export const getContact = (contact_id) => {
  return api.get(`/api/contacts/${contact_id}`);
};

// Update contact
export const updateContact = (contact_id, data) => {
  return api.put(`/api/contacts/${contact_id}`, data);
};

// Delete contact
export const deleteContact = (contact_id) => {
  return api.delete(`/api/contacts/${contact_id}`);
};