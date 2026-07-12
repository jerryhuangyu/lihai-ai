// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n/config'
import { LanguageToggle } from './language-toggle'

describe('LanguageToggle', () => {
  beforeEach(async () => { await i18n.changeLanguage('en') })
  it('點擊在 en / zh 間切換', async () => {
    render(<LanguageToggle />)
    const btn = screen.getByRole('button')
    await userEvent.click(btn)
    expect(i18n.language.startsWith('zh')).toBe(true)
    await userEvent.click(btn)
    expect(i18n.language).toBe('en')
  })
})
