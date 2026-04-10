/**
 * Service layer — thin wrapper around the Axios instance.
 *
 * Provides:
 *   - Centralised API method signatures (easy to swap transport later)
 *   - In-memory TTL cache for read endpoints so components avoid duplicate
 *     fetches during the same session (cache is cleared on page reload).
 */

import api from './axios'

// --- Simple in-memory cache -------------------------------------------

const _cache = new Map()

/**
 * @param {string} key   - cache key
 * @param {Function} fn  - async function returning the value to cache
 * @param {number} ttlMs - time-to-live in milliseconds (default 30 s)
 */
async function withCache(key, fn, ttlMs = 30_000) {
  const hit = _cache.get(key)
  if (hit && Date.now() - hit.ts < ttlMs) {
    return hit.data
  }
  const data = await fn()
  _cache.set(key, { data, ts: Date.now() })
  return data
}

export function invalidateCache(keyPrefix) {
  for (const key of _cache.keys()) {
    if (key.startsWith(keyPrefix)) _cache.delete(key)
  }
}

// --- Auth ---------------------------------------------------------------

export const authService = {
  login:  (username, password) => api.post('/auth/login', { username, password }),
  signup: (data) => api.post('/auth/signup', data),
  me:     () => api.get('/auth/me'),
}

// --- Departments --------------------------------------------------------

export const departmentService = {
  list: () =>
    withCache('departments', () => api.get('/departments').then(r => r.data)),
  add:    (name) => { invalidateCache('departments'); return api.post('/departments', { name }) },
  update: (id, name) => { invalidateCache('departments'); return api.put(`/departments/${id}`, { name }) },
  remove: (id) => { invalidateCache('departments'); return api.delete(`/departments/${id}`) },
}

// --- Instruments --------------------------------------------------------

export const instrumentService = {
  list: (departmentId) =>
    withCache(`instruments:${departmentId}`, () =>
      api.get(`/instruments?department_id=${departmentId}`).then(r => r.data)
    ),
  add: (data) => { invalidateCache(`instruments:${data.department_id}`); return api.post('/instruments', data) },
  update: (id, data) => { invalidateCache(`instruments:${data.department_id}`); return api.put(`/instruments/${id}`, data) },
  remove: (id, departmentId) => { invalidateCache(`instruments:${departmentId}`); return api.delete(`/instruments/${id}`) },
}

// --- Counts / Sessions --------------------------------------------------

export const countService = {
  /** Dashboard summary — cached for 30 s, refreshed every 30 s in the UI */
  dashboard: () =>
    withCache('counts:dashboard', () => api.get('/counts/dashboard').then(r => r.data), 30_000),

  check: (payload) => api.post('/counts/check', payload),
  createSession: (payload) => api.post('/counts/session', payload),
  getSession: (id) => api.get(`/counts/session/${id}`),
  saveEntry: (payload) => api.put('/counts/entry', payload),
  submit: (sessionId) => {
    invalidateCache('counts:dashboard')
    return api.post(`/counts/submit/${sessionId}`)
  },
  history: (params) => api.get('/counts/history', { params }),
}

// --- Staff --------------------------------------------------------------

export const staffService = {
  list:          () => withCache('staff', () => api.get('/staff').then(r => r.data)),
  block:         (id) => { invalidateCache('staff'); return api.put(`/staff/${id}/block`) },
  unblock:       (id) => { invalidateCache('staff'); return api.put(`/staff/${id}/unblock`) },
  resetPassword: (id) => api.put(`/staff/${id}/reset-password`),
}

// --- Export -------------------------------------------------------------

export const exportService = {
  excel: (params) => api.get('/export/excel', { params, responseType: 'blob' }),
  print: (params) => api.get('/export/print', { params }),
}
