import { expect, test } from 'vitest'
import { resolveRange } from './range'

test('all → wide open bounds', () => {
  expect(resolveRange('all', '2026-07-10')).toEqual({ from: '0000-01-01', to: '9999-12-31' })
})
test('7d → last 7 inclusive days ending today', () => {
  expect(resolveRange('7d', '2026-07-10')).toEqual({ from: '2026-07-04', to: '2026-07-10' })
})
test('30d spans a month boundary', () => {
  expect(resolveRange('30d', '2026-07-10')).toEqual({ from: '2026-06-11', to: '2026-07-10' })
})
