import api from './client'
import type { CatalogPlant, UserPlant, CareLog, CareStats, DiagnosticStep, CareSchedule } from '../types'

// Auth
export const authApi = {
  register: (username: string, password: string) =>
    api.post<{ access_token: string; username: string }>('/auth/register', { username, password }),
  login: (username: string, password: string) =>
    api.post<{ access_token: string; username: string }>('/auth/login', { username, password }),
  deleteAccount: () => api.delete('/auth/account'),
}

// Catalog
export const catalogApi = {
  getAll: (params?: { search?: string; category?: string; difficulty?: string }) =>
    api.get<CatalogPlant[]>('/catalog', { params }),
  getOne: (id: number) => api.get<CatalogPlant>(`/catalog/${id}`),
  getCategories: () => api.get<string[]>('/catalog/categories'),
}

// My Plants
export const myPlantsApi = {
  getAll: () => api.get<UserPlant[]>('/my-plants'),
  getOne: (id: number) => api.get<UserPlant>(`/my-plants/${id}`),
  add: (data: { catalog_plant_id: number; nickname?: string; location?: string; added_date?: string }) =>
    api.post<UserPlant>('/my-plants', data),
  update: (id: number, data: { nickname?: string; location?: string; notes?: string }) =>
    api.patch<UserPlant>(`/my-plants/${id}`, data),
  delete: (id: number) => api.delete(`/my-plants/${id}`),
  uploadPhoto: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ photo_path: string }>(`/my-plants/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  logCare: (id: number, action_type: string, notes?: string) =>
    api.post<UserPlant>(`/my-plants/${id}/care`, { action_type, notes }),
  getSchedule: (id: number) => api.get<CareSchedule>(`/my-plants/${id}/schedule`),
}

// Care Log
export const careLogApi = {
  getAll: (params?: { plant_id?: number; action_type?: string; days?: number }) =>
    api.get<CareLog[]>('/care-log', { params }),
  getStats: () => api.get<CareStats>('/care-log/stats'),
}

// Diagnostics
export const diagnosticsApi = {
  getStart: () => api.get<DiagnosticStep>('/diagnostics/start'),
  getStep: (id: number) => api.get<DiagnosticStep>(`/diagnostics/step/${id}`),
}
