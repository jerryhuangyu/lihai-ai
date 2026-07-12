import { expect, test } from 'vitest'
import { buildModelEfficiencyOption } from './modelEfficiencyOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }

test('bars the list rate (single hue), no legend, single axis pair', () => {
  const opt: any = buildModelEfficiencyOption(
    [{ model: 'a', listRate: 15, perTokenCost: 0.9, outputShare: 0.005, exact: true }],
    theme,
  )
  expect(opt.series[0].type).toBe('bar')
  expect(opt.series[0].data).toEqual([15]) // list rate, NOT effective
  expect(typeof opt.series[0].itemStyle.color).toBe('string')
  expect(opt.yAxis.type).toBe('category')
  expect(opt.xAxis.type).toBe('value')
  expect(opt.legend).toBeUndefined()
})

test('tooltip formatter tolerates a stale row missing the new fields (no crash)', () => {
  // A pre-v2 persisted aggregate can rehydrate rows without perTokenCost/outputShare.
  const opt: any = buildModelEfficiencyOption(
    [{ model: 'a', listRate: 15, exact: true } as never],
    theme,
  )
  expect(() => opt.tooltip.formatter({ dataIndex: 0 })).not.toThrow()
})
