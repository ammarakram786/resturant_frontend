import type { SurfaceKind } from './shared/types/domain'

declare module '#app' {
  interface PageMeta {
    surface?: SurfaceKind
  }
}

export {}
