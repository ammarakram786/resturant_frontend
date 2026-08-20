<script setup lang="ts">
import { surfaceConfigs } from '~~/shared/config/surfaces'
import type { SurfaceKind } from '~~/shared/types/domain'

const props = defineProps<{
  surface: SurfaceKind
}>()

const surfaceConfig = computed(() => surfaceConfigs[props.surface])
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
      <AppSurfaceSidebar :surface="surface" />

      <div class="flex min-h-screen flex-col">
        <AppSurfaceHeader :surface="surfaceConfig" />

        <main class="flex-1 px-4 py-6 lg:px-6">
          <div class="mx-auto w-full max-w-7xl">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
