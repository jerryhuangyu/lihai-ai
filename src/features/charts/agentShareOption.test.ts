import { expect, test } from 'vitest'
import { buildAgentShareOption } from './agentShareOption'
import { CATEGORICAL_LIGHT } from '../../viz/palette'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
test('donut pie, categorical hues in fixed order, legend', () => {
  const opt: any = buildAgentShareOption([{ agent: 'claude', cost: 3 }, { agent: 'codex', cost: 2 }], theme)
  expect(opt.series[0].type).toBe('pie')
  expect(opt.series[0].radius).toEqual(['55%', '80%']) // donut
  expect(opt.series[0].data[0]).toMatchObject({ name: 'claude', value: 3, itemStyle: { color: CATEGORICAL_LIGHT[0] } })
  expect(opt.series[0].data[1].itemStyle.color).toBe(CATEGORICAL_LIGHT[1])
  expect(opt.legend).toBeTruthy()
})
