import { expect, test } from 'vitest'
import { buildAgenticDepthOption } from './agenticDepthOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const labels = { tooltip: { count: '{{n}} s' } }

test('agentic-depth histogram bins ratios with a >P90 overflow, ×-labelled', () => {
  const ratios = [1, 2, 3, 4, 5, 6, 7, 8, 9, 200] // 200 → overflow
  const opt: any = buildAgenticDepthOption(ratios, theme, labels)
  expect(opt.series[0].type).toBe('bar')
  const cats = opt.xAxis.data
  expect(cats[0]).toBe('0×')
  expect(cats[cats.length - 1].startsWith('>')).toBe(true)
  expect(cats[cats.length - 1].endsWith('×')).toBe(true)
  expect(opt.series[0].data.reduce((a: number, b: number) => a + b, 0)).toBe(ratios.length)
})

test('tooltip valueFormatter fills the count template', () => {
  const opt: any = buildAgenticDepthOption([1, 2, 3], theme, labels)
  expect(opt.tooltip.valueFormatter(9)).toBe('9 s')
})
