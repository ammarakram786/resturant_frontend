export function useAdminFormat() {
  const formatDate = (value?: string | null) => {
    if (!value) {
      return 'N/A'
    }

    return new Intl.DateTimeFormat('en-PK', {
      dateStyle: 'medium',
    }).format(new Date(value))
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return 'N/A'
    }

    return new Intl.DateTimeFormat('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  const formatCurrency = (value?: string | number | null) => {
    const numericValue = typeof value === 'number' ? value : Number(value ?? 0)

    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 2,
    }).format(Number.isFinite(numericValue) ? numericValue : 0)
  }

  const statusColor = (status?: string | null) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'paid':
      case 'completed':
      case 'confirmed':
      case 'success':
      case 'open':
        return 'success'
      case 'pending':
      case 'pending_approval':
      case 'submitted':
      case 'issued':
      case 'draft':
      case 'waitlisted':
      case 'modification_pending':
      case 'warning':
        return 'warning'
      case 'rejected':
      case 'suspended':
      case 'cancelled':
      case 'no_show':
      case 'overdue':
      case 'failed':
      case 'error':
        return 'error'
      default:
        return 'neutral'
    }
  }

  return {
    formatCurrency,
    formatDate,
    formatDateTime,
    statusColor,
  }
}
