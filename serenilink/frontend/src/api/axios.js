import axios from "axios";
import { normalizeApiError } from "./errors.js";

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config.url === "/auth/change-password" && response.data.access_token) {
      const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      storage.setItem("token", response.data.access_token);
    }
    return response;
  },
  (error) => {
    normalizeApiError(error);
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes("/auth/login") ||
                          error.config?.url?.includes("/auth/register");
      if (!isAuthRoute) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        window.location.href = "/login?session=expired";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
