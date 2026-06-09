import axios from "axios";

// In production builds, point directly at the Render backend. In dev, Vite's
// proxy forwards /api → localhost:5000.
const BASE_URL = import.meta.env.PROD
  ? "https://avira-fleet-backend.onrender.com/api"
  : "/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true, // httpOnly auth cookie is the source of truth
});

// ── Auth token handling ───────────────────────────────────────────────────────
// The httpOnly cookies are the source of truth. We DO NOT persist tokens in
// localStorage (that's readable by any injected script — an XSS token-theft
// risk). We keep the access token only in memory for the lifetime of the tab,
// as a Bearer fallback for cross-site setups where the browser blocks the
// third-party cookie. On reload, memory is empty and the session is restored
// from the cookie via /auth/me (and refreshed via the refresh cookie).
let memAccessToken = "";
export const setAccessToken = (t) => { memAccessToken = t || ""; };
export const clearAccessToken = () => { memAccessToken = ""; };

// Every request: declare the surface (for the maintenance guard) and attach the
// in-memory Bearer token when we have one. The cookie rides along automatically.
api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers["X-Avira-Surface"] = "fleet";
  if (memAccessToken) config.headers.Authorization = `Bearer ${memAccessToken}`;
  return config;
});

// On access-token expiry, refresh using the httpOnly refresh cookie, store the
// new access token in memory, then retry the original request once.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (
      err.response?.status === 401 &&
      err.response?.data?.code === "TOKEN_EXPIRED" &&
      original &&
      !original._retry
    ) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(original);
      } catch {
        clearAccessToken();
        if (typeof window !== "undefined") window.location.href = "#/login";
      }
    }
    return Promise.reject(err);
  },
);

export default api;

// ─── Endpoint helpers ────────────────────────────────────────────
export const authAPI = {
  login: async (body) => {
    const res = await api.post("/auth/login", body);
    if (res.data?.accessToken) setAccessToken(res.data.accessToken); // not set on 2FA challenge
    return res;
  },
  logout: async () => {
    try {
      return await api.post("/auth/logout");
    } finally {
      clearAccessToken();
    }
  },
  me: () => api.get("/auth/me"),
  changePassword: (body) => api.put("/auth/change-password", body),
  updateProfile: (body) => api.put("/auth/profile", body).then((r) => r.data),
  refresh: async () => {
    const res = await api.post("/auth/refresh", {});
    setAccessToken(res.data?.accessToken);
    return res;
  },
  verify: async (body) => {
    const res = await api.post("/auth/verify", body);
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    return res;
  },
  verifyInfo: (token) => api.get(`/auth/verify/${token}`),

  // Forgot / reset password
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, newPassword }),

  // 2FA login completion (challengeToken comes from a 2FA-required login)
  twoFactorVerify: async (challengeToken, code) => {
    const res = await api.post("/auth/2fa/verify", { challengeToken, code });
    if (res.data?.accessToken) setAccessToken(res.data.accessToken);
    return res;
  },
  twoFactorEmailCode: (challengeToken) =>
    api.post("/auth/2fa/email-code", { challengeToken }),

  // 2FA management (authenticated)
  twoFactorSetup: () => api.post("/auth/2fa/setup").then((r) => r.data),
  twoFactorEnable: (code) => api.post("/auth/2fa/enable", { code }).then((r) => r.data),
  twoFactorDisable: (body) => api.post("/auth/2fa/disable", body).then((r) => r.data),
  twoFactorDismissPrompt: () => api.post("/auth/2fa/dismiss-prompt").then((r) => r.data),
};

export const vehicleAPI = {
  list: (params) => api.get("/vehicles", { params }),
  get: (id) => api.get(`/vehicles/${id}`),
  create: (body) => api.post("/vehicles", body),
  update: (id, b) => api.put(`/vehicles/${id}`, b),
  updateStatus: (id, b) => api.patch(`/vehicles/${id}/status`, b),
  assign: (id, b) => api.patch(`/vehicles/${id}/assign`, b),
  retire: (id) => api.delete(`/vehicles/${id}`),
};

export const driverAPI = {
  list: (params) => api.get("/drivers", { params }),
  get: (id) => api.get(`/drivers/${id}`),
  create: (body) => api.post("/drivers", body),
  update: (id, b) => api.put(`/drivers/${id}`, b),
  getSchedules: (id, p) => api.get(`/drivers/${id}/schedules`, { params: p }),
  createSchedule: (id, b) => api.post(`/drivers/${id}/schedules`, b),
  deleteSchedule: (sid) => api.delete(`/drivers/schedules/${sid}`),
};

export const dashboardAPI = {
  stats: () => api.get("/dashboard/stats"),
  alerts: () => api.get("/dashboard/alerts"),
  users: () => api.get("/dashboard/users"),
  createUser: (body) => api.post("/dashboard/users", body),
  toggleUser: (id) => api.patch(`/dashboard/users/${id}/toggle`),
  updateUserRole: (id, body) => api.patch(`/dashboard/users/${id}/role`, body),
  devUpdateUserRole: (id, body) =>
    api.patch(`/dashboard/users/${id}/role-override`, body),
  resetUserPassword: (id) => api.patch(`/dashboard/users/${id}/reset-password`),
  updateUser: (id, body) => api.patch(`/dashboard/users/${id}`, body),
  deleteUser: (id) => api.delete(`/dashboard/users/${id}`),
  teamAnalytics: () => api.get("/dashboard/team-analytics").then((r) => r.data),
};

