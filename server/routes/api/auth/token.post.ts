import { defineEventHandler, readBody, setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const token = body?.access_token

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing access_token',
    })
  }

  setCookie(event, '_at', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return { ok: true }
})
