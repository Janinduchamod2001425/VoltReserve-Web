import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
});

// ---- simple token helpers ----
export const auth = {
  set(token, email, role) {
    localStorage.setItem("token", token);
    localStorage.setItem("email", email ?? "");
    localStorage.setItem("role", role ?? "");
  },
  clear() {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
  },
  token() {
    return localStorage.getItem("token");
  },
  role() {
    return localStorage.getItem("role") || "";
  },
  email() {
    return localStorage.getItem("email") || "";
  },
  isBackoffice() {
    return (localStorage.getItem("role") || "").toLowerCase() === "backoffice";
  },
  isStationOperator() {
    return (
      (localStorage.getItem("role") || "").toLowerCase() === "stationoperator"
    );
  },
  isAuthed() {
    return !!localStorage.getItem("token");
  },
};

// attach Authorization header if token exists
api.interceptors.request.use((config) => {
  const t = auth.token();
  if (t) {
    config.headers.Authorization = t.startsWith("Bearer ") ? t : `Bearer ${t}`;
  }
  return config;
});

export default api;
