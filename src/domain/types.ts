export type Agent = string // 'claude' | 'codex' | 'gemini' | ...

export interface TokenCounts {
  input: number
  output: number
  cacheCreation: number
  cacheRead: number
}

export interface ModelBreakdown {
  modelName: string
  cost: number
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
}

export interface CcusagePeriodRow {
  period: string
  agent: Agent
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
  totalTokens: number
  totalCost: number
  modelBreakdowns: ModelBreakdown[]
  modelsUsed: string[]
}

/** session row: `period` holds the session UUID */
export interface CcusageSessionRow extends CcusagePeriodRow {
  lastActivity?: string
}

export interface CcusageBlock {
  id: string
  startTime: string
  endTime: string
  actualEndTime?: string
  costUSD: number
  isActive: boolean
  isGap: boolean
  models: string[]
  totalTokens: number
  tokenCounts: {
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens: number
    cacheReadInputTokens: number
  }
  burnRate?: { costPerHour: number; tokensPerMinute: number }
  projection?: { remainingMinutes: number; totalCost: number; totalTokens: number }
}

export interface CcusageNormalized {
  daily: CcusagePeriodRow[]
  weekly: CcusagePeriodRow[]
  monthly: CcusagePeriodRow[]
  session: CcusageSessionRow[]
  blocks: CcusageBlock[]
}

/** raw usage as it appears in JSONL message.usage */
export interface RawUsage {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
}

export interface RawEvent {
  ts: string
  model: string
  usage: RawUsage
}

export interface BundleSession {
  sessionId: string
  project: string // cwd
  gitBranch?: string
  agent?: Agent
  events: RawEvent[]
}

/** raw ccusage command outputs, as embedded in the bundle */
export interface CcusageRaw {
  daily?: { daily: unknown[]; totals: unknown }
  weekly?: { weekly: unknown[]; totals: unknown }
  monthly?: { monthly: unknown[]; totals: unknown }
  session?: { session: unknown[]; totals: unknown }
  blocks?: { blocks: unknown[] }
}

export interface Bundle {
  v: number
  generatedAt: string
  ccusage: CcusageRaw
  sessions: BundleSession[]
}

/** normalized per-message event (post jsonl parse) */
export interface MessageEvent {
  sessionId: string
  project: string
  gitBranch?: string
  agent: Agent
  ts: string
  model: string
  tokens: TokenCounts
}

/** message event with allocated dollar cost (post join) */
export interface CostedEvent extends MessageEvent {
  cost: number
}

/**
 * The two ratios here live in different universes: totalSessions/matchedSessions
 * count JSONL event-sessions, while totalCost/matchedCost sum ccusage session
 * cost (across ALL agents, not just Claude). They are not two views of the same
 * denominator — the meaningful "coverage %" for cost purposes is
 * matchedCost/totalCost, not matchedSessions/totalSessions.
 */
export interface Coverage {
  totalSessions: number
  matchedSessions: number
  totalCost: number
  matchedCost: number
}
