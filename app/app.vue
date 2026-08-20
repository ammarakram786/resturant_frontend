<script setup lang="ts">
import { useAppLocale } from './composables/useAppLocale'

const config = useRuntimeConfig()
const { locale, isRtl } = useAppLocale()

useHead(() => ({
  titleTemplate: (titleChunk) =>
    titleChunk ? `${titleChunk} | ${config.public.appName}` : String(config.public.appName),
  htmlAttrs: {
    lang: locale.value,
    dir: isRtl.value ? 'rtl' : 'ltr',
  },
  bodyAttrs: {
    class: 'min-h-screen bg-gray-50 text-gray-950 antialiased',
  },
}))
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="var(--ui-primary)" />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
