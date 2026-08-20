<script setup lang="ts">
import type { ReferralRecord, RewardTransaction, RewardsSummary } from '~~/shared/types/domain'
import { useCustomerSession } from '../../../composables/useCustomerSession'
import { useLoyalty } from '../../../composables/useLoyalty'

definePageMeta({
  layout: 'customer',
  middleware: 'surface',
  surface: 'customer',
})

useSeoMeta({
  title: 'Rewards',
  description: 'Rewards summary, ledger, and referral actions.',
})

const loyaltyApi = useLoyalty()
const { data: profile } = await useCustomerSession('customer-rewards-session')
const referralForm = reactive({
  email: '',
  phone: '',
  code: '',
})
const state = reactive({
  inviting: false,
  respondingId: 0,
  validating: false,
  success: '',
  error: '',
})

const { data: rewards, refresh: refreshRewards } = await useAsyncData<RewardsSummary | null>('customer-rewards', async () => {
  if (!profile.value) {
    return null
  }

  return loyaltyApi.getRewards()
})

const { data: transactions, refresh: refreshTransactions } = await useAsyncData<RewardTransaction[]>(
  'customer-reward-transactions',
  async () => {
    if (!profile.value) {
      return []
    }

    return loyaltyApi.listTransactions()
  },
)

const { data: incomingReferrals, refresh: refreshIncoming } = await useAsyncData<ReferralRecord[]>(
  'customer-incoming-referrals',
  async () => {
    if (!profile.value) {
      return []
    }

    return loyaltyApi.listIncomingReferrals()
  },
)

const referralValidation = ref<{ valid: boolean, referrer_name?: string | null } | null>(null)

async function inviteReferral() {
  state.inviting = true
  state.success = ''
  state.error = ''
  try {
    await loyaltyApi.inviteReferral({
      email: referralForm.email || undefined,
      phone: referralForm.phone || undefined,
    })
    referralForm.email = ''
    referralForm.phone = ''
    state.success = 'Referral invite created.'
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to create the referral invite.'
  }
  finally {
    state.inviting = false
  }
}

async function validateCode() {
  if (!referralForm.code.trim()) {
    referralValidation.value = null
    return
  }

  state.validating = true
  state.error = ''
  try {
    const result = await loyaltyApi.validateReferral(referralForm.code)
    referralValidation.value = {
      valid: result.valid,
      referrer_name: result.referrer_name,
    }
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to validate this code.'
  }
  finally {
    state.validating = false
  }
}

async function respondToReferral(id: number, action: 'accept' | 'reject') {
  state.respondingId = id
  state.success = ''
  state.error = ''
  try {
    if (action === 'accept') {
      await loyaltyApi.acceptReferral(id)
      state.success = 'Referral accepted.'
    }
    else {
      await loyaltyApi.rejectReferral(id)
      state.success = 'Referral rejected.'
    }
    await Promise.all([refreshIncoming(), refreshRewards(), refreshTransactions()])
  }
  catch (error) {
    state.error = error instanceof Error ? error.message : `Unable to ${action} referral.`
  }
  finally {
    state.respondingId = 0
  }
}
</script>

