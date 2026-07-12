// @vitest-environment jsdom
import { expect, test, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import i18n from '@/i18n/config'
import { ImportPanel } from './ImportPanel'
import { useDataStore } from '../../store/useDataStore'

vi.mock('../../import/importViaWorker', () => ({
  importViaWorker: vi.fn().mockResolvedValue({ totalSessions: 2, matchedSessions: 2, totalCost: 3, matchedCost: 3 }),
}))

beforeEach(async () => {
  useDataStore.getState().reset()
  await i18n.changeLanguage('en')
})

test('shows the curl one-liner and a no-curl download fallback', () => {
  render(<ImportPanel />)
  // The primary command block is the curl|node pipe — anchor on "curl" so it
  // doesn't collide with the fallback link / hint that also name the script.
  expect(screen.getByText(/curl .*build-bundle\.mjs \| node/)).toBeTruthy()
  expect(screen.getByRole('link', { name: /download/i })).toBeTruthy()
})

test('renders the localized export hint in EN, not the zh-tw source string', () => {
  render(<ImportPanel />)
  expect(screen.getByText(/your data never leaves your machine/i)).toBeTruthy()
  expect(screen.queryByText(/資料不會離開你的電腦/)).toBeNull()
})

test('rejects a non-gz file with an inline error', async () => {
  render(<ImportPanel />)
  const input = screen.getByLabelText(/upload|bundle/i) as HTMLInputElement
  const file = new File(['x'], 'notes.txt', { type: 'text/plain' })
  fireEvent.change(input, { target: { files: [file] } })
  // The localized step1.hint text and the dropzone's idle-state text
  // both also contain ".gz", so a bare /\.gz/ regex matches 3 elements —
  // anchor on the error copy's unique "generated" suffix to target the
  // actual error message.
  expect(await screen.findByText(/\.gz bundle generated/)).toBeTruthy()
})
