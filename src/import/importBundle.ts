import type { Coverage } from '../domain/types'
import { parseBundle } from '../parsers/bundle'
import { buildAggregates } from '../aggregate'
import { saveEvents } from '../store/rawDb'
import { useDataStore } from '../store/useDataStore'

export async function importBundle(
  bytes: Uint8Array,
  todayIso: string,
): Promise<{ coverage: Coverage }> {
  const bundle = parseBundle(bytes)
  const { aggregates, costed, coverage } = buildAggregates(bundle, todayIso, new Date().getTimezoneOffset())
  await saveEvents(costed)
  useDataStore.getState().setResult({
    aggregates,
    coverage,
    generatedAt: bundle.generatedAt,
  })
  return { coverage }
}
