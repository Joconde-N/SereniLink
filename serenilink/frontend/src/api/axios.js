import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
