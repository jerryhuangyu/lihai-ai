import { expect, test } from 'vitest'
import { usd, tokensCompact, pct, deltaLabel } from './format'

test('usd formats with thousands + 2 decimals', () => {
  expect(usd(1234.5)).toBe('$1,234.50')
  expect(usd(0)).toBe('$0.00')
})

test('tokensCompact abbreviates', () => {
  expect(tokensCompact(1_200_000)).toBe('1.2M')
  expect(tokensCompact(3400)).toBe('3.4k')
  expect(tokensCompact(500)).toBe('500')
})

test('pct with 1 decimal default', () => {
  expect(pct(0.1234)).toBe('12.3%')
})

test('deltaLabel gives direction', () => {
  expect(deltaLabel(12)).toEqual({ text: '+12.0%', dir: 'up' })
  expect(deltaLabel(-5)).toEqual({ text: '-5.0%', dir: 'down' })
  expect(deltaLabel(0)).toEqual({ text: '0.0%', dir: 'flat' })
})
