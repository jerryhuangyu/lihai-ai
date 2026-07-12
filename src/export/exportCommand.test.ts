import { expect, test } from 'vitest'
import { exportCommand } from './exportCommand'

test('export command curls the bundle generator and pipes it into node', () => {
  const cmd = exportCommand('https://example.test/lihai-ai/build-bundle.mjs')
  expect(cmd).toContain('build-bundle.mjs')
  expect(cmd).toContain('curl')
  // ESM script over stdin needs the explicit module flag, else node treats it as CJS.
  expect(cmd).toContain('--input-type=module')
})
