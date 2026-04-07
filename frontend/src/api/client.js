import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refresh}` },
          })
          localStorage.setItem('access_token', data.access_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
}

// ── Report Card ───────────────────────────────────────────────────────────
export const reportApi = {
  upload: (formData) => api.post('/report/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  manual: (data) => api.post('/report/manual', data),
  list: () => api.get('/report/'),
  get: (id) => api.get(`/report/${id}`),
}

// ── Analysis ──────────────────────────────────────────────────────────────
export const analysisApi = {
  analyze: (data) => api.post('/analysis/analyze', data),
  history: () => api.get('/analysis/history'),
  get: (id) => api.get(`/analysis/${id}`),
}

// ── Roadmap ───────────────────────────────────────────────────────────────
export const roadmapApi = {
  generate: (data) => api.post('/roadmap/generate', data),
  active: () => api.get('/roadmap/active'),
  list: () => api.get('/roadmap/'),
  get: (id) => api.get(`/roadmap/${id}`),
}

// ── Practice ──────────────────────────────────────────────────────────────
export const practiceApi = {
  questions: (data) => api.post('/practice/questions', data),
  evaluate: (data) => api.post('/practice/evaluate', data),
  complete: (id, data) => api.post(`/practice/session/${id}/complete`, data),
  sessions: () => api.get('/practice/sessions'),
  examPrep: (data) => api.post('/practice/exam-prep', data),
  revision: (data) => api.post('/practice/revision-material', data),
}

// ── Chatbot ───────────────────────────────────────────────────────────────
export const chatApi = {
  send: (data) => api.post('/chatbot/message', data),
  sessions: () => api.get('/chatbot/sessions'),
  getSession: (id) => api.get(`/chatbot/session/${id}`),
  deleteSession: (id) => api.delete(`/chatbot/session/${id}`),
}

// ── Gamification ──────────────────────────────────────────────────────────
export const gamificationApi = {
  dashboard: () => api.get('/gamification/dashboard'),
  leaderboard: () => api.get('/gamification/leaderboard'),
}

export default api
