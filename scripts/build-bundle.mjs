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

function parseSession(file) {
  const events = []
  let sessionId, project, gitBranch
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue
    let o
    try { o = JSON.parse(line) } catch { continue }
    sessionId ??= o.sessionId
    project ??= o.cwd
    gitBranch ??= o.gitBranch
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
  return { sessionId, project: project ?? 'unknown', gitBranch, events }
}

const projectsDir = join(homedir(), '.claude', 'projects')
const sessions = walk(projectsDir).map(parseSession).filter(Boolean)

const bundle = {
  v: 1,
  generatedAt: new Date().toISOString(),
  ccusage: {
    daily: ccusage('daily'),
    session: ccusage('session'),
    blocks: ccusage('blocks'),
  },
  sessions,
}

const out = join(homedir(), 'cc-usage-bundle.json.gz')
writeFileSync(out, gzipSync(Buffer.from(JSON.stringify(bundle))))
console.log(`Wrote ${out} (${sessions.length} sessions)`)
