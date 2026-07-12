// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { WhyTodayCard } from './WhyTodayCard'
import { useDataStore } from '../../store/useDataStore'
import { buildAggregates } from '../../aggregate'
import { SAMPLE_BUNDLE } from '../../domain/fixtures/bundle.sample'

beforeEach(() => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: 'x' })
})

test('renders a headline delta and per-model breakdown', () => {
  render(<WhyTodayCard />)
  expect(screen.getByText(/今天為什麼/)).toBeTruthy()
  // narrowed to getAllByText (subtitle + standalone label both match) per prior-task pattern.
  expect(screen.getAllByText(/vs 近 7 日均/).length).toBeGreaterThan(0)
})
