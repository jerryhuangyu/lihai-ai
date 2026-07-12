import { useState } from 'react'
import { useAggregates } from '../../ui/selectors'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { usd } from '../../ui/format'
import { SessionDetail } from './SessionDetail'

export function SessionListCard() {
  const agg = useAggregates()
  const [selected, setSelected] = useState<string | null>(null)
  if (!agg) return null
  // Defensive: a stale persisted aggregate (older schema) may lack this field.
  const rows = (agg.sessionSummaries ?? []).slice(0, 12)
  return (
    <Card title="Session 明細" subtitle="點一列看該 session 的訊息級成本" className="lg:col-span-2">
      {rows.length === 0 ? (
        <EmptyState>尚無資料（需 JSONL）</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ul className="max-h-72 divide-y overflow-auto text-sm">
            {rows.map((s) => (
              <li key={s.sessionId}>
                <button
                  onClick={() => setSelected(s.sessionId)}
                  className={`flex w-full items-center justify-between gap-2 py-2 text-left ${selected === s.sessionId ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <span className="truncate">{s.project}<span className="opacity-50"> · {s.agent}</span></span>
                  <span className="tabular-nums">{usd(s.cost)}</span>
                </button>
              </li>
            ))}
          </ul>
          <div>{selected ? <SessionDetail sessionId={selected} /> : <EmptyState>選一個 session</EmptyState>}</div>
        </div>
      )}
    </Card>
  )
}
