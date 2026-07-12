// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { LiveBlock } from './LiveBlock'
import type { CcusageBlock } from '../../domain/types'

const base: CcusageBlock = {
  id: 'b', startTime: '2000-01-01T00:00:00Z', endTime: '2000-01-01T05:00:00Z',
  costUSD: 12.5, isActive: true, isGap: false, models: ['m'], totalTokens: 0,
  tokenCounts: { inputTokens: 0, outputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 },
  projection: { remainingMinutes: 0, totalCost: 20, totalTokens: 0 },
}

test('renders spend + projection for an active block', () => {
  render(<LiveBlock block={base} />)
  expect(screen.getByText(/已花/)).toBeTruthy()
  expect(screen.getByText(/\$12\.50/)).toBeTruthy()
  expect(screen.getByText(/\$20\.00/)).toBeTruthy()
})

test('zero-span block does not produce NaN width', () => {
  const zero = { ...base, endTime: base.startTime }
  const { container } = render(<LiveBlock block={zero} />)
  expect(container.innerHTML).not.toContain('NaN')
})
