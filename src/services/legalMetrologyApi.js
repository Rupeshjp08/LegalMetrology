import apiClient from './apiClient'

/**
 * Domain service for the Legal Metrology compliance domain.
 *
 * Endpoints are illustrative placeholders for the upcoming backend.
 * They are intentionally not exercised by the current UI shell.
 */
export const legalMetrologyApi = {
  getManufacturers: () => apiClient.get('/manufacturers'),
  getInspections: () => apiClient.get('/inspections'),
  getProducts: () => apiClient.get('/packaged-products'),
  submitInspection: (payload) => apiClient.post('/inspections', payload),
  submitComplaint: (payload) => apiClient.post('/complaints', payload),
}