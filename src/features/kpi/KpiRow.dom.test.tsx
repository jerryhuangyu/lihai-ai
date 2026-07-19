// @vitest-environment jsdom
import { expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/i18n/config'
import { KpiRow } from './KpiRow'
import { useDataStore } from '../../store/useDataStore'
import { buildAggregates } from '../../aggregate'
import { SAMPLE_BUNDLE } from '../../domain/fixtures/bundle.sample'

beforeEach(async () => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: 'x' })
  await i18n.changeLanguage('en')
})

test('renders range-scoped KPI labels + values (cost + typed prompts, no burn)', () => {
  render(<KpiRow />)
  expect(screen.getByText(/Total cost/)).toBeTruthy()
  // SAMPLE_BUNDLE has a single day, so totalCost === avgPerDay === $3.00;
  // narrowed to getAllByText (matches >1 node) instead of getByText per prior-task pattern.
  expect(screen.getAllByText('$3.00').length).toBeGreaterThan(0)
  expect(screen.getByText(/Avg cost per day/)).toBeTruthy()
  expect(screen.getByText(/Total typed prompts/)).toBeTruthy()
  expect(screen.getByText(/Avg typed/)).toBeTruthy()
  // Burn rate moved to LiveStatusRow — must NOT be in the range-scoped KpiRow.
  expect(screen.queryByText(/Burn/)).toBeNull()
})
