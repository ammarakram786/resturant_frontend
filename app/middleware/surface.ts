import { surfacePathPrefixes } from '~~/shared/config/surfaces'
import type { SurfaceKind } from '~~/shared/types/domain'

export default defineNuxtRouteMiddleware((to) => {
  const pageSurface = to.meta.surface as SurfaceKind | undefined

  if (!pageSurface) {
    return
  }

  const expectedPrefix = surfacePathPrefixes[pageSurface]
  const isCustomerRoute = pageSurface === 'customer' && !to.path.startsWith('/partner') && !to.path.startsWith('/admin') && !to.path.startsWith('/hub')

  if (isCustomerRoute) {
    return
  }

  if (!to.path.startsWith(expectedPrefix)) {
    throw createError({
      statusCode: 500,
      statusMessage: `Route surface mismatch for ${to.path}`,
    })
  }
})
