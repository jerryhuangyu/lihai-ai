import { useEffect, useState } from 'react'
import type { CostedEvent } from '../domain/types'
import { allEvents } from '../store/rawDb'
import { useDataStore } from '../store/useDataStore'

// Loads the full raw-event set from IndexedDB once and caches it, keyed on the
// import's generatedAt. A new import changes generatedAt → the cache is dropped
// and reloaded, so on-demand insight cards always reflect the current data
// without persisting anything to localStorage.
let cache: { key: string; promise: Promise<CostedEvent[]> } | null = null

function loadEvents(key: string): Promise<CostedEvent[]> {
  if (cache?.key === key) return cache.promise
  cache = { key, promise: allEvents() }
  return cache.promise
}

export function useRawEvents(): { events: CostedEvent[]; loading: boolean } {
  const generatedAt = useDataStore((s) => s.generatedAt)
  const [events, setEvents] = useState<CostedEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!generatedAt) {
      setEvents([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    loadEvents(generatedAt)
      .then((e) => {
        if (cancelled) return
        setEvents(e)
        setLoading(false)
      })
      .catch(() => {
        // IndexedDB unavailable (private mode, disabled, test env) — degrade to
        // empty instead of an unhandled rejection; drop the cached rejection so
        // a later mount can retry.
        if (cache?.key === generatedAt) cache = null
        if (cancelled) return
        setEvents([])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [generatedAt])

  return { events, loading }
}
