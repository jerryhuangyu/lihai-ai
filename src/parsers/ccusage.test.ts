import { expect, test } from 'vitest'
import { normalizeCcusage } from './ccusage'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

test('normalizes daily/session/blocks arrays', () => {
  const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)
  expect(n.daily).toHaveLength(1)
  expect(n.session[0].period).toBe('sess-A')
  expect(n.blocks[0].isActive).toBe(false)
})

test('lifts session metadata.lastActivity', () => {
  const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)
  expect(n.session[0].lastActivity).toBe('2026-07-10T14:00:00.000Z')
})

test('missing commands default to empty arrays', () => {
  const n = normalizeCcusage({})
  expect(n.daily).toEqual([])
  expect(n.session).toEqual([])
  expect(n.blocks).toEqual([])
})
