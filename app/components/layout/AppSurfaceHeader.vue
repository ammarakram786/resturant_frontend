<script setup lang="ts">
import type { SurfaceConfig } from '~~/shared/config/surfaces'
import type { AppLocale } from '~~/shared/types/domain'
import { useAppLocale } from '../../composables/useAppLocale'
import { useAuthStore } from '../../stores/auth'
import { useAuth } from '../../composables/useAuth'

const props = defineProps<{
  surface: SurfaceConfig
}>()

const colorMode = useColorMode()
const { locale, supportedLocales, setLocale, timezone } = useAppLocale()
const authStore = useAuthStore()
const { logout } = useAuth()
const router = useRouter()

const localeOptions = supportedLocales.map((value: AppLocale) => ({
  label: value.toUpperCase(),
  value,
}))

const surfaceBadgeColor = computed(() => props.surface.accent)

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>

<template>
  <header class="flex flex-col gap-4 border-b border-white/10 bg-slate-900/80 px-4 py-4 backdrop-blur-md lg:px-6 sticky top-0 z-30 shadow-md">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <UBadge :color="surfaceBadgeColor" variant="soft" class="shadow-sm">
            {{ surface.shortTitle }}
          </UBadge>
          <span class="text-xs font-mono text-slate-400 flex items-center gap-1">
            <UIcon name="i-lucide-globe" class="w-3.5 h-3.5" />
            {{ timezone }}
          </span>
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white">
            {{ surface.title }}
          </h1>
          <p class="text-xs text-slate-400">
            {{ surface.description }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Portal Quick Switcher -->
        <div class="hidden md:flex items-center bg-slate-950/80 border border-white/10 rounded-xl p-1 gap-1">
          <NuxtLink
            to="/discover"
            class="px-2.5 py-1 text-xs font-medium rounded-lg transition-colors"
            :class="surface.kind === 'customer' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'"
          >
            Customer
          </NuxtLink>
          <NuxtLink
            to="/partner"
            class="px-2.5 py-1 text-xs font-medium rounded-lg transition-colors"
            :class="surface.kind === 'partner' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'"
          >
            Partner
          </NuxtLink>

          <NuxtLink
            to="/admin"
            class="px-2.5 py-1 text-xs font-medium rounded-lg transition-colors"
            :class="surface.kind === 'admin' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-white'"
          >
            Admin
          </NuxtLink>
        </div>

        <!-- Language Selector -->
        <USelect
          :model-value="locale"
          :items="localeOptions"
          value-key="value"
          class="w-24"
          @update:model-value="setLocale($event)"
        />

        <!-- Dark/Light Mode Toggle -->
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
          @click="toggleColorMode"
        />

        <!-- User Profile or Login CTA -->
        <template if="authStore.isAuthenticated">
          <div class="flex items-center gap-2 border-l border-white/10 pl-3">
            <div class="flex flex-col text-right hidden sm:flex">
              <span class="text-xs font-semibold text-white truncate max-w-[120px]">
                {{ authStore.user?.name || 'User' }}
              </span>
              <span class="text-[10px] text-amber-400 uppercase tracking-wider font-mono">
                {{ authStore.userRole }}
              </span>
            </div>
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-log-out"
              label="Sign out"
              @click="handleLogout"
            />
          </div>
        </template>
        <template v-else>
          <NuxtLink to="/login">
            <UButton
              color="primary"
              variant="solid"
              size="sm"
              icon="i-lucide-log-in"
              label="Sign In"
            />
          </NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>
