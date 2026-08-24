<script setup lang="ts">
import type { HubBillingStatus, HubInvoice, HubInvoicePayload } from '~~/shared/types/hub'

definePageMeta({
  layout: 'hub',
  middleware: 'surface',
  surface: 'hub',
})

useSeoMeta({
  title: 'Platform Billing & Invoicing',
  description: 'Issue, track, and settle restaurant invoices platform-wide.',
})

const hub = useHub()
const toast = useToast()

const status = ref('')
const page = ref(1)

const query = computed(() => ({
  status: status.value || undefined,
  page: page.value,
}))

const { data, pending, error, refresh } = await useAsyncData(
  'hub-billing',
  () => hub.listInvoices(query.value).catch(() => ({ items: [] as HubInvoice[], meta: {} as Record<string, unknown> })),
  { watch: [query] },
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => (data.value?.meta?.pagination as { total?: number } | undefined)?.total ?? items.value.length)

const statuses: HubBillingStatus[] = ['draft', 'issued', 'paid', 'overdue']

const showModal = ref(false)
const editing = ref<HubInvoice | null>(null)
const busy = ref(false)
const form = reactive<HubInvoicePayload>({
  invoice_number: '',
  restaurant: 0,
  billing_period_start: '',
  billing_period_end: '',
  subtotal: '',
  adjustments: '',
  total: '',
})

const openCreate = () => {
  editing.value = null
  Object.assign(form, {
    invoice_number: `INV-${new Date().getFullYear()}-`,
    restaurant: 0,
    billing_period_start: '',
    billing_period_end: '',
    subtotal: '',
    adjustments: '',
    total: '',
  })
  showModal.value = true
}

const submit = async () => {
  busy.value = true
  try {
    const payload = {
      ...form,
      restaurant: Number(form.restaurant),
      subtotal: form.subtotal || undefined,
      adjustments: form.adjustments || undefined,
      total: form.total || undefined,
    }
    if (editing.value) {
      await hub.updateInvoice(editing.value.id, payload)
      toast.add({ title: 'Invoice updated', description: form.invoice_number, color: 'success' })
    }
    else {
      await hub.createInvoice(payload)
      toast.add({ title: 'Invoice created', description: form.invoice_number, color: 'success' })
    }
    showModal.value = false
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Save failed',
      description: err instanceof Error ? err.message : 'Unable to save the invoice.',
      color: 'error',
    })
  }
  finally {
    busy.value = false
  }
}

const setInvoiceStatus = async (invoice: HubInvoice, next: HubBillingStatus) => {
  try {
    await hub.updateInvoice(invoice.id, { status: next })
    toast.add({ title: 'Status updated', description: `${invoice.invoice_number} → ${next}`, color: 'success' })
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Update failed',
      description: err instanceof Error ? err.message : 'Unable to update the invoice.',
      color: 'error',
    })
  }
}

const remove = async (invoice: HubInvoice) => {
  busy.value = true
  try {
    await hub.deleteInvoice(invoice.id)
    toast.add({ title: 'Invoice deleted', description: invoice.invoice_number, color: 'success' })
    await refresh()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Delete failed',
      description: err instanceof Error ? err.message : 'Unable to delete the invoice.',
      color: 'error',
    })
  }
  finally {
    busy.value = false
  }
}

const statusTone = (value?: string) =>
  value === 'paid'
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : value === 'issued'
      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      : value === 'overdue'
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
</script>

