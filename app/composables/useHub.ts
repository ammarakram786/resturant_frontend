import type { ApiPaginationMeta, ApiSuccessEnvelope } from '~~/shared/types/api'
import type {
  HubAuditEvent,
  HubAuditEventPayload,
  HubInvoice,
  HubInvoicePayload,
  HubModule,
  HubModulePayload,
  HubRole,
  HubRolePayload,
  HubTenant,
  HubTenantPayload,
  HubUser,
  HubUserPayload,
} from '~~/shared/types/hub'
import { useApi } from './useApi'

type EnvelopeWithMeta<T> = ApiSuccessEnvelope<T, ApiPaginationMeta & Record<string, unknown>>

type HubQuery = Record<string, string | number | boolean | undefined>

export function useHub() {
  const api = useApi()

  const paged = async <T>(path: string, query: HubQuery, defaultMessage: string) => {
    const response = await api.requestEnvelope<T[]>(path, {
      method: 'GET',
      query,
      defaultMessage,
    }) as EnvelopeWithMeta<T[]>
    return {
      items: response.data ?? [],
      meta: response.meta,
    }
  }

  // Tenants -------------------------------------------------------------
  const listTenants = async (query: HubQuery = {}) =>
    paged<HubTenant>('/hub/hub/tenants', query, 'Unable to load tenants.')

  const getTenant = (id: number) =>
    api.get<HubTenant>(`/hub/hub/tenants/${id}`, {
      defaultMessage: 'Unable to load this tenant.',
    })

  const createTenant = (payload: HubTenantPayload) =>
    api.post<HubTenant>('/hub/hub/tenants', {
      body: payload,
      defaultMessage: 'Unable to create the tenant.',
    })

  const updateTenant = (id: number, payload: Partial<HubTenantPayload>) =>
    api.patch<HubTenant>(`/hub/hub/tenants/${id}`, {
      body: payload,
      defaultMessage: 'Unable to update the tenant.',
    })

  const deleteTenant = (id: number) =>
    api.delete<null>(`/hub/hub/tenants/${id}`, {
      defaultMessage: 'Unable to delete the tenant.',
    })

  // Users ---------------------------------------------------------------
  const listUsers = async (query: HubQuery = {}) =>
    paged<HubUser>('/hub/hub/users', query, 'Unable to load hub users.')

  const getHubUser = (id: number) =>
    api.get<HubUser>(`/hub/hub/users/${id}`, {
      defaultMessage: 'Unable to load this user.',
    })

  const createHubUser = (payload: HubUserPayload) =>
    api.post<HubUser>('/hub/hub/users', {
      body: payload,
      defaultMessage: 'Unable to create the user.',
    })

  const updateHubUser = (id: number, payload: Partial<HubUserPayload>) =>
    api.patch<HubUser>(`/hub/hub/users/${id}`, {
      body: payload,
      defaultMessage: 'Unable to update the user.',
    })

  const deleteHubUser = (id: number) =>
    api.delete<null>(`/hub/hub/users/${id}`, {
      defaultMessage: 'Unable to delete the user.',
    })

  // Roles ---------------------------------------------------------------
  const listRoles = async (query: HubQuery = {}) =>
    paged<HubRole>('/hub/hub/roles', query, 'Unable to load roles.')

  const getRole = (id: number) =>
    api.get<HubRole>(`/hub/hub/roles/${id}`, {
      defaultMessage: 'Unable to load this role.',
    })

  const createRole = (payload: HubRolePayload) =>
    api.post<HubRole>('/hub/hub/roles', {
      body: payload,
      defaultMessage: 'Unable to create the role.',
    })

  const updateRole = (id: number, payload: Partial<HubRolePayload>) =>
    api.patch<HubRole>(`/hub/hub/roles/${id}`, {
      body: payload,
      defaultMessage: 'Unable to update the role.',
    })

  const deleteRole = (id: number) =>
    api.delete<null>(`/hub/hub/roles/${id}`, {
      defaultMessage: 'Unable to delete the role.',
    })

  // Modules -------------------------------------------------------------
  const listModules = async (query: HubQuery = {}) =>
    paged<HubModule>('/hub/hub/modules', query, 'Unable to load modules.')

  const getModule = (id: number) =>
    api.get<HubModule>(`/hub/hub/modules/${id}`, {
      defaultMessage: 'Unable to load this module.',
    })

  const createModule = (payload: HubModulePayload) =>
    api.post<HubModule>('/hub/hub/modules', {
      body: payload,
      defaultMessage: 'Unable to create the module.',
    })

  const updateModule = (id: number, payload: Partial<HubModulePayload>) =>
    api.patch<HubModule>(`/hub/hub/modules/${id}`, {
      body: payload,
      defaultMessage: 'Unable to update the module.',
    })

  const deleteModule = (id: number) =>
    api.delete<null>(`/hub/hub/modules/${id}`, {
      defaultMessage: 'Unable to delete the module.',
    })

  // Billing ---------------------------------------------------------------
  const listInvoices = async (query: HubQuery = {}) =>
    paged<HubInvoice>('/hub/hub/billing', query, 'Unable to load invoices.')

  const getInvoice = (id: number) =>
    api.get<HubInvoice>(`/hub/hub/billing/${id}`, {
      defaultMessage: 'Unable to load this invoice.',
    })

  const createInvoice = (payload: HubInvoicePayload) =>
    api.post<HubInvoice>('/hub/hub/billing', {
      body: payload,
      defaultMessage: 'Unable to create the invoice.',
    })

  const updateInvoice = (id: number, payload: Partial<HubInvoicePayload>) =>
    api.patch<HubInvoice>(`/hub/hub/billing/${id}`, {
      body: payload,
      defaultMessage: 'Unable to update the invoice.',
    })

  const deleteInvoice = (id: number) =>
    api.delete<null>(`/hub/hub/billing/${id}`, {
      defaultMessage: 'Unable to delete the invoice.',
    })

  // Audit logs ------------------------------------------------------------
  const listAuditEvents = async (query: HubQuery = {}) =>
    paged<HubAuditEvent>('/hub/hub/audit-logs', query, 'Unable to load audit logs.')

  const getAuditEvent = (id: number) =>
    api.get<HubAuditEvent>(`/hub/hub/audit-logs/${id}`, {
      defaultMessage: 'Unable to load this audit event.',
    })

  const createAuditEvent = (payload: HubAuditEventPayload) =>
    api.post<HubAuditEvent>('/hub/hub/audit-logs', {
      body: payload,
      defaultMessage: 'Unable to record the audit event.',
    })

  const updateAuditEvent = (id: number, payload: Partial<HubAuditEventPayload>) =>
    api.patch<HubAuditEvent>(`/hub/hub/audit-logs/${id}`, {
      body: payload,
      defaultMessage: 'Unable to update the audit event.',
    })

  const deleteAuditEvent = (id: number) =>
    api.delete<null>(`/hub/hub/audit-logs/${id}`, {
      defaultMessage: 'Unable to delete the audit event.',
    })

  return {
    listTenants,
    getTenant,
    createTenant,
    updateTenant,
    deleteTenant,
    listUsers,
    getHubUser,
    createHubUser,
    updateHubUser,
    deleteHubUser,
    listRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    listModules,
    getModule,
    createModule,
    updateModule,
    deleteModule,
    listInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    listAuditEvents,
    getAuditEvent,
    createAuditEvent,
    updateAuditEvent,
    deleteAuditEvent,
  }
}
