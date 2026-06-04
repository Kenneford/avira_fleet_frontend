import axios from "axios";

// In production builds (import.meta.env.PROD === true), point directly at the
// Render backend service. In development, Vite's proxy forwards /api → localhost:4000.
const BASE_URL = import.meta.env.PROD
  ? "https://avira-fleet-backend.onrender.com/api"
  : "/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true, // send/receive the httpOnly auth cookie
});

// ── Hybrid auth: httpOnly cookies + Bearer-token fallback ──────────────────
// The httpOnly cookies work great when the dashboard and API share a domain.
// But across different origins — e.g. the onrender `app.` and `api.` subdomains,
// and especially mobile browsers / in-app webviews that block "third-party"
// cookies — the cookie is NOT sent, so every request 401s with
// "Access token required". To work everywhere we ALSO keep the tokens and send
// them via the Authorization header; the backend accepts cookie OR header.
//
// Tradeoff: tokens live in localStorage (readable by JS, so XSS-exposed). Once
// the dashboard + API are on a shared parent domain with COOKIE_DOMAIN set, the
// first-party cookie carries auth on its own and this header is just a fallback.
const ACCESS_KEY = "avira_access";
const REFRESH_KEY = "avira_refresh";

export const tokenStore = {
  get access() { try { return localStorage.getItem(ACCESS_KEY) || ""; } catch { return ""; } },
  get refresh() { try { return localStorage.getItem(REFRESH_KEY) || ""; } catch { return ""; } },
  set(access, refresh) {
    try {
      if (access) localStorage.setItem(ACCESS_KEY, access);
      if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    } catch { /* storage unavailable (private mode) — cookies still apply */ }
  },
  setAccess(access) { try { if (access) localStorage.setItem(ACCESS_KEY, access); } catch { /* noop */ } },
  clear() { try { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); } catch { /* noop */ } },
};

// Attach the Bearer token (when we have one) on every request, alongside the cookie.
api.interceptors.request.use((config) => {
  const t = tokenStore.access;
  if (t) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

// On access-token expiry, refresh (via stored refresh token AND/OR the refresh
// cookie), persist the new access token, then retry the original request once.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (
      err.response?.status === 401 &&
      err.response?.data?.code === "TOKEN_EXPIRED" &&
      !original._retry
    ) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken: tokenStore.refresh || undefined },
          { withCredentials: true },
        );
        if (data?.accessToken) {
          tokenStore.setAccess(data.accessToken);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(original);
      } catch {
        tokenStore.clear();
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
    tokenStore.set(res.data?.accessToken, res.data?.refreshToken);
    return res;
  },
  logout: async () => {
    try {
      return await api.post("/auth/logout");
    } finally {
      tokenStore.clear();
    }
  },
  me: () => api.get("/auth/me"),
  changePassword: (body) => api.put("/auth/change-password", body),
  refresh: async (body) => {
    const res = await api.post("/auth/refresh", {
      refreshToken: tokenStore.refresh || undefined,
      ...(body || {}),
    });
    tokenStore.setAccess(res.data?.accessToken);
    return res;
  },
  verify: async (body) => {
    const res = await api.post("/auth/verify", body);
    tokenStore.set(res.data?.accessToken, res.data?.refreshToken);
    return res;
  },
  verifyInfo: (token) => api.get(`/auth/verify/${token}`),
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
  // Developer-only technical override — can set ANY role on ANY user.
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
  updateStatus: (id, body) => api.patch(`/driver-applications/${id}/status`, body),
};

export const messagingAPI = {
  recipients: (groups) => api.get("/messaging/recipients", { params: { groups: groups.join(",") } }),
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
  list:     () => api.get("/promos").then((r) => r.data),
  create:   (body) => api.post("/promos", body).then((r) => r.data),
  update:   (id, body) => api.put(`/promos/${id}`, body).then((r) => r.data),
  toggle:   (id) => api.patch(`/promos/${id}/toggle`).then((r) => r.data),
  remove:   (id) => api.delete(`/promos/${id}`).then((r) => r.data),
  getFlags: () => api.get("/promos/flags").then((r) => r.data),
  setFlag:  (key, enabled) => api.put("/promos/flags", { key, enabled }).then((r) => r.data),
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

export const revenueAPI = {
  list: (params) => api.get("/revenue", { params }).then((r) => r.data),
  analytics: () => api.get("/revenue/analytics").then((r) => r.data),
  create: (body) => api.post("/revenue", body).then((r) => r.data),
  update: (id, b) => api.put(`/revenue/${id}`, b).then((r) => r.data),
  delete: (id) => api.delete(`/revenue/${id}`).then((r) => r.data),
};

// ── Gallery (admin-managed photos & videos shown on the public site) ─────────
//
// Uploads are server-side: the browser POSTs a multipart form to
// /api/gallery/upload, the backend streams the file to Cloudinary and creates
// the GalleryItem record in one round-trip. The XHR-based `upload` helper
// preserves progress events (axios doesn't surface upload progress as nicely
// with FormData in all environments).
export const galleryAPI = {
  list:    (params) => api.get("/gallery", { params }).then((r) => r.data),
  create:  (body) => api.post("/gallery", body).then((r) => r.data),
  update:  (id, body) => api.put(`/gallery/${id}`, body).then((r) => r.data),
  toggle:  (id) => api.patch(`/gallery/${id}/toggle`).then((r) => r.data),
  reorder: (items) => api.post("/gallery/reorder", { items }).then((r) => r.data),
  remove:  (id) => api.delete(`/gallery/${id}`).then((r) => r.data),

  /**
   * Upload a single file (image or video) and create the GalleryItem.
   * Resolves with the created item or rejects with an Error.
   *
   * @param {File}    file        The file to upload
   * @param {object}  meta        Optional metadata (caption, sortOrder)
   * @param {function} onProgress Called with 0–100 as the upload progresses
   */
  upload(file, meta = {}, onProgress) {
    const form  = new FormData();
    form.append("file", file);
    if (meta.caption !== undefined)   form.append("caption", meta.caption);
    if (meta.sortOrder !== undefined) form.append("sortOrder", String(meta.sortOrder));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/gallery/upload`);
      xhr.withCredentials = true; // send the httpOnly auth cookie (when same-site)
      const _t = tokenStore.access; // …and the Bearer fallback for mobile/cross-site
      if (_t) xhr.setRequestHeader("Authorization", `Bearer ${_t}`);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }

      xhr.onload = () => {
        let data;
        try { data = JSON.parse(xhr.responseText); } catch { data = {}; }
        if (xhr.status >= 200 && xhr.status < 300) return resolve(data.item || data);
        reject(new Error(data.message || `Upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(form);
    });
  },
};
