import { defineEventHandler, deleteCookie } from 'h3'

export default defineEventHandler((event) => {
  deleteCookie(event, '_at', {
    path: '/',
  })

  return { ok: true }
})
