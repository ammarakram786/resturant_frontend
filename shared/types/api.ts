export type ApiSuccessEnvelope<TData, TMeta = Record<string, unknown>> = {
  success: true
  message: string
  data: TData
  meta: TMeta
}

export type ApiErrorEnvelope = {
  success: false
  message: string
  errors: Record<string, string[]>
  code: string
  phase?: string
  data?: Record<string, unknown>
}

export type ApiEnvelope<TData, TMeta = Record<string, unknown>> =
  | ApiSuccessEnvelope<TData, TMeta>
  | ApiErrorEnvelope

export type ApiPaginationMeta = {
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
  filters?: Record<string, unknown>
}

export class ApiClientError extends Error {
  code: string
  statusCode?: number
  errors: Record<string, string[]>
  phase?: string

  constructor(input: {
    message: string
    code?: string
    statusCode?: number
    errors?: Record<string, string[]>
    phase?: string
  }) {
    super(input.message)
    this.name = 'ApiClientError'
    this.code = input.code ?? 'SERVER_ERROR'
    this.statusCode = input.statusCode
    this.errors = input.errors ?? {}
    this.phase = input.phase
  }
}
