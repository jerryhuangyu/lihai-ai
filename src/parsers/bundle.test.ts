import { expect, test } from 'vitest'
import { gzipSync, strToU8 } from 'fflate'
import { parseBundle, BundleError } from './bundle'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

function gz(obj: unknown): Uint8Array {
  return gzipSync(strToU8(JSON.stringify(obj)))
}

test('parses a valid gzipped bundle', () => {
  const out = parseBundle(gz(SAMPLE_BUNDLE))
  expect(out.v).toBe(1)
  expect(out.sessions).toHaveLength(1)
})

test('throws BundleError on non-gzip bytes', () => {
  expect(() => parseBundle(strToU8('not gzip'))).toThrow(BundleError)
})

test('throws BundleError on wrong version', () => {
  expect(() => parseBundle(gz({ ...SAMPLE_BUNDLE, v: 99 }))).toThrow(/version/i)
})

test('throws BundleError when sessions missing', () => {
  const bad = { v: 1, generatedAt: 'x', ccusage: {} }
  expect(() => parseBundle(gz(bad))).toThrow(BundleError)
})
