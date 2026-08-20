<template>
  <div class="flex items-center gap-3 group">
    <div class="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30 transition-transform duration-300 group-hover:scale-105">
      <UIcon name="i-lucide-utensils-crossed" class="h-6 w-6 text-slate-950" />
      <div class="absolute -inset-0.5 rounded-2xl bg-amber-400 opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />
    </div>
    <div>
      <p class="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
        <span>Resturant</span>
        <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">v4</span>
      </p>
      <p class="text-xs text-slate-400 font-medium">
        Reserve & Dining Platform
      </p>
    </div>
  </div>
</template>
