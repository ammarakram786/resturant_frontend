<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <UCard class="w-full max-w-xl">
      <div class="space-y-4 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-50 text-error-600">
            <UIcon name="i-lucide-triangle-alert" class="h-6 w-6" />
          </div>
          <div>
            <p class="text-sm text-muted">
              Application error
            </p>
            <h1 class="text-xl font-semibold text-highlighted">
              {{ error.statusCode ?? 500 }} {{ error.statusMessage ?? 'Unexpected failure' }}
            </h1>
          </div>
        </div>

        <p class="text-sm text-muted">
          Shared error handling is centralized early so later API slices can map canonical backend errors into consistent UI affordances.
        </p>

        <UButton color="primary" @click="handleError">
          Return to customer home
        </UButton>
      </div>
    </UCard>
  </div>
</template>
