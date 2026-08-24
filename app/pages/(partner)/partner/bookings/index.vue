<script setup lang="ts">
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  FlexRender,
} from '@tanstack/vue-table'
import type { OperatorBookingRecord } from '~~/shared/types/domain'
import { usePartner, type PartnerBookingAction } from '../../../../composables/usePartner'

definePageMeta({
  layout: 'partner',
  middleware: 'surface',
  surface: 'partner',
})

useSeoMeta({
  title: 'Reservation Data Grid',
  description: 'Manage operator table reservations, execute status transitions, and audit guest trust.',
})

const partner = usePartner()
const toast = useToast()

const statusFilter = ref('')
const globalFilter = ref('')
const actionBusy = ref<string | null>(null)
const modificationModal = ref<OperatorBookingRecord | null>(null)

const formatChange = (value: Record<string, unknown> | undefined) => {
  if (!value) return []
  return Object.entries(value).map(([key, val]) => ({ key, value: String(val) }))
}

const { data: bookingResponse, pending, refresh } = await useAsyncData(
  'partner-bookings-grid',
  () => partner.listBookings(statusFilter.value),
  {
    default: () => ({ items: [], meta: {} }),
  },
)

const bookings = computed<OperatorBookingRecord[]>(() => bookingResponse.value?.items ?? [])

watch(statusFilter, () => {
  refresh()
})

// TanStack Table Column Definitions
const columnHelper = createColumnHelper<OperatorBookingRecord>()

const columns = [
  columnHelper.accessor('code', {
    header: 'Ref Code',
    cell: (info) => h('span', { class: 'font-mono text-amber-400 font-bold' }, info.getValue()),
  }),

  columnHelper.accessor('customer.name', {
    header: 'Customer',
    cell: (info) => {
      const row = info.row.original
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-semibold text-white' }, info.getValue() || 'Guest'),
        h('span', { class: 'text-[11px] text-slate-400 font-mono' }, row.customer?.masked_phone || row.customer?.masked_email || 'Masked'),
      ])
    },
  }),

  columnHelper.accessor('starts_at', {
    header: 'Date & Time',
    cell: (info) => {
      const val = info.getValue()
      return h('span', { class: 'text-xs text-slate-300 font-mono' }, new Date(val).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }))
    },
  }),

  columnHelper.accessor('people', {
    header: 'Guests',
    cell: (info) => h('span', { class: 'font-bold text-amber-400 font-mono' }, `${info.getValue()} pax`),
  }),

  columnHelper.accessor('dining_area', {
    header: 'Section',
    cell: (info) => h('span', { class: 'text-xs text-slate-300' }, info.getValue() || 'Main Hall'),
  }),

  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const st = info.getValue()
      const row = info.row.original
      const colorClass = st === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : st === 'waitlisted' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        : st === 'modification_pending' ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'
        : st === 'seated' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
        : st === 'cancelled' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        : 'bg-slate-800 text-slate-300 border-white/10'

      const children = [
        h('span', {
          class: `px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`,
        }, st.replace('_', ' ')),
      ]

      if (row.modification_request) {
        children.push(h('button', {
          class: 'text-[10px] font-mono text-fuchsia-300 underline decoration-dotted hover:text-fuchsia-200',
          title: JSON.stringify(row.modification_request.requested_payload ?? {}),
          onClick: () => modificationModal.value = row,
        }, `view change #${row.modification_request.id}`))
      }

      return h('div', { class: 'flex flex-col gap-1 items-start' }, children)
    },
  }),

  columnHelper.display({
    id: 'actions',
    header: 'Quick Action',
    cell: (info) => {
      const row = info.row.original
      const st = row.status

      if (st === 'pending') {
        return h('div', { class: 'flex gap-1.5' }, [
          h('button', {
            class: 'px-2 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded hover:bg-amber-400 transition-colors',
            onClick: () => executeAction(row.id, 'accept'),
          }, 'Accept'),
          h('button', {
            class: 'px-2 py-1 bg-rose-500/20 text-rose-300 text-xs font-bold rounded hover:bg-rose-500/30 transition-colors',
            onClick: () => executeAction(row.id, 'reject'),
          }, 'Reject'),
        ])
      }
      else if (st === 'modification_pending' && row.modification_request) {
        return h('div', { class: 'flex gap-1.5' }, [
          h('button', {
            class: 'px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded hover:bg-emerald-500/30 transition-colors',
            onClick: () => decideModification(row, 'approve'),
          }, 'Approve Change'),
          h('button', {
            class: 'px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold rounded hover:bg-rose-500/30 transition-colors',
            onClick: () => decideModification(row, 'reject'),
          }, 'Reject Change'),
        ])
      }
      else if (st === 'confirmed') {
        return h('button', {
          class: 'px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-lg hover:bg-indigo-500/30 transition-colors',
          onClick: () => executeAction(row.id, 'table-ready'),
        }, 'Table Ready')
      }
      else if (st === 'table_ready' || st === 'arrived') {
        return h('button', {
          class: 'px-2.5 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors',
          onClick: () => executeAction(row.id, 'seated'),
        }, 'Seat Guest')
      }
      else if (st === 'seated') {
        return h('button', {
          class: 'px-2.5 py-1 bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors',
          onClick: () => executeAction(row.id, 'completed'),
        }, 'Complete')
      }

      return h('span', { class: 'text-xs text-slate-500' }, 'No actions')
    },
  }),
]

