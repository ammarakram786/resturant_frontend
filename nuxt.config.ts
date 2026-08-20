export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  future: {
    compatibilityVersion: 4,
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000',
      apiPrefix: process.env.NUXT_PUBLIC_API_PREFIX ?? '/api/v1',
      appName: 'Resturant',
      defaultLocale: 'en',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
    },
  },
  routeRules: {
    '/partner/**': { ssr: true },
    '/admin/**': { ssr: true },
  },
  typescript: {
    strict: true,
    // Keep typechecking as an explicit CI/sign-off step; build-time vue-tsc
    // invocation is redundant and breaks in Windows workspaces with spaces.
    typeCheck: false,
  },
})
