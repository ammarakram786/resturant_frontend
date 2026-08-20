import { ApiClientError } from '~~/shared/types/api'
import type { ApiEnvelope } from '~~/shared/types/api'
import { useAppLocale } from './useAppLocale'
import { useAuthStore } from '../stores/auth'

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type RequestOptions<T> = {
  body?: BodyInit | Record<string, unknown> | null
  query?: Record<string, string | number | boolean | undefined>
  headers?: HeadersInit
  method?: RequestMethod
  defaultMessage?: string
  transform?: (envelope: ApiEnvelope<T>) => T
}

export function useApi() {
  const config = useRuntimeConfig()
  const { locale } = useAppLocale()
  const authStore = useAuthStore()

  const client = $fetch.create({
    baseURL: `${config.public.apiBaseUrl}${config.public.apiPrefix}`,
    credentials: 'include',
    onRequest({ options }) {
      const cookieHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {}
      const requestHeaders = new Headers(options.headers as HeadersInit | undefined)

      requestHeaders.set('accept-language', locale.value)
      requestHeaders.set('x-client-surface', 'nuxt-web')

      if (cookieHeaders.cookie) {
        requestHeaders.set('cookie', cookieHeaders.cookie)
      }

      // Attach Authorization Bearer token if available
      const atCookie = useCookie('_at')
      const token = authStore.accessToken || atCookie.value
      if (token && !requestHeaders.has('authorization')) {
        requestHeaders.set('authorization', `Bearer ${token}`)
      }

      options.headers = requestHeaders
    },
  })

  const normalizeError = (error: unknown, defaultMessage: string) => {
    const fallback = new ApiClientError({
      message: defaultMessage,
      code: 'SERVER_ERROR',
    })

    if (!(error && typeof error === 'object')) {
      return fallback
    }

    const maybeError = error as {
      statusCode?: number
      data?: Partial<ApiEnvelope<unknown>>
      message?: string
    }

    if (maybeError.data && maybeError.data.success === false) {
      return new ApiClientError({
        message: maybeError.data.message || defaultMessage,
        code: maybeError.data.code,
        statusCode: maybeError.statusCode,
        errors: maybeError.data.errors,
        phase: maybeError.data.phase,
      })
    }

    return new ApiClientError({
      message: maybeError.message || defaultMessage,
      statusCode: maybeError.statusCode,
    })
  }

  const request = async <T>(path: string, options: RequestOptions<T> = {}) => {
    const {
      defaultMessage = 'Unable to complete request.',
      transform,
      ...fetchOptions
    } = options

    try {
      const envelope = await client<ApiEnvelope<T>>(path, fetchOptions as never)

      if (!envelope.success) {
        throw new ApiClientError({
          message: envelope.message,
          code: envelope.code,
          errors: envelope.errors,
          phase: envelope.phase,
        })
      }

      return transform ? transform(envelope) : envelope.data
    }
    catch (error) {
      throw normalizeError(error, defaultMessage)
    }
  }

  const requestEnvelope = <T>(path: string, options: RequestOptions<T> = {}) => {
    const { defaultMessage: _defaultMessage, transform: _transform, ...fetchOptions } = options
    return client<ApiEnvelope<T>>(path, fetchOptions as never)
  }

  return {
    request,
    requestEnvelope,
    get: <T>(path: string, options?: RequestOptions<T>) =>
      request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, options?: RequestOptions<T>) =>
      request<T>(path, { ...options, method: 'POST' }),
    patch: <T>(path: string, options?: RequestOptions<T>) =>
      request<T>(path, { ...options, method: 'PATCH' }),
    put: <T>(path: string, options?: RequestOptions<T>) =>
      request<T>(path, { ...options, method: 'PUT' }),
    delete: <T>(path: string, options?: RequestOptions<T>) =>
      request<T>(path, { ...options, method: 'DELETE' }),
  }
}
