import { expect, test } from 'vitest'
import { buildModelEfficiencyOption } from './modelEfficiencyOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const labels = {
  tooltip: {
    listPrice: 'TEST_LIST rate={{rate}} est={{estimated}}',
    estimatedSuffix: 'TEST_EST',
    effectiveRate: 'TEST_EFFECTIVE rate={{rate}}',
    outputShare: 'TEST_SHARE pct={{pct}}',
  },
}

test('bars the list rate (single hue), no legend, single axis pair', () => {
  const opt: any = buildModelEfficiencyOption(
    [{ model: 'a', listRate: 15, perTokenCost: 0.9, outputShare: 0.005, exact: true }],
    theme,
    labels,
  )
  expect(opt.series[0].type).toBe('bar')
  expect(opt.series[0].data).toEqual([15]) // list rate, NOT effective
  expect(typeof opt.series[0].itemStyle.color).toBe('string')
  expect(opt.yAxis.type).toBe('category')
  expect(opt.xAxis.type).toBe('value')
  expect(opt.legend).toBeUndefined()
})

test('tooltip formatter fills templates from labels, with estimated suffix when inexact', () => {
  const opt: any = buildModelEfficiencyOption(
    [{ model: 'a', listRate: 15, perTokenCost: 0.9, outputShare: 0.5, exact: false }],
    theme,
    labels,
  )
  const html = opt.tooltip.formatter({ dataIndex: 0 })
  expect(html).toContain('TEST_LIST rate=$15 est=TEST_EST')
  expect(html).toContain('TEST_EFFECTIVE rate=$0.90')
  expect(html).toContain('TEST_SHARE pct=50.0')
})

test('tooltip formatter omits estimated suffix when exact', () => {
  const opt: any = buildModelEfficiencyOption(
    [{ model: 'a', listRate: 15, perTokenCost: 0.9, outputShare: 0.5, exact: true }],
    theme,
    labels,
  )
  const html = opt.tooltip.formatter({ dataIndex: 0 })
  expect(html).toContain('TEST_LIST rate=$15 est=')
  expect(html).not.toContain('TEST_EST')
})

test('tooltip formatter tolerates a stale row missing the new fields (no crash)', () => {
  // A pre-v2 persisted aggregate can rehydrate rows without perTokenCost/outputShare.
  const opt: any = buildModelEfficiencyOption(
    [{ model: 'a', listRate: 15, exact: true } as never],
    theme,
    labels,
  )
  expect(() => opt.tooltip.formatter({ dataIndex: 0 })).not.toThrow()
})
