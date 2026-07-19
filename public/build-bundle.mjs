#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { gzipSync } from 'node:zlib'

function ccusage(cmd) {
  const out = execFileSync('npx', ['-y', 'ccusage@latest', cmd, '--json'], {
    encoding: 'utf8', maxBuffer: 1 << 28,
  })
  return JSON.parse(out)
}

function walk(dir) {
  const files = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) files.push(...walk(p))
    else if (name.endsWith('.jsonl')) files.push(p)
  }
  return files
}

// A real user prompt: a user-role line that isn't an auto-injected tool result,
// meta reminder, compaction summary, or subagent (sidechain) message. content is
// either a plain string or blocks that include human text/image (tool_result
// blocks are excluded). typed = human keyboard input: everything real except
// prompts submitted programmatically (promptSource === 'sdk'); logs predating
// the promptSource field are treated as typed.
function classifyPrompt(o) {
  if (o.type !== 'user' || o.message?.role !== 'user') return null
  if (o.isMeta === true || o.isSidechain === true || o.isCompactSummary === true) return null
  const c = o.message.content
  const isPrompt = typeof c === 'string'
    ? true
    : Array.isArray(c) && c.some((b) => b.type === 'text' || b.type === 'image')
  if (!isPrompt) return null
  return { typed: o.promptSource !== 'sdk' }
}

function parseSession(file) {
  const events = []
  let sessionId, project, gitBranch
  let typedPrompts = 0
  let allPrompts = 0
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue
    let o
    try { o = JSON.parse(line) } catch { continue }
    sessionId ??= o.sessionId
    project ??= o.cwd
    gitBranch ??= o.gitBranch
    const prompt = classifyPrompt(o)
    if (prompt) {
      allPrompts++
      if (prompt.typed) typedPrompts++
    }
    const u = o.message?.usage
    if (u && o.message?.model) {
      events.push({
        ts: o.timestamp,
        model: o.message.model,
        usage: {
          input_tokens: u.input_tokens ?? 0,
          output_tokens: u.output_tokens ?? 0,
          cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
          cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
        },
      })
    }
  }
  if (!sessionId || events.length === 0) return null
  return { sessionId, project: project ?? 'unknown', gitBranch, events, typedPrompts, allPrompts }
}

const projectsDir = join(homedir(), '.claude', 'projects')
const sessions = walk(projectsDir).map(parseSession).filter(Boolean)

const bundle = {
  v: 2,
  generatedAt: new Date().toISOString(),
  ccusage: {
    daily: ccusage('daily'),
    session: ccusage('session'),
    blocks: ccusage('blocks'),
  },
  sessions,
}

const out = join(homedir(), 'lihai-bundle.json.gz')
writeFileSync(out, gzipSync(Buffer.from(JSON.stringify(bundle))))
console.log(`Wrote ${out} (${sessions.length} sessions)`)
