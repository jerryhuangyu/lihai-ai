import { expect, test } from 'vitest'
import { buildTokenCompositionOption } from './tokenCompositionOption'
import { TOKEN_COLORS } from '../../viz/palette'

const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const row = { date: '2026-07-10', input: 100, output: 2000, cacheCreation: 500, cacheRead: 8000 }
const labels = { series: { cacheCreation: 'TEST_CACHE_CREATION', cacheRead: 'TEST_CACHE_READ' } }

test('four stacked series in fixed semantic order + colors', () => {
  const opt: any = buildTokenCompositionOption([row], theme, false, labels)
  expect(opt.series.map((s: any) => s.name)).toEqual([
    'Input',
    'Output',
    labels.series.cacheCreation,
    labels.series.cacheRead,
  ])
  expect(opt.series.every((s: any) => s.stack === 'tok')).toBe(true)
  expect(opt.series[0].itemStyle.color).toBe(TOKEN_COLORS.input)
  expect(opt.series[3].itemStyle.color).toBe(TOKEN_COLORS.cacheRead)
})

test('has legend (>=2 series) + 2px surface gap between fills', () => {
  const opt: any = buildTokenCompositionOption([row], theme, false, labels)
  expect(opt.legend).toBeTruthy()
  expect(opt.series[0].areaStyle).toBeTruthy()
  // 2px gap between stacked fills via a surface-colored top edge (lineStyle)
  expect(opt.series[0].lineStyle.width).toBe(2)
  expect(opt.series[0].lineStyle.color).toBe(theme.surface)
})

test('normalized mode scales each date to 100%', () => {
  const row = { date: 'd', input: 25, output: 25, cacheCreation: 25, cacheRead: 25 }
  const opt: any = buildTokenCompositionOption(
    [row],
    { theme: 'light', ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' },
    true,
    labels,
  )
  const sum = opt.series.reduce((a: number, s: any) => a + s.data[0], 0)
  expect(sum).toBeCloseTo(100, 6)
  expect(opt.yAxis.max).toBe(100)
})

test('normalized mode: all-zero row yields 0, not NaN', () => {
  const row = { date: 'd', input: 0, output: 0, cacheCreation: 0, cacheRead: 0 }
  const opt: any = buildTokenCompositionOption(
    [row],
    { theme: 'light', ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' },
    true,
    labels,
  )
  for (const s of opt.series) expect(s.data[0]).toBe(0)
})
