import { expect, test } from 'vitest'
import { buildCadenceOption } from './cadenceOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const labels = { tooltip: { count: '{{n}} x' } }

test('cadence is a bar histogram with a >P90 overflow bin, time-labelled', () => {
  // gaps in ms; P90 caps the axis, the 1h outlier lands in overflow
  const gaps = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 3_600_000]
  const opt: any = buildCadenceOption(gaps, theme, labels)
  expect(opt.series[0].type).toBe('bar')
  const cats = opt.xAxis.data
  expect(cats[0]).toBe('0s') // first bin lower bound
  expect(cats[cats.length - 1].startsWith('>')).toBe(true) // overflow bin
  // every gap counted across all bins
  expect(opt.series[0].data.reduce((a: number, b: number) => a + b, 0)).toBe(gaps.length)
})

test('tooltip valueFormatter fills the count template', () => {
  const opt: any = buildCadenceOption([1000, 2000, 3000], theme, labels)
  expect(opt.tooltip.valueFormatter(7)).toBe('7 x')
})
