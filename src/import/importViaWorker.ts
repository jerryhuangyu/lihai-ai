import type { Coverage, CostedEvent } from '../domain/types'
import type { Aggregates } from '../aggregate'
import { saveEvents } from '../store/rawDb'
import { useDataStore } from '../store/useDataStore'

interface WorkerReply {
  ok: boolean
  error?: string
  aggregates?: Aggregates
  costed?: CostedEvent[]
  coverage?: Coverage
  generatedAt?: string
}

export async function importViaWorker(file: File, todayIso: string): Promise<Coverage> {
  const bytes = await file.arrayBuffer()
  const worker = new Worker(new URL('../workers/parse.worker.ts', import.meta.url), {
    type: 'module',
  })
  try {
    const reply = await new Promise<WorkerReply>((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<WorkerReply>) => resolve(e.data)
      worker.onerror = (e) => reject(new Error(e.message))
      worker.postMessage({ bytes, todayIso, tzOffsetMinutes: new Date().getTimezoneOffset() }, [bytes])
    })
    if (!reply.ok || !reply.aggregates || !reply.costed || !reply.coverage) {
      throw new Error(reply.error ?? '解析失敗')
    }
    await saveEvents(reply.costed)
    useDataStore.getState().setResult({
      aggregates: reply.aggregates,
      coverage: reply.coverage,
      generatedAt: reply.generatedAt ?? '',
    })
    return reply.coverage
  } finally {
    worker.terminate()
  }
}
