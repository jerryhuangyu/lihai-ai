// @vitest-environment jsdom
import { expect, test, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImportPanel } from './ImportPanel'
import { useDataStore } from '../../store/useDataStore'

vi.mock('../../import/importViaWorker', () => ({
  importViaWorker: vi.fn().mockResolvedValue({ totalSessions: 2, matchedSessions: 2, totalCost: 3, matchedCost: 3 }),
}))

beforeEach(() => useDataStore.getState().reset())

test('shows the copy-command block and a download link', () => {
  render(<ImportPanel />)
  // EXPORT_COMMAND/EXPORT_HINT both repeat "build-bundle.mjs", so a bare
  // /build-bundle\.mjs/ regex matches the <a>, <pre>, and hint <p> at once —
  // anchor on the command block's distinguishing "Downloads/" prefix instead.
  expect(screen.getByText(/Downloads\/build-bundle\.mjs/)).toBeTruthy()
  expect(screen.getByRole('link', { name: /下載/ })).toBeTruthy()
})

test('rejects a non-gz file with an inline error', async () => {
  render(<ImportPanel />)
  const input = screen.getByLabelText(/上傳|bundle/i) as HTMLInputElement
  const file = new File(['x'], 'notes.txt', { type: 'text/plain' })
  fireEvent.change(input, { target: { files: [file] } })
  // EXPORT_HINT and the dropzone's idle-state text both also contain ".gz",
  // so a bare /\.gz/ regex matches 3 elements — anchor on the error copy's
  // unique "bundle 檔" suffix to target the actual error message.
  expect(await screen.findByText(/\.gz bundle 檔/)).toBeTruthy()
})
