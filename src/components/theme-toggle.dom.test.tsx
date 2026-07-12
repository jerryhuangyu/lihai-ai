// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeToggle } from './theme-toggle'
import { applyTheme, useThemeStore } from '../store/useThemeStore'

beforeEach(() => {
  useThemeStore.setState({ mode: 'system' })
  applyTheme('system')
})

test('clicking cycles the documentElement class system -> light -> dark -> system', () => {
  render(<ThemeToggle />)
  const button = screen.getByRole('button')
  const el = document.documentElement

  // initial: system -> neither class
  expect(el.classList.contains('light')).toBe(false)
  expect(el.classList.contains('dark')).toBe(false)

  fireEvent.click(button)
  expect(el.classList.contains('light')).toBe(true)
  expect(el.classList.contains('dark')).toBe(false)

  fireEvent.click(button)
  expect(el.classList.contains('dark')).toBe(true)
  expect(el.classList.contains('light')).toBe(false)

  fireEvent.click(button)
  expect(el.classList.contains('light')).toBe(false)
  expect(el.classList.contains('dark')).toBe(false)
})
