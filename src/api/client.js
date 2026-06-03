import axios from "axios";

// In production builds (import.meta.env.PROD === true), point directly at the
// Render backend service. In development, Vite's proxy forwards /api → localhost:4000.
const BASE_URL = import.meta.env.PROD
  ? "https://avira-fleet-backend.onrender.com/api"
  : "/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token expiry — auto-refresh
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
        const refreshToken = localStorage.getItem("refresh_token");
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem("access_token", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        // Refresh failed — clear session
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "#/login";
      }
    }
    return Promise.reject(err);
  },
);

export default api;

// ─── Endpoint helpers ────────────────────────────────────────────
export const authAPI = {
  login: (body) => api.post("/auth/login", body),
  me: () => api.get("/auth/me"),
  changePassword: (body) => api.put("/auth/change-password", body),
  refresh: (body) => api.post("/auth/refresh", body),
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
    const token = localStorage.getItem("access_token");
    const form  = new FormData();
    form.append("file", file);
    if (meta.caption !== undefined)   form.append("caption", meta.caption);
    if (meta.sortOrder !== undefined) form.append("sortOrder", String(meta.sortOrder));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/gallery/upload`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

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
