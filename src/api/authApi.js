import api from "./api";

export const loginUser = (data) => {
  return api.post("/api/auth/login", data);
};

export const logoutUser = () => {
  return api.post("/api/auth/logout");
};

export const refreshToken = (data) => {
  return api.post("/api/auth/refresh", data);
};