<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon?: string
}>()
</script>

<template>
  <UCard class="rounded-3xl border-dashed">
    <div class="flex flex-col items-start gap-4 py-6">
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
        <UIcon :name="icon ?? 'i-lucide-sparkles'" class="h-6 w-6 text-neutral-500" />
      </div>

      <div class="space-y-2">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ title }}
        </h2>
        <p class="max-w-2xl text-sm text-muted">
          {{ description }}
        </p>
      </div>

      <slot />
    </div>
  </UCard>
</template>
