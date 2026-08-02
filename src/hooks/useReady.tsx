// Keeps track of wether everything is good to go or not, in the most efficient way possible

import { useCallback, useEffect, useState } from 'react'

// These logs used to be stripped from production builds by
// babel-plugin-transform-remove-console. That plugin is gone along with the
// Babel setup, so they're guarded explicitly instead — microbundle replaces
// process.env.NODE_ENV and then dead-code-eliminates the whole block.
const dev = process.env.NODE_ENV !== 'production'

export function useReady() {
  const [ready, setReady] = useState(false)
  const [readyMap, updateReadyMap] = useState<{ [key: string]: boolean }>({})

  const registerReady = useCallback((key: string) => {
    if (dev) console.count(`registerReady:${key}`)
    // Register the check we're gonna wait for until it's ready
    updateReadyMap((ready) => ({ ...ready, [key]: false }))

    return () => {
      if (dev) console.count(`setReady:${key}`)
      // Set it to ready
      updateReadyMap((ready) => ({ ...ready, [key]: true }))
    }
  }, [])

  useEffect(() => {
    const states = Object.values(readyMap)

    if (states.length === 0) {
      if (dev) console.log('nope nothing registered yet')
      return
    }

    const isReady = states.every(Boolean)
    if (dev) console.log('check if we are rready', readyMap, isReady)
    if (isReady) {
      if (dev) console.warn('ready!')
      setReady(true)
    }
  }, [readyMap])

  return { ready, registerReady }
}
