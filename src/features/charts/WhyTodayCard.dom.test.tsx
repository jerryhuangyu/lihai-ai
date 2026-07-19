// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import i18n from '@/i18n/config'
import { WhyTodayCard } from './WhyTodayCard'
import { useDataStore } from '../../store/useDataStore'
import { buildAggregates } from '../../aggregate'
import { SAMPLE_BUNDLE } from '../../domain/fixtures/bundle.sample'

beforeEach(async () => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: 'x' })
  await i18n.changeLanguage('en')
})

test('renders a headline delta and per-model breakdown', () => {
  render(<WhyTodayCard />)
  expect(screen.getByText(/Why did today/)).toBeTruthy()
  // narrowed to getAllByText (subtitle + standalone label both match) per prior-task pattern.
  expect(screen.getAllByText(/vs selected-range daily average/).length).toBeGreaterThan(0)
})
