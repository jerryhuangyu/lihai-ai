// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useDataStore } from '../store/useDataStore'
import { RootContent } from './__root'

beforeEach(() => useDataStore.getState().reset())

test('no data → shows import panel', () => {
  render(<RootContent />)
  // A bare /build-bundle\.mjs/ regex matches the <a>, <pre>, and hint <p> at
  // once inside ImportPanel (see ImportPanel.dom.test.tsx) — anchor on the
  // command block's distinguishing "Downloads/" prefix instead.
  expect(screen.getByText(/Downloads\/build-bundle\.mjs/)).toBeTruthy()
})
