// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import i18n from '@/i18n/config'
import { ThemeToggle } from './theme-toggle'
import { applyTheme, useThemeStore } from '../store/useThemeStore'

beforeEach(async () => {
  // 斷言前固定語言為 en，避免 jsdom 的 LanguageDetector 結果不穩定造成 CI flaky。
  await i18n.changeLanguage('en')
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

test('aria-label reflects the current theme in English', () => {
  render(<ThemeToggle />)
  const button = screen.getByRole('button')

  expect(button.getAttribute('aria-label')).toBe('Theme: follow system')

  fireEvent.click(button)
  expect(button.getAttribute('aria-label')).toBe('Theme: light')

  fireEvent.click(button)
  expect(button.getAttribute('aria-label')).toBe('Theme: dark')
})
