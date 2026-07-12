import { expect, test } from 'vitest'
import { EXPORT_COMMAND } from './exportCommand'

test('export command references the bundle generator', () => {
  expect(EXPORT_COMMAND).toContain('build-bundle.mjs')
})
