import { expect, test } from 'vitest'
import { toMessageEvents, projectLabel } from './events'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

test('flattens sessions into events with mapped tokens', () => {
  const ev = toMessageEvents(SAMPLE_BUNDLE.sessions)
  expect(ev).toHaveLength(2)
  expect(ev[0]).toMatchObject({
    sessionId: 'sess-A',
    project: 'app',
    agent: 'claude',
    model: 'claude-opus-4-8',
  })
  expect(ev[0].tokens).toEqual({
    input: 40,
    output: 800,
    cacheCreation: 200,
    cacheRead: 3000,
  })
})

test('projectLabel takes basename', () => {
  expect(projectLabel('/Users/dev/code/app')).toBe('app')
})

test('projectLabel collapses worktree suffix', () => {
  expect(projectLabel('/Users/dev/code/app.worktrees/feature-x')).toBe('app')
  expect(projectLabel('/Users/dev/code/app/.worktrees/feat')).toBe('app')
})

test('agent defaults to claude when absent', () => {
  const ev = toMessageEvents([
    { sessionId: 's', project: '/p', events: [
      { ts: 't', model: 'm', usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
    ] },
  ])
  expect(ev[0].agent).toBe('claude')
})
