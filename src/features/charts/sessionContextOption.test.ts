import { expect, test } from 'vitest'
import { buildSessionContextOption } from './sessionContextOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const labels = {
  tooltip: { sessionCount: 'TEST_SESSIONS n={{n}}' },
  window200k: '200K',
  window1m: '1M',
}

test('fixed [0,1M] axis has 10 normal bins + a >1M overflow bin', () => {
  const opt: any = buildSessionContextOption({ peaks: [50_000, 250_000, 999_999] }, theme, labels)
  // 10 normal (0..900K) + 1 overflow = 11 categories
  expect(opt.xAxis.data).toHaveLength(11)
  expect(opt.xAxis.data[opt.xAxis.data.length - 1]).toBe('>1.0M')
  expect(opt.series[0].data.reduce((a: number, b: number) => a + b, 0)).toBe(3)
})

test('markLines sit at the 200K and 1M positions', () => {
  const opt: any = buildSessionContextOption({ peaks: [100_000] }, theme, labels)
  const lines = opt.series[0].markLine.data
  expect(lines.map((l: any) => l.xAxis)).toEqual([2, 10]) // 200K→bin2, 1M→overflow(10)
  expect(lines[0].label.formatter).toBe('200K')
  expect(lines[1].label.formatter).toBe('1M')
})

test('a session peaking above 1M lands in the overflow bin', () => {
  const opt: any = buildSessionContextOption({ peaks: [1_500_000] }, theme, labels)
  const data = opt.series[0].data
  expect(data[data.length - 1]).toBe(1) // overflow bin
  expect(data.slice(0, 10).reduce((a: number, b: number) => a + b, 0)).toBe(0)
})

test('tooltip valueFormatter fills the session count template', () => {
  const opt: any = buildSessionContextOption({ peaks: [1, 2, 3] }, theme, labels)
  expect(opt.tooltip.valueFormatter(5)).toBe('TEST_SESSIONS n=5')
})
