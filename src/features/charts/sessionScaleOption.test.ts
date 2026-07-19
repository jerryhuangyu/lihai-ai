import { expect, test } from 'vitest'
import { buildSessionScaleOption } from './sessionScaleOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const labels = { xAxisName: 'duration', yAxisName: 'prompts', tooltip: '{{prompts}} prompts / {{duration}}' }
const m = (sessionId: string, durationMs: number, typed: number) => ({ sessionId, durationMs, turns: 0, typed, all: typed })

test('scatter maps each session to [minutes, typedPrompts] and keeps ms for tooltip', () => {
  const opt: any = buildSessionScaleOption([m('a', 5 * 60_000, 4)], theme, labels)
  expect(opt.series[0].type).toBe('scatter')
  expect(opt.series[0].data[0]).toEqual([5, 4, 300_000]) // [min, typed, ms]
})

test('tooltip formatter fills typed prompts + human duration', () => {
  const opt: any = buildSessionScaleOption([m('a', 90_000, 4)], theme, labels)
  expect(opt.tooltip.formatter({ data: [1.5, 4, 90_000] })).toBe('4 prompts / 2m')
})
