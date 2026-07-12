import { expect, test } from 'vitest'
import {
  CATEGORICAL_LIGHT, CATEGORICAL_DARK, TOKEN_COLORS, categorical,
  sequentialBlue, SEQUENTIAL_BLUE_LIGHT,
} from './palette'

test('fixed 6-hue order, light + dark', () => {
  expect(CATEGORICAL_LIGHT).toEqual(['#2f7ed8','#e8700a','#8a54e0','#159c5b','#d13b6e','#0aa6c2'])
  expect(CATEGORICAL_DARK[1]).toBe('#d1660a') // orange darkened for dark band
  expect(CATEGORICAL_LIGHT).toHaveLength(6)
})

test('categorical(theme) picks the matching set', () => {
  expect(categorical('light')).toBe(CATEGORICAL_LIGHT)
  expect(categorical('dark')).toBe(CATEGORICAL_DARK)
})

test('token colors map to fixed semantic hues', () => {
  expect(TOKEN_COLORS.input).toBe(CATEGORICAL_LIGHT[0])       // blue
  expect(TOKEN_COLORS.output).toBe(CATEGORICAL_LIGHT[1])      // orange
  expect(TOKEN_COLORS.cacheCreation).toBe(CATEGORICAL_LIGHT[2]) // purple
  expect(TOKEN_COLORS.cacheRead).toBe(CATEGORICAL_LIGHT[5])   // cyan
})

test('sequential blue ramp is light→dark, 5 stops', () => {
  expect(sequentialBlue('light')).toBe(SEQUENTIAL_BLUE_LIGHT)
  expect(SEQUENTIAL_BLUE_LIGHT).toHaveLength(5)
})
