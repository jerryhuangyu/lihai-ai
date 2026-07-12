import { expect, test } from 'vitest'
import { buildCostByTokenTypeOption } from './costByTokenTypeOption'
import { TOKEN_COLORS } from '../../viz/palette'
import type { CostByTokenType } from '../../aggregate/analytics'

const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }

// Inverted proportions: output is money-heavy/token-light, cacheRead is the reverse.
const data: CostByTokenType = {
  output: { cost: 48, tokens: 1000 },
  cacheCreation: { cost: 40, tokens: 8000 },
  cacheRead: { cost: 2, tokens: 71000 },
  input: { cost: 10, tokens: 20000 },
}
// costTotal = 100, tokenTotal = 100000

test('four stacked bar series in fixed semantic order + pct stack', () => {
  const opt: any = buildCostByTokenTypeOption(data, theme)
  expect(opt.series).toHaveLength(4)
  expect(opt.series.map((s: any) => s.name)).toEqual(['Input', 'Output', 'Cache 建立', 'Cache 讀取'])
  expect(opt.series.every((s: any) => s.type === 'bar')).toBe(true)
  expect(opt.series.every((s: any) => s.stack === 'pct')).toBe(true)
})

test('yAxis is category with the two rows, xAxis is value', () => {
  const opt: any = buildCostByTokenTypeOption(data, theme)
  expect(opt.yAxis.type).toBe('category')
  expect(opt.yAxis.data).toEqual(['用量', '花費'])
  expect(opt.xAxis.type).toBe('value')
})

test('cost row and token row each sum to ~100%', () => {
  const opt: any = buildCostByTokenTypeOption(data, theme)
  const tokenRowSum = opt.series.reduce((a: number, s: any) => a + s.data[0], 0)
  const costRowSum = opt.series.reduce((a: number, s: any) => a + s.data[1], 0)
  expect(tokenRowSum).toBeCloseTo(100, 6)
  expect(costRowSum).toBeCloseTo(100, 6)
})

test('a specific series cost-row percent matches the hand-computed proportion', () => {
  const opt: any = buildCostByTokenTypeOption(data, theme)
  const output = opt.series.find((s: any) => s.name === 'Output')
  const cacheRead = opt.series.find((s: any) => s.name === 'Cache 讀取')
  expect(output.data[1]).toBeCloseTo(48, 6) // 48/100 cost
  expect(output.data[0]).toBeCloseTo(1, 6) // 1000/100000 tokens
  expect(cacheRead.data[1]).toBeCloseTo(2, 6) // 2/100 cost
  expect(cacheRead.data[0]).toBeCloseTo(71, 6) // 71000/100000 tokens
})

test('has legend + series colors match TOKEN_COLORS semantic mapping', () => {
  const opt: any = buildCostByTokenTypeOption(data, theme)
  expect(opt.legend).toBeTruthy()
  const byName = Object.fromEntries(opt.series.map((s: any) => [s.name, s.itemStyle.color]))
  expect(byName['Input']).toBe(TOKEN_COLORS.input)
  expect(byName['Output']).toBe(TOKEN_COLORS.output)
  expect(byName['Cache 建立']).toBe(TOKEN_COLORS.cacheCreation)
  expect(byName['Cache 讀取']).toBe(TOKEN_COLORS.cacheRead)
})

test('2px surface-colored border gap between stacked segments', () => {
  const opt: any = buildCostByTokenTypeOption(data, theme)
  for (const s of opt.series) {
    expect(s.itemStyle.borderWidth).toBe(2)
    expect(s.itemStyle.borderColor).toBe(theme.surface)
  }
})

test('tooltip formatter runs without throwing and includes $ for the cost row', () => {
  const opt: any = buildCostByTokenTypeOption(data, theme)
  const costRowParams = [{ dataIndex: 1 }]
  const tokenRowParams = [{ dataIndex: 0 }]
  expect(() => opt.tooltip.formatter(costRowParams)).not.toThrow()
  expect(() => opt.tooltip.formatter(tokenRowParams)).not.toThrow()
  const costText = opt.tooltip.formatter(costRowParams)
  expect(costText).toContain('$')
  expect(costText).toContain('花費')
})

test('all-zero data yields 0 percentages, not NaN', () => {
  const zero: CostByTokenType = {
    output: { cost: 0, tokens: 0 },
    cacheCreation: { cost: 0, tokens: 0 },
    cacheRead: { cost: 0, tokens: 0 },
    input: { cost: 0, tokens: 0 },
  }
  const opt: any = buildCostByTokenTypeOption(zero, theme)
  for (const s of opt.series) {
    expect(s.data[0]).toBe(0)
    expect(s.data[1]).toBe(0)
  }
})
