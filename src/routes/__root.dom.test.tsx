// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useDataStore } from '../store/useDataStore'
import { RootContent } from './__root'

beforeEach(() => useDataStore.getState().reset())

test('no data → shows import panel', () => {
  render(<RootContent />)
  // build-bundle.mjs appears in the curl command, the fallback link, and the
  // hint at once — anchor on the curl|node pipe unique to the command block.
  expect(screen.getByText(/curl .*build-bundle\.mjs \| node/)).toBeTruthy()
})
