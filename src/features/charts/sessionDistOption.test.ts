import { expect, test } from 'vitest'
import { buildSessionDistOption, bucketize } from './sessionDistOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const labels = { tooltip: { sessionCount: 'TEST_SESSIONS n={{n}}' } }

test('bucketize returns normalBins + 1 overflow bin, counting every total', () => {
  const b = bucketize([0, 10, 20, 30, 40], 4, 40)
  expect(b).toHaveLength(5) // 4 normal + 1 overflow
  expect(b.reduce((a, x) => a + x.count, 0)).toBe(5)
})

test('bucketize routes totals >= cap into the overflow bin', () => {
  // cap = 100, width = 100/5 = 20 → normal bins [0,20,40,60,80], overflow >=100
  const b = bucketize([0, 25, 50, 500, 999], 5, 100)
  const overflow = b[b.length - 1]
  expect(overflow.overflow).toBe(true)
  expect(overflow.count).toBe(2) // 500 and 999
  expect(overflow.label).toBe('>100')
  // the 3 in-range totals sit in normal bins
  expect(b.slice(0, 5).reduce((a, x) => a + x.count, 0)).toBe(3)
})

test('option is a single-hue bar histogram with a P90 markLine', () => {
  const opt: any = buildSessionDistOption({ totals: [1, 2, 3, 4], p50: 2, p90: 4 }, theme, labels)
  expect(opt.series[0].type).toBe('bar')
  expect(typeof opt.series[0].itemStyle.color).toBe('string')
  expect(opt.series[0].markLine).toBeTruthy()
  expect(opt.legend).toBeUndefined()
})

test('P90 markLine lands in the last normal bin (cap = P90), never the overflow bin', () => {
  const totals = [0, 20, 40, 60, 80, 90, 5000]
  const p90 = 90 // cap; the 5000 outlier is isolated into overflow
  const opt: any = buildSessionDistOption({ totals, p50: 50, p90 }, theme, labels)
  const markBin = opt.series[0].markLine.data[0].xAxis
  // buckets = N normal + 1 overflow; markLine clamps to the last normal bin,
  // i.e. index (data.length - 2), never the trailing overflow bin.
  const lastNormalBin = opt.xAxis.data.length - 2
  expect(markBin).toBe(lastNormalBin)
})

test('tooltip valueFormatter fills the session count template from labels', () => {
  const opt: any = buildSessionDistOption({ totals: [1, 2, 3], p50: 2, p90: 3 }, theme, labels)
  expect(opt.tooltip.valueFormatter(5)).toBe('TEST_SESSIONS n=5')
})
