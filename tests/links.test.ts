import assert from 'node:assert/strict'

import {
  getDisplayTitle,
  matchesSearch,
  parseTags,
  validateAndNormalizeUrl,
} from '../src/lib/links'
import type { LinkItem } from '../src/types'

const normalizedUrl = validateAndNormalizeUrl(' example.com/notes ')
assert.deepEqual(normalizedUrl, { valid: true, value: 'https://example.com/notes' })

assert.deepEqual(validateAndNormalizeUrl('https://example.com/path?q=1'), {
  valid: true,
  value: 'https://example.com/path?q=1',
})

assert.deepEqual(validateAndNormalizeUrl(''), { valid: false, error: '请先输入链接。' })
assert.deepEqual(validateAndNormalizeUrl('ftp://example.com'), {
  valid: false,
  error: '请输入有效的 HTTP 或 HTTPS 链接。',
})
assert.deepEqual(validateAndNormalizeUrl('http://[invalid'), {
  valid: false,
  error: '请输入有效的 HTTP 或 HTTPS 链接。',
})

assert.deepEqual(parseTags(' React, 设计,react, , 参考 '), ['react', '设计', '参考'])

assert.equal(getDisplayTitle({ title: ' 自定义标题 ', url: 'https://example.com' }), ' 自定义标题 ')
assert.equal(getDisplayTitle({ title: '', url: 'https://developer.mozilla.org/path' }), 'developer.mozilla.org')
assert.equal(getDisplayTitle({ title: '', url: '无法解析的网址' }), '无法解析的网址')

const link: LinkItem = {
  id: 'link-1',
  url: 'https://example.com/articles/typescript',
  title: '轻量测试方案',
  tags: ['typescript', '工程实践'],
  status: 'inbox',
  createdAt: '2026-07-26T00:00:00.000Z',
  updatedAt: '2026-07-26T00:00:00.000Z',
}

assert.equal(matchesSearch(link, ''), true)
assert.equal(matchesSearch(link, ' 测试 '), true)
assert.equal(matchesSearch(link, 'TYPESCRIPT'), true)
assert.equal(matchesSearch(link, 'example.com'), true)
assert.equal(matchesSearch(link, '不存在'), false)
