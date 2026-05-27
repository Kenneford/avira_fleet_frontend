import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle token expiry — auto-refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        localStorage.setItem('access_token', data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        // Refresh failed — clear session
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Endpoint helpers ────────────────────────────────────────────
export const authAPI = {
  login:          (body) => api.post('/auth/login', body),
  me:             ()     => api.get('/auth/me'),
  changePassword: (body) => api.put('/auth/change-password', body),
  refresh:        (body) => api.post('/auth/refresh', body),
}

export const vehicleAPI = {
  list:         (params) => api.get('/vehicles', { params }),
  get:          (id)     => api.get(`/vehicles/${id}`),
  create:       (body)   => api.post('/vehicles', body),
  update:       (id, b)  => api.put(`/vehicles/${id}`, b),
  updateStatus: (id, b)  => api.patch(`/vehicles/${id}/status`, b),
  assign:       (id, b)  => api.patch(`/vehicles/${id}/assign`, b),
  retire:       (id)     => api.delete(`/vehicles/${id}`),
}

export const driverAPI = {
  list:           (params) => api.get('/drivers', { params }),
  get:            (id)     => api.get(`/drivers/${id}`),
  create:         (body)   => api.post('/drivers', body),
  update:         (id, b)  => api.put(`/drivers/${id}`, b),
  getSchedules:   (id, p)  => api.get(`/drivers/${id}/schedules`, { params: p }),
  createSchedule: (id, b)  => api.post(`/drivers/${id}/schedules`, b),
  deleteSchedule: (sid)    => api.delete(`/drivers/schedules/${sid}`),
}

export const dashboardAPI = {
  stats:       ()       => api.get('/dashboard/stats'),
  alerts:      ()       => api.get('/dashboard/alerts'),
  users:       ()       => api.get('/dashboard/users'),
  createUser:  (body)   => api.post('/dashboard/users', body),
  toggleUser:  (id)     => api.patch(`/dashboard/users/${id}/toggle`),
}

export const analyticsAPI = {
  fleet: () => api.get('/analytics/fleet'),
}