export const applicationsAPI = {
  list: (params) => api.get("/driver-applications", { params }),
  get: (id) => api.get(`/driver-applications/${id}`),
  updateStatus: (id, body) =>
    api.patch(`/driver-applications/${id}/status`, body),
};

export const messagingAPI = {
  recipients: (groups) =>
    api.get("/messaging/recipients", { params: { groups: groups.join(",") } }),
  listCampaigns: () => api.get("/messaging/campaigns"),
  createCampaign: (body) => api.post("/messaging/campaigns", body),
  updateCampaign: (id, body) => api.patch(`/messaging/campaigns/${id}`, body),
  cancelCampaign: (id) => api.patch(`/messaging/campaigns/${id}/cancel`),
  retryCampaign: (id) => api.post(`/messaging/campaigns/${id}/retry`),
  deleteCampaign: (id) => api.delete(`/messaging/campaigns/${id}`),
  uploadAttachment: (formData) => api.post("/uploads/attachment", formData),
};

export const analyticsAPI = {
  fleet: () => api.get("/analytics/fleet"),
};

export const promoAPI = {
  list: () => api.get("/promos").then((r) => r.data),
  create: (body) => api.post("/promos", body).then((r) => r.data),
  update: (id, body) => api.put(`/promos/${id}`, body).then((r) => r.data),
  toggle: (id) => api.patch(`/promos/${id}/toggle`).then((r) => r.data),
  remove: (id) => api.delete(`/promos/${id}`).then((r) => r.data),
  getFlags: () => api.get("/promos/flags").then((r) => r.data),
  setFlag: (key, enabled) =>
    api.put("/promos/flags", { key, enabled }).then((r) => r.data),
};

export const devAPI = {
  overview: () => api.get("/dev/overview"),
  database: () => api.get("/dev/database"),
  requests: (p) => api.get("/dev/requests", { params: p }),
  authLogs: (p) => api.get("/dev/logs/auth", { params: p }),
  auditLogs: (p) => api.get("/dev/logs/audit", { params: p }),
  systemLogs: (p) => api.get("/dev/logs/system", { params: p }),
  incidents: () => api.get("/dev/incidents"),
  jobs: () => api.get("/dev/jobs"),
  runJob: (id) => api.post(`/dev/jobs/${id}/run`),
};

export const maintenanceAPI = {
  status: () => api.get("/maintenance", { params: { surface: "fleet" } }).then((r) => r.data),
  getFlag: () => api.get("/dev/maintenance").then((r) => r.data),
  setTargets: (targets) =>
    api.post("/dev/maintenance", { targets }).then((r) => r.data),
  getPayment: () => api.get("/dev/payment-issue").then((r) => r.data),
  setPaymentTargets: (targets) =>
    api.post("/dev/payment-issue", { targets }).then((r) => r.data),
};

export const revenueAPI = {
  list: (params) => api.get("/revenue", { params }).then((r) => r.data),
  analytics: () => api.get("/revenue/analytics").then((r) => r.data),
  create: (body) => api.post("/revenue", body).then((r) => r.data),
  update: (id, b) => api.put(`/revenue/${id}`, b).then((r) => r.data),
  delete: (id) => api.delete(`/revenue/${id}`).then((r) => r.data),
};

// ── Gallery (admin-managed photos & videos shown on the public site) ─────────
export const galleryAPI = {
  list: (params) => api.get("/gallery", { params }).then((r) => r.data),
  create: (body) => api.post("/gallery", body).then((r) => r.data),
  update: (id, body) => api.put(`/gallery/${id}`, body).then((r) => r.data),
  toggle: (id) => api.patch(`/gallery/${id}/toggle`).then((r) => r.data),
  reorder: (items) =>
    api.post("/gallery/reorder", { items }).then((r) => r.data),
  remove: (id) => api.delete(`/gallery/${id}`).then((r) => r.data),

  upload(file, meta = {}, onProgress) {
    const form = new FormData();
    form.append("file", file);
    if (meta.caption !== undefined) form.append("caption", meta.caption);
    if (meta.sortOrder !== undefined)
      form.append("sortOrder", String(meta.sortOrder));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/gallery/upload`);
      xhr.withCredentials = true; // send the httpOnly auth cookie
      if (memAccessToken) xhr.setRequestHeader("Authorization", `Bearer ${memAccessToken}`);
      xhr.setRequestHeader("X-Avira-Surface", "fleet");

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }

      xhr.onload = () => {
        let data;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = {};
        }
        if (xhr.status >= 200 && xhr.status < 300)
          return resolve(data.item || data);
        reject(new Error(data.message || `Upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Upload failed — network error"));
      xhr.send(form);
    });
  },
};
