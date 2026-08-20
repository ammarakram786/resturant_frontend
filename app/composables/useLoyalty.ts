import type {
  ReferralRecord,
  ReferralValidation,
  RewardTransaction,
  RewardsSummary,
} from '~~/shared/types/domain'
import { useApi } from './useApi'

export function useLoyalty() {
  const api = useApi()

  const getRewards = () =>
    api.get<RewardsSummary>('/rewards', {
      defaultMessage: 'Unable to load rewards.',
    })

  const listTransactions = () =>
    api.get<RewardTransaction[]>('/rewards/transactions', {
      defaultMessage: 'Unable to load reward transactions.',
    })

  const validateReferral = (code: string) =>
    api.get<ReferralValidation>('/referrals/validate', {
      query: { code },
      defaultMessage: 'Unable to validate the referral code.',
    })

  const inviteReferral = (payload: { email?: string, phone?: string }) =>
    api.post<ReferralRecord>('/referrals/invite', {
      body: payload,
      defaultMessage: 'Unable to create the referral invite.',
    })

  const listIncomingReferrals = () =>
    api.get<ReferralRecord[]>('/referrals/incoming', {
      defaultMessage: 'Unable to load incoming referrals.',
    })

  const acceptReferral = (id: number) =>
    api.post<ReferralRecord>(`/referrals/${id}/accept`, {
      defaultMessage: 'Unable to accept this referral.',
    })

  const rejectReferral = (id: number) =>
    api.post<ReferralRecord>(`/referrals/${id}/reject`, {
      defaultMessage: 'Unable to reject this referral.',
    })

  return {
    getRewards,
    listTransactions,
    validateReferral,
    inviteReferral,
    listIncomingReferrals,
    acceptReferral,
    rejectReferral,
  }
}
