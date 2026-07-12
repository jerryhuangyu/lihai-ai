// @vitest-environment jsdom
import { expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiRow } from './KpiRow'
import { useDataStore } from '../../store/useDataStore'
import { buildAggregates } from '../../aggregate'
import { SAMPLE_BUNDLE } from '../../domain/fixtures/bundle.sample'

beforeEach(() => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: 'x' })
})

test('renders total cost, avg/day, burn labels + values', () => {
  render(<KpiRow />)
  expect(screen.getByText(/總花費/)).toBeTruthy()
  // SAMPLE_BUNDLE has a single day, so totalCost === avgPerDay === $3.00;
  // narrowed to getAllByText (matches >1 node) instead of getByText per prior-task pattern.
  expect(screen.getAllByText('$3.00').length).toBeGreaterThan(0)
  expect(screen.getByText(/日均/)).toBeTruthy()
  expect(screen.getByText(/Burn/)).toBeTruthy()
})
