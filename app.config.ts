export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      secondary: 'indigo',
      neutral: 'slate',
    },
    icons: {
      chevronDown: 'i-lucide-chevron-down',
      check: 'i-lucide-check',
      close: 'i-lucide-x',
    },
    button: {
      slots: {
        base: 'font-medium transition-all duration-200 cursor-pointer active:scale-[0.98]',
      },
    },
    card: {
      slots: {
        root: 'rounded-2xl border border-white/10 dark:border-white/10 bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl transition-all duration-200',
        header: 'px-5 py-4 border-b border-white/5 dark:border-white/5 font-semibold text-slate-100',
        body: 'p-5 text-slate-300',
        footer: 'px-5 py-4 border-t border-white/5 dark:border-white/5 bg-slate-950/40 rounded-b-2xl',
      },
    },
    badge: {
      slots: {
        base: 'font-semibold tracking-wide rounded-full px-2.5 py-0.5 text-xs',
      },
    },
    navigationMenu: {
      slots: {
        root: 'w-full',
        list: 'gap-1.5',
        link: 'rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 text-slate-300 hover:text-white hover:bg-slate-800/60 data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-400 data-[active=true]:border-l-2 data-[active=true]:border-amber-500',
      },
    },
    input: {
      slots: {
        root: 'w-full',
        base: 'rounded-xl bg-slate-950/60 border border-white/10 focus:border-amber-500 text-white placeholder-slate-500 px-4 py-2.5 text-sm transition-all',
      },
    },
    table: {
      slots: {
        root: 'w-full border-collapse text-left text-sm',
        th: 'border-b border-white/10 bg-slate-950/60 px-4 py-3.5 font-semibold text-slate-300 text-xs uppercase tracking-wider',
        td: 'border-b border-white/5 px-4 py-3.5 text-slate-200 font-normal',
        tr: 'hover:bg-slate-800/40 transition-colors',
      },
    },
    modal: {
      slots: {
        content: 'bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden',
      },
    },
  },
})
