import api from "./api";

// Get all users
export const getUsers = () => {
  return api.get("/api/users/");
};

// Create new user
export const createUser = (data) => {
  return api.post("/api/users/", data);
};

// Get single user
export const getUser = (user_id) => {
  return api.get(`/api/users/${user_id}`);
};

// Update user details
export const updateUser = (user_id, data) => {
  return api.put(`/api/users/${user_id}`, data);
};

// Delete user
export const deleteUser = (user_id) => {
  return api.delete(`/api/users/${user_id}`);
};

// Update user status (Active / Inactive)
export const updateUserStatus = (user_id, data) => {
  return api.patch(`/api/users/${user_id}/status`, data);
};

// Reset user password
export const resetUserPassword = (user_id, data) => {
  return api.patch(`/api/users/${user_id}/password`, data);
};

// Get user activity logs
export const getUserActivity = (user_id) => {
  return api.get(`/api/users/${user_id}/activity`);
};


// ── Add these to your existing src/api/userApi.js ────
//
// Keep all your existing exports and add these two:

export const createBankAdmin = (payload) =>
  api.post("/api/users/bank-admin", payload);

export const getBankers = (bankName) =>
  api.get("/api/users/bankers", { params: bankName ? { bank_name: bankName } : {} });