import { expect, test } from 'vitest'
import { buildPromptDistOption } from './promptDistOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const labels = { seriesTyped: 'typed', seriesAll: 'all', tooltip: { count: '{{n}} s' } }

test('grouped typed/all integer histogram with a >maxBin overflow', () => {
  const stats = [
    { sessionId: 'a', date: '2026-07-10', typed: 1, all: 1 },
    { sessionId: 'b', date: '2026-07-10', typed: 2, all: 3 },
    { sessionId: 'c', date: '2026-07-10', typed: 5, all: 99 }, // 99 → overflow
  ]
  const opt: any = buildPromptDistOption(stats, theme, labels)
  expect(opt.series).toHaveLength(2)
  const cats = opt.xAxis.data
  expect(cats[0]).toBe('1')
  expect(cats[cats.length - 1].startsWith('>')).toBe(true)
  // every session counted in each series
  expect(opt.series[0].data.reduce((a: number, b: number) => a + b, 0)).toBe(3) // typed
  expect(opt.series[1].data.reduce((a: number, b: number) => a + b, 0)).toBe(3) // all
  // the all=99 session lands in the overflow bucket
  expect(opt.series[1].data[opt.series[1].data.length - 1]).toBe(1)
})

test('tooltip valueFormatter fills the count template', () => {
  const opt: any = buildPromptDistOption([{ sessionId: 'a', date: '2026-07-10', typed: 1, all: 1 }], theme, labels)
  expect(opt.tooltip.valueFormatter(4)).toBe('4 s')
})
