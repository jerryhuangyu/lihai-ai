import type { Bundle } from '../types'

export const SAMPLE_BUNDLE: Bundle = {
  v: 2,
  generatedAt: '2026-07-11T00:00:00.000Z',
  ccusage: {
    daily: {
      daily: [
        {
          period: '2026-07-10',
          agent: 'claude',
          inputTokens: 100,
          outputTokens: 2000,
          cacheCreationTokens: 500,
          cacheReadTokens: 8000,
          totalTokens: 10600,
          totalCost: 3.0,
          modelsUsed: ['claude-opus-4-8'],
          modelBreakdowns: [
            {
              modelName: 'claude-opus-4-8',
              cost: 3.0,
              inputTokens: 100,
              outputTokens: 2000,
              cacheCreationTokens: 500,
              cacheReadTokens: 8000,
            },
          ],
        },
      ],
      totals: {},
    },
    weekly: { weekly: [], totals: {} },
    monthly: { monthly: [], totals: {} },
    session: {
      session: [
        {
          period: 'sess-A',
          agent: 'claude',
          inputTokens: 100,
          outputTokens: 2000,
          cacheCreationTokens: 500,
          cacheReadTokens: 8000,
          totalTokens: 10600,
          totalCost: 3.0,
          modelsUsed: ['claude-opus-4-8'],
          metadata: { lastActivity: '2026-07-10T14:00:00.000Z' },
          modelBreakdowns: [
            {
              modelName: 'claude-opus-4-8',
              cost: 3.0,
              inputTokens: 100,
              outputTokens: 2000,
              cacheCreationTokens: 500,
              cacheReadTokens: 8000,
            },
          ],
        },
      ],
      totals: {},
    },
    blocks: {
      blocks: [
        {
          id: '2026-07-10T12:00:00.000Z',
          startTime: '2026-07-10T12:00:00.000Z',
          endTime: '2026-07-10T17:00:00.000Z',
          actualEndTime: '2026-07-10T14:00:00.000Z',
          costUSD: 3.0,
          isActive: false,
          isGap: false,
          models: ['claude-opus-4-8'],
          totalTokens: 10600,
          tokenCounts: {
            inputTokens: 100,
            outputTokens: 2000,
            cacheCreationInputTokens: 500,
            cacheReadInputTokens: 8000,
          },
          burnRate: { costPerHour: 1.5, tokensPerMinute: 88 },
          projection: { remainingMinutes: 0, totalCost: 3.0, totalTokens: 10600 },
        },
      ],
    },
  },
  sessions: [
    {
      sessionId: 'sess-A',
      project: '/Users/dev/code/app',
      gitBranch: 'main',
      agent: 'claude',
      typedPrompts: 2,
      allPrompts: 3,
      events: [
        {
          ts: '2026-07-10T13:00:00.000Z',
          model: 'claude-opus-4-8',
          usage: {
            input_tokens: 40,
            output_tokens: 800,
            cache_creation_input_tokens: 200,
            cache_read_input_tokens: 3000,
          },
        },
        {
          ts: '2026-07-10T13:30:00.000Z',
          model: 'claude-opus-4-8',
          usage: {
            input_tokens: 60,
            output_tokens: 1200,
            cache_creation_input_tokens: 300,
            cache_read_input_tokens: 5000,
          },
        },
      ],
    },
  ],
}
