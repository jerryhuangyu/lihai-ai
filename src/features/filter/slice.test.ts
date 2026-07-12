import { expect, test } from 'vitest'
import { sliceByDate, sliceKpis } from './slice'

const rows = [
  { date: '2026-07-08', cost: 10 },
  { date: '2026-07-09', cost: 20 },
  { date: '2026-07-10', cost: 30 },
]
test('sliceByDate keeps inclusive bounds', () => {
  expect(sliceByDate(rows, { from: '2026-07-09', to: '2026-07-10' })).toHaveLength(2)
})
test('sliceKpis recomputes total/avg/delta over the slice', () => {
  const k = sliceKpis(rows, { from: '2026-07-09', to: '2026-07-10' })
  expect(k.totalCost).toBe(50)
  expect(k.avgPerDay).toBe(25)
  expect(k.deltaPct).toBeCloseTo(50, 6) // 20 → 30
})
