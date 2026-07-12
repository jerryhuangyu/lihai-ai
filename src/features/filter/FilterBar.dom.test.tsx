// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import i18n from '@/i18n/config'
import { FilterBar } from './FilterBar'
import { useFilterStore } from './useFilterStore'

beforeEach(async () => {
  useFilterStore.setState({ preset: 'all' })
  await i18n.changeLanguage('en')
})

test('renders presets and updates the store on click', () => {
  render(<FilterBar />)
  fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }))
  expect(useFilterStore.getState().preset).toBe('7d')
})
