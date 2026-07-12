// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest'
import { applyTheme, useThemeStore } from './useThemeStore'

beforeEach(() => {
  document.documentElement.classList.remove('dark', 'light')
  useThemeStore.setState({ mode: 'system' })
})

test('applyTheme(dark) adds dark class and removes light', () => {
  applyTheme('dark')
  expect(document.documentElement.classList.contains('dark')).toBe(true)
  expect(document.documentElement.classList.contains('light')).toBe(false)
})

test('applyTheme(light) adds light class and removes dark', () => {
  applyTheme('light')
  expect(document.documentElement.classList.contains('light')).toBe(true)
  expect(document.documentElement.classList.contains('dark')).toBe(false)
})

test('applyTheme(system) removes both classes', () => {
  applyTheme('dark')
  applyTheme('system')
  expect(document.documentElement.classList.contains('dark')).toBe(false)
  expect(document.documentElement.classList.contains('light')).toBe(false)
})

test('setMode updates store mode and applies the class', () => {
  useThemeStore.getState().setMode('dark')
  expect(useThemeStore.getState().mode).toBe('dark')
  expect(document.documentElement.classList.contains('dark')).toBe(true)
})
