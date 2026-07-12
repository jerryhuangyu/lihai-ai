import data from './rates.json'

// Snapshot of LiteLLM per-token-type list prices ($/1M): output (o), input (i),
// cache-read (cr), cache-creation (cc). Refresh with
// `node scripts/update-prices.mjs`. This is the ONLY pricing table the app
// keeps; it feeds the model-efficiency card's "list price" line (via
// outputRate) and per-token-type cost breakdowns (via modelRates). All other
// costs stay ccusage-sourced.
export interface RateSet {
  o: number
  i: number
  cr: number
  cc: number
}

const RATES = data.rates as unknown as Record<string, RateSet>
const FAMILIES = data.families as unknown as Record<string, RateSet>

// Family patterns, specific → general. A newer/unlisted model version resolves
// to its family's canonical rate (flagged as an estimate via exact=false).
const FAM: [string, RegExp][] = [
  ['gpt-5-codex', /gpt-?5-codex/i],
  ['gpt-5-mini', /gpt-?5-mini/i],
  ['opus', /opus/i],
  ['sonnet', /sonnet/i],
  ['haiku', /haiku/i],
  ['gpt-5', /gpt-?5/i],
  ['gpt-4o', /gpt-?4o/i],
  ['gpt-4', /gpt-?4/i],
  ['o4', /(^|[^a-z0-9])o4/i],
  ['o3', /(^|[^a-z0-9])o3/i],
  ['gemini-2.5-pro', /gemini.*2[.-]?5.*pro/i],
  ['gemini-2.5-flash', /gemini.*2[.-]?5.*flash/i],
]

export interface ModelRates {
  /** per-token-type list price ($/1M), or null if the model is unknown */
  rates: RateSet | null
  /** true = exact table hit; false = family estimate or unknown */
  exact: boolean
}

export interface OutputRate {
  /** output token list price in $/1M, or null if the model is unknown */
  rate: number | null
  /** true = exact table hit; false = family estimate or unknown */
  exact: boolean
}

/** Shared resolver: exact table hit, else family fallback, else null. */
export function modelRates(model: string): ModelRates {
  if (Object.prototype.hasOwnProperty.call(RATES, model)) {
    return { rates: RATES[model], exact: true }
  }
  const norm = model.toLowerCase()
  for (const [fam, re] of FAM) {
    if (re.test(norm) && fam in FAMILIES) return { rates: FAMILIES[fam], exact: false }
  }
  return { rates: null, exact: false }
}

export function outputRate(model: string): OutputRate {
  const { rates, exact } = modelRates(model)
  return { rate: rates ? rates.o : null, exact }
}

export const PRICING_META = {
  fetchedAt: data._fetchedAt as string,
  source: data._source as string,
}
