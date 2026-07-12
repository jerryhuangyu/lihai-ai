// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { FilterBar } from './FilterBar'
import { useFilterStore } from './useFilterStore'

beforeEach(() => useFilterStore.setState({ preset: 'all' }))

test('renders presets and updates the store on click', () => {
  render(<FilterBar />)
  fireEvent.click(screen.getByRole('button', { name: '近 7 日' }))
  expect(useFilterStore.getState().preset).toBe('7d')
})
