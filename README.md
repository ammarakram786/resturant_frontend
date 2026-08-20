# Resturant Frontend Foundation

This folder contains the Nuxt 4 + `@nuxt/ui` frontend scaffold for the migration rebuild.

## Current MVP slice

The customer surface is now wired to live backend endpoints for:

- email OTP sign-in on `/discover`
- live restaurant browse on `/restaurants`
- restaurant detail plus availability on `/restaurants/:id`
- booking history plus cancel / waitlist convert on `/bookings`

For the current local MVP, the email OTP code is `1234`. That is intentionally development-only scaffolding so the end-to-end slice can be exercised without external mail or SMS infrastructure.

## What this scaffold establishes

- Nuxt 4 `app/`-first structure with SSR-friendly route surfaces.
- Dedicated layout boundaries for customer, partner, and admin experiences.
- Shared Nuxt UI theme tokens through `app.config.ts`.
- A typed `useApi()` composable aligned to the canonical `/api/v1` envelope.
- Shared domain and contract types under `shared/`.
- Locale, timezone, and PKR formatting groundwork for Pakistan-specific behavior.

## Route surfaces

- Customer: `/discover`, `/restaurants`, `/bookings`
- Partner: `/partner`, `/partner/bookings`, `/partner/waitlist`
- Admin: `/admin`, `/admin/restaurants`, `/admin/support`

Partner and admin routes remain scaffold placeholders on purpose. The customer routes above are now real slice implementations built on the same contract boundaries.

## Architecture rules encoded here

1. Use only canonical booking status strings from the migration docs.
2. Do not add wallet or payment UI until the later payments phase exists.
3. Keep waitlist booking-backed; do not invent a separate frontend resource model.
4. Keep customer, partner, and admin route shells separate to reduce parity drift.
5. Route all server communication through `useApi()` so auth, locale, cookies, and error parsing stay centralized.

## Local configuration

Copy the values from `.env.example` into your local environment before running the app.

## Install / run

Preferred package manager on this machine is currently `yarn`, because `npm` hit an internal arborist resolver error during dependency installation.

```bash
corepack yarn install
corepack yarn dev
corepack yarn typecheck
```
