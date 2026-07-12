// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/i18n/config'
import { buildAggregates } from '../aggregate'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'
import { useDataStore } from '../store/useDataStore'
import { Analysis } from './analysis'

vi.mock('../viz/EChart', () => ({
  EChart: () => <div data-testid="echart-mock" />,
}))

beforeEach(async () => {
  useDataStore.getState().reset()
  await i18n.changeLanguage('en')
})

test('with data → shows dashboard grids and section headings', () => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: '2026-07-11T00:00:00Z' })
  render(<Analysis />)
  expect(screen.getAllByTestId('dashboard-grid').length).toBeGreaterThan(0)
  expect(screen.getByText('Projects & time of day')).toBeTruthy()
  expect(screen.getByText('Efficiency & distribution')).toBeTruthy()
})
