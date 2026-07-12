import type {
  CcusageRaw,
  CcusageNormalized,
  CcusagePeriodRow,
  CcusageSessionRow,
  CcusageBlock,
} from '../domain/types'

function asRows(arr: unknown[] | undefined): CcusagePeriodRow[] {
  return (arr ?? []) as CcusagePeriodRow[]
}

export function normalizeCcusage(raw: CcusageRaw): CcusageNormalized {
  const session = ((raw.session?.session ?? []) as Array<
    CcusageSessionRow & { metadata?: { lastActivity?: string } }
  >).map((s) => ({
    ...s,
    lastActivity: s.lastActivity ?? s.metadata?.lastActivity,
  }))

  return {
    daily: asRows(raw.daily?.daily),
    weekly: asRows(raw.weekly?.weekly),
    monthly: asRows(raw.monthly?.monthly),
    session,
    blocks: (raw.blocks?.blocks ?? []) as CcusageBlock[],
  }
}
