// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/i18n/config'
import { buildAggregates } from '../aggregate'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'
import { useDataStore } from '../store/useDataStore'
import { Sessions } from './sessions'

vi.mock('../viz/EChart', () => ({
  EChart: () => <div data-testid="echart-mock" />,
}))

beforeEach(async () => {
  useDataStore.getState().reset()
  await i18n.changeLanguage('en')
})

test('with data → shows Session details heading', () => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: '2026-07-11T00:00:00Z' })
  render(<Sessions />)
  expect(screen.getByRole('heading', { name: 'Session details', level: 2 })).toBeTruthy()
})
