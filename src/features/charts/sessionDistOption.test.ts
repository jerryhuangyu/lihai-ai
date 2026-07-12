import { expect, test } from 'vitest'
import { buildSessionDistOption, bucketize } from './sessionDistOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const labels = { tooltip: { sessionCount: 'TEST_SESSIONS n={{n}}' } }

test('bucketize splits totals into N ascending bins', () => {
  const b = bucketize([0, 10, 20, 30, 40], 5)
  expect(b).toHaveLength(5)
  expect(b.reduce((a, x) => a + x.count, 0)).toBe(5)
})

test('option is a single-hue bar histogram with a P90 markLine', () => {
  const opt: any = buildSessionDistOption({ totals: [1, 2, 3, 4], p50: 2, p90: 4 }, theme, labels)
  expect(opt.series[0].type).toBe('bar')
  expect(typeof opt.series[0].itemStyle.color).toBe('string')
  expect(opt.series[0].markLine).toBeTruthy()
  expect(opt.legend).toBeUndefined()
})

test('P90 markLine lands in the same bucket bucketize assigns p90', () => {
  const totals = [0, 20, 40, 60, 80, 100]
  const p90 = 90
  const opt: any = buildSessionDistOption({ totals, p50: 50, p90 }, theme, labels)
  const markBin = opt.series[0].markLine.data[0].xAxis
  // bucketize width = max(100)/12, floor(90/width)
  const width = 100 / 12
  expect(markBin).toBe(Math.min(11, Math.floor(90 / width)))
  // and it is NOT the Math.round value when they differ
  expect(markBin).toBe(Math.floor((p90 / 100) * 12))
})

test('tooltip valueFormatter fills the session count template from labels', () => {
  const opt: any = buildSessionDistOption({ totals: [1, 2, 3], p50: 2, p90: 3 }, theme, labels)
  expect(opt.tooltip.valueFormatter(5)).toBe('TEST_SESSIONS n=5')
})
