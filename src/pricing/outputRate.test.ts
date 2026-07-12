import { expect, test } from 'vitest'
import { modelRates, outputRate, PRICING_META, type RateSet } from './outputRate'
import data from './rates.json'

const rates = data.rates as unknown as Record<string, RateSet>
const families = data.families as unknown as Record<string, RateSet>

test('models present verbatim in the table resolve exactly (exact=true)', () => {
  // These real models exist in the LiteLLM snapshot, so we get precise rates —
  // note sonnet-5 ($10) differs from the sonnet family mode ($15), proving
  // exact beats family when available.
  expect(outputRate('claude-opus-4-8')).toEqual({ rate: rates['claude-opus-4-8'].o, exact: true })
  expect(outputRate('claude-sonnet-5')).toEqual({ rate: rates['claude-sonnet-5'].o, exact: true })
})

test('an unlisted version falls back to its family rate (exact=false)', () => {
  // A version not in the table resolves to the family canonical rate, flagged.
  expect(outputRate('claude-opus-4-99-experimental')).toEqual({
    rate: families.opus.o,
    exact: false,
  })
})

test('unknown / fictional model → null', () => {
  expect(outputRate('big-pickle')).toEqual({ rate: null, exact: false })
  expect(outputRate('fable-5')).toEqual({ rate: null, exact: false })
})

test('meta exposes a fetchedAt date string', () => {
  expect(typeof PRICING_META.fetchedAt).toBe('string')
})

test('modelRates: exact table hit resolves all 4 fields (exact=true)', () => {
  expect(modelRates('claude-opus-4-8')).toEqual({
    rates: rates['claude-opus-4-8'],
    exact: true,
  })
  expect(modelRates('claude-sonnet-5')).toEqual({
    rates: rates['claude-sonnet-5'],
    exact: true,
  })
})

test('modelRates: unlisted version falls back to family 4-field object (exact=false)', () => {
  expect(modelRates('claude-opus-4-99-experimental')).toEqual({
    rates: families.opus,
    exact: false,
  })
})

test('modelRates: unknown / fictional model → { rates: null, exact: false }', () => {
  expect(modelRates('big-pickle')).toEqual({ rates: null, exact: false })
  expect(modelRates('fable-5')).toEqual({ rates: null, exact: false })
})
