import { describe, it, expect } from 'vitest'
import i18n from './config'

describe('i18n config', () => {
  it('初始化並以 en fallback', () => {
    expect(i18n.isInitialized).toBe(true)
    expect(i18n.options.fallbackLng).toContain('en')
  })
  it('common.appName 可解析', () => {
    expect(i18n.getFixedT('en', 'common')('appName')).toBe('AI Usage Dashboard')
  })
})
