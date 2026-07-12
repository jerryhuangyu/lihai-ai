#!/usr/bin/env node
// Snapshots per-model, per-token-type list price ($/1M) from LiteLLM's
// community pricing DB into src/pricing/rates.json. Run periodically (or via
// CI) to refresh; commit the diff. This is the ONLY pricing table the app
// keeps — used to show true list prices (output, input, cache-read,
// cache-creation) alongside the ccusage-derived effective (blended) cost. All
// other costs remain ccusage-sourced.
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const URL =
  'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'

const res = await fetch(URL)
if (!res.ok) throw new Error(`LiteLLM fetch failed: ${res.status}`)
const db = await res.json()

// Keep only coding-agent-relevant model families, keyed by LiteLLM model name.
const KEEP = /(claude|gpt-|^o[0-9]|gemini|opus|sonnet|haiku)/i

// $/1M, 2dp; 0 when the field is absent or not a positive number (many models
// legitimately have no cache pricing).
const perMillion = (n) => (typeof n === 'number' && n > 0 ? Math.round(n * 1e6 * 100) / 100 : 0)

const rates = {}
for (const [name, v] of Object.entries(db)) {
  if (name === 'sample_spec') continue
  if (!KEEP.test(name)) continue
  const outPerTok = v?.output_cost_per_token
  if (typeof outPerTok !== 'number' || outPerTok <= 0) continue // output anchors inclusion
  rates[name] = {
    o: perMillion(outPerTok),
    i: perMillion(v?.input_cost_per_token),
    cr: perMillion(v?.cache_read_input_token_cost),
    cc: perMillion(v?.cache_creation_input_token_cost),
  }
}

// Canonical per-family rate (mode across matching keys), for fuzzy lookup of
// model names not present verbatim in LiteLLM (newer versions, aliases). Order
// matters: more specific families first so 'gpt-5-codex' wins over 'gpt-5'.
const FAMILIES = [
  ['opus', /claude.*opus/i],
  ['sonnet', /claude.*sonnet/i],
  ['haiku', /claude.*haiku/i],
  ['gpt-5-codex', /gpt-5-codex/i],
  ['gpt-5-mini', /gpt-5-mini/i],
  ['gpt-5', /gpt-5(?!-codex|-mini)/i],
  ['gpt-4o', /gpt-4o/i],
  ['gpt-4', /gpt-4(?!o)/i],
  ['o4', /(^|[^a-z])o4/i],
  ['o3', /(^|[^a-z])o3/i],
  ['gemini-2.5-pro', /gemini-2\.5-pro/i],
  ['gemini-2.5-flash', /gemini-2\.5-flash/i],
]
const mode = (nums) => {
  const c = new Map()
  for (const n of nums) c.set(n, (c.get(n) ?? 0) + 1)
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}
const TYPE_KEYS = ['o', 'i', 'cr', 'cc']
const families = {}
for (const [fam, re] of FAMILIES) {
  const matching = Object.entries(rates).filter(([k]) => re.test(k))
  if (matching.length === 0) continue
  const entry = {}
  for (const key of TYPE_KEYS) {
    const m = mode(matching.map(([, v]) => v[key]))
    if (m !== undefined) entry[key] = m
  }
  families[fam] = entry
}

const out = {
  _source: 'litellm',
  _url: URL,
  _fetchedAt: new Date().toISOString().slice(0, 10),
  _note:
    'per-token-type list price in USD per 1M tokens (o=output, i=input, cr=cache-read, cc=cache-creation); refresh via scripts/update-prices.mjs',
  families,
  rates,
}

const dest = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pricing', 'rates.json')
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n')
console.log(`Wrote ${dest}: ${Object.keys(rates).length} models, fetchedAt ${out._fetchedAt}`)
