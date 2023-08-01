import { expect, test } from 'vitest'
import { ExpriesCache } from '../index'
import type { TCacheApiObject } from '../index'

test('init', () => {
  const cacheApis: TCacheApiObject = {
    'test-api': {
      cache: true,
      time: 1,
      cacheType: 'memory',
    },
  }
  const input = {
    cacheApis,
    cacheDriver: undefined,
    name: 'test-cache',
    syncMap: false,
  }
  expect(ExpriesCache.init(input)).resolves.toBeUndefined()
})

test('setMemory', () => {
  expect(
    ExpriesCache.set(
      { api: 'test-api', headers: {}, params: {} },
      { testValue: 'test111' }
    )
  ).resolves.toBeUndefined()
})

test('getMemory', () => {
  expect(
    ExpriesCache.get({ api: 'test-api', headers: {}, params: {} })
  ).resolves.toStrictEqual({ testValue: 'test111' })
})