<template>
  <div class="space-y-6 pb-12">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Billing & Invoices</span>
          <UBadge color="secondary" variant="soft" class="font-mono text-xs">{{ total }}</UBadge>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">Restaurant subscription invoices across the platform</p>
      </div>

      <div class="flex gap-2">
        <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-refresh-cw" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
        <UButton color="secondary" size="sm" icon="i-lucide-plus" @click="openCreate()">
          New Invoice
        </UButton>
      </div>
    </div>

    <div class="glass-card rounded-2xl p-4 border border-white/10 max-w-xs">
      <select v-model="status" class="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option value="">All Statuses</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <UAlert v-if="error" color="error" variant="soft" title="Unable to load invoices" :description="error.message" />

    <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-950/80 border-b border-white/10">
            <tr>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Invoice</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Restaurant</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Period</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Total</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]">Status</th>
              <th class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-if="pending">
              <td colspan="6" class="px-4 py-8 text-center text-slate-400 animate-pulse">Loading invoices...</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="6" class="px-4 py-12 text-center text-slate-400">
                <UIcon name="i-lucide-receipt-text" class="h-8 w-8 mx-auto text-slate-500 mb-2" />
                <p class="font-bold text-white">No invoices found</p>
                <p class="text-[11px]">Adjust the filter or issue a new invoice.</p>
              </td>
            </tr>
            <tr v-for="invoice in items" :key="invoice.id" class="hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3.5 font-mono font-bold text-white">{{ invoice.invoice_number }}</td>
              <td class="px-4 py-3.5 text-slate-300">{{ invoice.restaurant_name }}</td>
              <td class="px-4 py-3.5 text-slate-300 font-mono text-[11px]">
                {{ invoice.billing_period_start }} → {{ invoice.billing_period_end }}
              </td>
              <td class="px-4 py-3.5 font-bold font-mono text-amber-400">{{ invoice.total || '—' }}</td>
              <td class="px-4 py-3.5">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold border uppercase" :class="statusTone(invoice.status)">
                  {{ invoice.status || 'draft' }}
                </span>
              </td>
              <td class="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                <UButton
                  v-if="invoice.status !== 'issued' && invoice.status !== 'paid'"
                  color="secondary"
                  variant="soft"
                  size="xs"
                  @click="setInvoiceStatus(invoice, 'issued')"
                >
                  Issue
                </UButton>
                <UButton
                  v-if="invoice.status !== 'paid'"
                  color="success"
                  variant="soft"
                  size="xs"
                  icon="i-lucide-check"
                  @click="setInvoiceStatus(invoice, 'paid')"
                >
                  Mark Paid
                </UButton>
                <UButton
                  v-else
                  color="warning"
                  variant="soft"
                  size="xs"
                  icon="i-lucide-clock-alert"
                  @click="setInvoiceStatus(invoice, 'overdue')"
                >
                  Overdue
                </UButton>
                <UButton color="error" variant="ghost" size="xs" icon="i-lucide-trash-2" @click="remove(invoice)">
                  Delete
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UModal v-model:open="showModal" title="New Invoice">
      <template #body>
        <form class="grid gap-3" @submit.prevent="submit">
          <div class="grid grid-cols-2 gap-3">
            <label class="text-xs text-slate-300 space-y-1">
              <span>Invoice Number *</span>
              <input v-model="form.invoice_number" required class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
            <label class="text-xs text-slate-300 space-y-1">
              <span>Restaurant ID *</span>
              <input v-model.number="form.restaurant" type="number" min="1" required class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="text-xs text-slate-300 space-y-1">
              <span>Period Start *</span>
              <input v-model="form.billing_period_start" type="date" required class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
            <label class="text-xs text-slate-300 space-y-1">
              <span>Period End *</span>
              <input v-model="form.billing_period_end" type="date" required class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <label class="text-xs text-slate-300 space-y-1">
              <span>Subtotal</span>
              <input v-model="form.subtotal" placeholder="0.00" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
            <label class="text-xs text-slate-300 space-y-1">
              <span>Adjustments</span>
              <input v-model="form.adjustments" placeholder="0.00" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
            <label class="text-xs text-slate-300 space-y-1">
              <span>Total</span>
              <input v-model="form.total" placeholder="0.00" class="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </label>
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" size="sm" @click="showModal = false">
            Cancel
          </UButton>
          <UButton color="secondary" size="sm" :loading="busy" @click="submit">
            Create Invoice
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