const table = useVueTable({
  get data() { return bookings.value },
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    get globalFilter() { return globalFilter.value },
  },
  onGlobalFilterChange: (val) => {
    globalFilter.value = typeof val === 'function' ? val(globalFilter.value) : val
  },
})

const executeAction = async (bookingId: number, action: PartnerBookingAction | 'status') => {
  actionBusy.value = `${bookingId}-${action}`
  try {
    await partner.transitionBooking(bookingId, action as PartnerBookingAction)
    toast.add({
      title: 'Status Transition Successful',
      description: `Action "${action}" executed on booking #${bookingId}`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
    await refresh()
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Action failed'
    toast.add({
      title: 'Action Failed',
      description: message,
      color: 'error',
    })
  }
  finally {
    actionBusy.value = null
  }
}

const decideModification = async (booking: OperatorBookingRecord, decision: 'approve' | 'reject') => {
  if (!booking.modification_request) return
  actionBusy.value = `${booking.id}-mod-${decision}`
  try {
    await partner.decideBookingModification(booking.modification_request.id, decision)
    toast.add({
      title: decision === 'approve' ? 'Modification Approved' : 'Modification Rejected',
      description: `Booking #${booking.id} (${booking.code}) modification was ${decision}d.`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
    await refresh()
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : `Unable to ${decision} the modification`
    toast.add({
      title: 'Action Failed',
      description: message,
      color: 'error',
    })
  }
  finally {
    actionBusy.value = null
  }
}
</script>

<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Reservation Data Grid</span>
          <UBadge color="primary" variant="soft" class="font-mono text-xs">TanStack Table</UBadge>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400">
          Heavy operational grid with real-time FSM status transitions & filtering
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-refresh-cw"
          :loading="pending"
          @click="refresh()"
        >
          Refresh Grid
        </UButton>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="glass-card rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Status Filter Select -->
        <select
          v-model="statusFilter"
          class="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="modification_pending">Modification Pending</option>
          <option value="waitlisted">Waitlisted</option>
          <option value="table_ready">Table Ready</option>
          <option value="arrived">Arrived</option>
          <option value="seated">Seated</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <span class="text-xs text-slate-400 font-mono">
          Showing {{ table.getRowModel().rows.length }} records
        </span>
      </div>

      <!-- Global Filter Search Input -->
      <div class="relative w-full md:w-72">
        <UIcon name="i-lucide-search" class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          v-model="globalFilter"
          type="text"
          placeholder="Filter by ref, name, or phone..."
          class="w-full pl-9 pr-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
      </div>
    </div>

    <!-- TanStack Heavy Data Table -->
    <div class="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-950/80 border-b border-white/10">
            <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                class="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-300 text-[11px]"
              >
                <FlexRender
                  v-if="!header.isPlaceholder"
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-white/5">
            <tr v-if="pending" class="animate-pulse">
              <td colspan="7" class="px-4 py-8 text-center text-slate-400">
                Loading live reservations data...
              </td>
            </tr>

            <tr v-else-if="table.getRowModel().rows.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-slate-400">
                <UIcon name="i-lucide-inbox" class="h-8 w-8 mx-auto text-slate-500 mb-2" />
                <p class="font-bold text-white">No Reservations Found</p>
                <p class="text-[11px]">No bookings match your current status or search filter.</p>
              </td>
            </tr>

            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-4 py-3.5 text-slate-200"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="p-4 bg-slate-950/60 border-t border-white/5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="soft"
            size="xs"
            :disabled="!table.getCanPreviousPage()"
            icon="i-lucide-chevron-left"
            @click="table.previousPage()"
          >
            Previous
          </UButton>
          <UButton
            color="neutral"
            variant="soft"
            size="xs"
            :disabled="!table.getCanNextPage()"
            icon="i-lucide-chevron-right"
            @click="table.nextPage()"
          >
            Next
          </UButton>
        </div>

        <span class="text-xs text-slate-400 font-mono">
          Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() || 1 }}
        </span>
      </div>
    </div>

    <!-- Modification Request Detail Modal -->
    <UModal :open="!!modificationModal" title="Modification Request" @update:open="modificationModal = null">
      <template #body>
        <div v-if="modificationModal" class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-slate-400">Booking</p>
              <p class="font-mono font-bold text-white">{{ modificationModal.code }}</p>
            </div>
            <div>
              <p class="text-slate-400">Requested at</p>
              <p class="font-mono text-white">{{ modificationModal.modification_request?.created_at ? new Date(modificationModal.modification_request.created_at).toLocaleString() : '—' }}</p>
            </div>
          </div>

          <div>
            <p class="text-slate-400 mb-1">Requested changes</p>
            <div class="rounded-lg border border-white/10 divide-y divide-white/5 overflow-hidden">
              <div
                v-for="change in formatChange(modificationModal.modification_request?.requested_payload)"
                :key="change.key"
                class="flex justify-between px-3 py-2 bg-slate-950/60"
              >
                <span class="font-mono text-slate-400">{{ change.key }}</span>
                <span class="font-mono text-fuchsia-300">{{ change.value }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <UButton
              color="success"
              size="xs"
              icon="i-lucide-check"
              :loading="actionBusy === `${modificationModal.id}-mod-approve`"
              @click="decideModification(modificationModal, 'approve'); modificationModal = null"
            >
              Approve Change
            </UButton>
            <UButton
              color="error"
              size="xs"
              icon="i-lucide-x"
              :loading="actionBusy === `${modificationModal.id}-mod-reject`"
              @click="decideModification(modificationModal, 'reject'); modificationModal = null"
            >
              Reject Change
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
