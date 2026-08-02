import { useSpring as useReactSpring } from '@react-spring/web'

// Behold, the engine of it all!
// Put in this file befause it makes it easier to type and I'm lazy! :D

export function useSpring() {
  return useReactSpring(() => ({
    y: 0,
    ready: 0,
    maxHeight: 0,
    minSnap: 0,
    maxSnap: 0,
  }))
}

export type Spring = ReturnType<typeof useSpring>[0]
/**
 * react-spring v9 replaced the `set` function with a `SpringRef`, so this is the
 * imperative api (`api.start(...)`) rather than a plain setter.
 */
export type SpringApi = ReturnType<typeof useSpring>[1]
