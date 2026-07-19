import { expect, test } from 'vitest'
import { buildContextCurveOption } from './contextCurveOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }

test('context curve is a line over turn index', () => {
  const opt: any = buildContextCurveOption(
    [{ i: 1, context: 2050 }, { i: 2, context: 8100 }],
    theme,
    { xAxisName: 'turn' },
  )
  expect(opt.series[0].type).toBe('line')
  expect(opt.series[0].data).toEqual([2050, 8100])
  expect(opt.xAxis.data).toEqual(['1', '2'])
})
