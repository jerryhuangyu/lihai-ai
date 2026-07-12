import type { BundleSession, MessageEvent } from '../domain/types'

/** Collapse a cwd path to a stable project label, folding git worktrees back
 *  onto their base repo so multiple worktrees rank as one project. */
export function projectLabel(cwd: string): string {
  // strip trailing slash, split
  const parts = cwd.replace(/\/+$/, '').split('/').filter(Boolean)
  // find a ".worktrees" or "<repo>.worktrees" segment and take the segment before it
  const wtIdx = parts.findIndex((p) => p === '.worktrees' || p.endsWith('.worktrees'))
  if (wtIdx >= 0) {
    const seg = parts[wtIdx]
    if (seg === '.worktrees') return parts[wtIdx - 1] ?? seg
    return seg.replace(/\.worktrees$/, '')
  }
  return parts[parts.length - 1] ?? cwd
}

export function toMessageEvents(sessions: BundleSession[]): MessageEvent[] {
  const out: MessageEvent[] = []
  for (const s of sessions) {
    const project = projectLabel(s.project)
    const agent = s.agent ?? 'claude'
    for (const e of s.events) {
      out.push({
        sessionId: s.sessionId,
        project,
        gitBranch: s.gitBranch,
        agent,
        ts: e.ts,
        model: e.model,
        tokens: {
          input: e.usage.input_tokens ?? 0,
          output: e.usage.output_tokens ?? 0,
          cacheCreation: e.usage.cache_creation_input_tokens ?? 0,
          cacheRead: e.usage.cache_read_input_tokens ?? 0,
        },
      })
    }
  }
  return out
}
