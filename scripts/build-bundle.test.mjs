import { test, expect } from 'vitest'
import { gzipSync } from 'node:zlib'
import { parseBundle } from '../src/parsers/bundle'

test('generator envelope round-trips through parseBundle', () => {
  const bundle = {
    v: 1, generatedAt: 'x', ccusage: { daily: {}, session: {}, blocks: {} }, sessions: [],
  }
  const bytes = new Uint8Array(gzipSync(Buffer.from(JSON.stringify(bundle))))
  const parsed = parseBundle(bytes)
  expect(parsed.v).toBe(1)
  expect(parsed.sessions).toEqual([])
})
