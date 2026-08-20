import type { AppLocale } from '~~/shared/types/domain'

const supportedLocales: AppLocale[] = ['en', 'ur']

export function useAppLocale() {
  const config = useRuntimeConfig()
  const localeCookie = useCookie<AppLocale>('resturant-locale', {
    default: () => (config.public.defaultLocale as AppLocale) ?? 'en',
  })
  const locale = useState<AppLocale>('app-locale', () => localeCookie.value)

  const setLocale = (value: AppLocale) => {
    if (!supportedLocales.includes(value)) {
      return
    }

    locale.value = value
    localeCookie.value = value
  }

  const isRtl = computed(() => locale.value === 'ur')
  const timezone = computed(() => config.public.timezone)
  const currency = computed(() => config.public.currency)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale.value === 'ur' ? 'ur-PK' : 'en-PK', {
      style: 'currency',
      currency: currency.value,
      maximumFractionDigits: 0,
    }).format(amount)

  return {
    supportedLocales,
    locale,
    isRtl,
    timezone,
    currency,
    setLocale,
    formatCurrency,
  }
}
