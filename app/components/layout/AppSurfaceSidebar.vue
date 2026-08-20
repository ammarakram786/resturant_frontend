<script setup lang="ts">
import type { SurfaceKind } from '~~/shared/types/domain'
import { useSurfaceNav } from '../../composables/useSurfaceNav'

const props = defineProps<{
  surface: SurfaceKind
}>()

const route = useRoute()
const { items } = useSurfaceNav(props.surface)
</script>

<template>
  <aside class="flex h-full flex-col gap-6 border-r border-white/10 bg-slate-950/90 px-4 py-5 lg:px-5 backdrop-blur-md">
    <BrandMark />

    <UNavigationMenu
      orientation="vertical"
      highlight
      highlight-color="primary"
      :items="items"
      class="data-[orientation=vertical]:w-full mt-2"
    />

    <div class="mt-auto rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm">
      <div class="flex items-center gap-2 mb-2">
        <UIcon name="i-lucide-shield-check" class="h-4 w-4 text-amber-400" />
        <p class="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          Platform Mode
        </p>
      </div>

      <ul class="space-y-1.5 text-xs text-slate-400">
        <li class="flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Nuxt 4 SPA + Dual Auth
        </li>
        <li class="flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Enriched DRF OpenAPI
        </li>
        <li class="flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          Multi-Tenant Surfaces
        </li>
      </ul>
    </div>
  </aside>
</template>
