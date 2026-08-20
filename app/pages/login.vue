<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useAuth } from '../composables/useAuth'
import { useAuthStore } from '../stores/auth'

definePageMeta({
  layout: false,
})

const router = useRouter()
const toast = useToast()
const { sendOtp, verifyOtp } = useAuth()
const authStore = useAuthStore()

const step = ref<'email' | 'otp'>('email')
const isSubmitting = ref(false)
const resendCooldown = ref(0)
let cooldownTimer: NodeJS.Timeout | null = null

// Form 1: Email Schema
const emailSchema = toTypedSchema(
  z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
  }),
)

const {
  handleSubmit: handleEmailSubmit,
  errors: emailErrors,
  defineField: defineEmailField,
} = useForm({
  validationSchema: emailSchema,
})

const [email, emailAttrs] = defineEmailField('email')

// Form 2: OTP Schema
const otpSchema = toTypedSchema(
  z.object({
    otp: z.string().min(4, 'OTP code must be at least 4 digits'),
    full_name: z.string().optional(),
  }),
)

const {
  handleSubmit: handleOtpSubmit,
  errors: otpErrors,
  defineField: defineOtpField,
} = useForm({
  validationSchema: otpSchema,
  initialValues: {
    otp: '1234',
  },
})

const [otp, otpAttrs] = defineOtpField('otp')
const [fullName, fullNameAttrs] = defineOtpField('full_name')

const startResendTimer = (seconds = 60) => {
  resendCooldown.value = seconds
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--
    }
    else if (cooldownTimer) {
      clearInterval(cooldownTimer)
    }
  }, 1000)
}

const onSendEmail = handleEmailSubmit(async (values) => {
  isSubmitting.value = true
  try {
    const res = await sendOtp({ email: values.email })
    toast.add({
      title: 'Verification Code Sent',
      description: `A 4-digit code was sent to ${values.email}`,
      color: 'success',
      icon: 'i-lucide-mail-check',
    })
    step.value = 'otp'
    startResendTimer(res?.resend_cooldown || 60)
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to send code'
    toast.add({
      title: 'Error',
      description: message,
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  }
  finally {
    isSubmitting.value = false
  }
})

const onVerifyOtp = handleOtpSubmit(async (values) => {
  if (!email.value) return
  isSubmitting.value = true
  try {
    const result = await verifyOtp({
      email: email.value,
      otp: values.otp,
      full_name: values.full_name,
    })

    toast.add({
      title: 'Welcome Back!',
      description: `Signed in as ${result.user.name || result.user.email}`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })

    // Redirect based on role
    const role = result.user.role || authStore.userRole
    if (role === 'admin') {
      router.push('/admin')
    }
    else if (['owner', 'restaurant', 'manager', 'staff'].includes(role)) {
      router.push('/partner')
    }
    else {
      router.push('/discover')
    }
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid code provided'
    toast.add({
      title: 'Verification Failed',
      description: message,
      color: 'error',
      icon: 'i-lucide-x-circle',
    })
  }
  finally {
    isSubmitting.value = false
  }
})

const backToEmail = () => {
  step.value = 'email'
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
    <!-- Ambient glowing backgrounds -->
    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
    <div class="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

    <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <div class="flex justify-center mb-6">
        <BrandMark />
      </div>
      <h2 class="text-center text-3xl font-extrabold tracking-tight text-white">
        {{ step === 'email' ? 'Sign in to Resturant' : 'Enter Verification Code' }}
      </h2>
      <p class="mt-2 text-center text-sm text-slate-400">
        {{ step === 'email' ? 'Experience seamless fine dining reservations' : `Code sent to ${email}` }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <div class="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl">
        <!-- STEP 1: EMAIL -->
        <form v-if="step === 'email'" class="space-y-6" @submit.prevent="onSendEmail">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Email Address
            </label>
            <div class="relative rounded-xl shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UIcon name="i-lucide-mail" class="h-5 w-5" />
              </div>
              <input
                v-model="email"
                v-bind="emailAttrs"
                type="email"
                placeholder="you@example.com"
                class="block w-full pl-11 pr-4 py-3 bg-slate-950/80 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm transition-all"
                :class="emailErrors.email ? 'border-rose-500' : 'border-white/10'"
              >
            </div>
            <p v-if="emailErrors.email" class="mt-1.5 text-xs text-rose-400 font-medium">
              {{ emailErrors.email }}
            </p>
          </div>

          <UButton
            type="submit"
            color="primary"
            variant="solid"
            block
            size="lg"
            :loading="isSubmitting"
            icon="i-lucide-arrow-right"
            class="py-3 font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300"
          >
            Continue with Email
          </UButton>

          <!-- Quick Dev hint -->
          <div class="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
            <p class="text-xs font-mono text-amber-300">
              💡 Development Hint: Any valid email works. Dev OTP is <span class="font-bold underline">1234</span>.
            </p>
          </div>
        </form>

        <!-- STEP 2: OTP VERIFICATION -->
        <form v-else class="space-y-6" @submit.prevent="onVerifyOtp">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              4-Digit Code
            </label>
            <div class="relative rounded-xl shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UIcon name="i-lucide-key-round" class="h-5 w-5" />
              </div>
              <input
                v-model="otp"
                v-bind="otpAttrs"
                type="text"
                maxlength="6"
                placeholder="1234"
                class="block w-full pl-11 pr-4 py-3 bg-slate-950/80 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base font-mono tracking-widest text-center transition-all"
                :class="otpErrors.otp ? 'border-rose-500' : 'border-white/10'"
              >
            </div>
            <p v-if="otpErrors.otp" class="mt-1.5 text-xs text-rose-400 font-medium">
              {{ otpErrors.otp }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Full Name <span class="text-slate-500 font-normal lowercase">(optional)</span>
            </label>
            <input
              v-model="fullName"
              v-bind="fullNameAttrs"
              type="text"
              placeholder="e.g. Alexander Wright"
              class="block w-full px-4 py-3 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-all"
            >
          </div>

          <div class="space-y-3">
            <UButton
              type="submit"
              color="primary"
              variant="solid"
              block
              size="lg"
              :loading="isSubmitting"
              icon="i-lucide-check-circle"
              class="py-3 font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300"
            >
              Verify & Sign In
            </UButton>

            <div class="flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                class="hover:text-white underline transition-colors"
                @click="backToEmail"
              >
                Change Email
              </button>

              <button
                type="button"
                :disabled="resendCooldown > 0"
                class="hover:text-amber-400 disabled:opacity-50 transition-colors"
                @click="onSendEmail"
              >
                {{ resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