<template>
  <div class="space-y-6">
    <UAlert
      v-if="!profile"
      color="warning"
      variant="soft"
      title="Sign in required"
      description="Authenticate from Discover before loading rewards and referrals."
    />

    <template v-else>
      <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <UCard>
          <template #header>
            <div class="space-y-1">
              <h1 class="text-xl font-semibold text-highlighted">Rewards summary</h1>
              <p class="text-sm text-muted">
                Summary and transaction ledger stay separate, matching the migration contract.
              </p>
            </div>
          </template>

          <div v-if="rewards" class="grid gap-4 md:grid-cols-2">
            <UCard variant="subtle">
              <p class="text-sm text-muted">Points balance</p>
              <p class="mt-1 text-2xl font-semibold text-highlighted">{{ rewards.points_balance }}</p>
            </UCard>
            <UCard variant="subtle">
              <p class="text-sm text-muted">Tier</p>
              <p class="mt-1 text-2xl font-semibold text-highlighted">{{ rewards.tier.label }}</p>
            </UCard>
            <UCard variant="subtle">
              <p class="text-sm text-muted">Lifetime delta</p>
              <p class="mt-1 font-medium text-highlighted">{{ rewards.lifetime_points_delta }}</p>
            </UCard>
            <UCard variant="subtle">
              <p class="text-sm text-muted">Transactions</p>
              <p class="mt-1 font-medium text-highlighted">{{ rewards.transactions_count }}</p>
            </UCard>
          </div>

          <div class="mt-4 space-y-3">
            <p class="text-sm font-medium text-highlighted">Recent ledger activity</p>
            <UCard v-for="entry in transactions ?? []" :key="entry.id" variant="subtle">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-medium text-highlighted">{{ entry.kind }}</p>
                  <p class="text-sm text-muted">{{ entry.source || 'manual' }}</p>
                </div>
                <div class="text-right">
                  <p class="font-medium text-highlighted">{{ entry.points }}</p>
                  <p class="text-xs text-muted">Balance {{ entry.balance_after }}</p>
                </div>
              </div>
            </UCard>
          </div>
        </UCard>

        <div class="space-y-6">
          <UCard>
            <template #header>
              <div class="space-y-1">
                <h2 class="text-xl font-semibold text-highlighted">Invite a friend</h2>
                <p class="text-sm text-muted">
                  Referral creation and incoming accept/reject flows use explicit resources rather than hidden side effects.
                </p>
              </div>
            </template>

            <div class="grid gap-4 md:grid-cols-2">
              <UInput v-model="referralForm.email" type="email" placeholder="Friend email" />
              <UInput v-model="referralForm.phone" placeholder="Friend phone" />
            </div>
            <div class="mt-4">
              <UButton icon="i-lucide-send" :loading="state.inviting" @click="inviteReferral">
                Create invite
              </UButton>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="space-y-1">
                <h2 class="text-xl font-semibold text-highlighted">Validate a code</h2>
                <p class="text-sm text-muted">
                  Referral validation lets the customer confirm code ownership before responding.
                </p>
              </div>
            </template>

            <div class="flex flex-col gap-3 md:flex-row">
              <UInput v-model="referralForm.code" placeholder="Referral code" />
              <UButton icon="i-lucide-badge-check" :loading="state.validating" @click="validateCode">
                Validate
              </UButton>
            </div>
            <UAlert
              v-if="referralValidation"
              class="mt-4"
              :color="referralValidation.valid ? 'success' : 'warning'"
              variant="soft"
              :title="referralValidation.valid ? 'Code is valid' : 'Code is not valid'"
              :description="referralValidation.referrer_name ? `Referrer: ${referralValidation.referrer_name}` : undefined"
            />
          </UCard>
        </div>
      </div>

      <UCard>
        <template #header>
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-highlighted">Incoming referrals</h2>
            <p class="text-sm text-muted">
              Pending referrals for the signed-in email or phone can be accepted or rejected here.
            </p>
          </div>
        </template>

        <div v-if="incomingReferrals?.length" class="space-y-4">
          <UCard v-for="referral in incomingReferrals" :key="referral.id" variant="subtle">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="font-medium text-highlighted">{{ referral.code }}</p>
                <p class="text-sm text-muted">
                  {{ referral.invitee_email || referral.invitee_phone || 'No invitee shown' }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton
                  color="primary"
                  variant="soft"
                  :loading="state.respondingId === referral.id"
                  @click="respondToReferral(referral.id, 'accept')"
                >
                  Accept
                </UButton>
                <UButton
                  color="neutral"
                  variant="soft"
                  :loading="state.respondingId === referral.id"
                  @click="respondToReferral(referral.id, 'reject')"
                >
                  Reject
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
        <EmptyState
          v-else
          title="No incoming referrals"
          description="Once an invite matches your signed-in email or phone, it will appear here."
          icon="i-lucide-users-round"
        />
      </UCard>

      <UAlert v-if="state.success" color="success" variant="soft" :title="state.success" />
      <UAlert v-if="state.error" color="error" variant="soft" :title="state.error" />
    </template>
  </div>
</template>
