import type { LinkItem } from '../types'

type UrlResult =
  | { valid: true; value: string }
  | { valid: false; error: string }

/**
 * 接收粘贴的网址并返回规范化的 HTTP(S) URL。
 * 规则集中在此处，避免表单和未来入口采用不同校验逻辑。
 */
export function validateAndNormalizeUrl(rawUrl: string): UrlResult {
  const trimmed = rawUrl.trim()

  if (!trimmed) {
    return { valid: false, error: '请先输入链接。' }
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+-.]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)

    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      return { valid: false, error: '请输入有效的 HTTP 或 HTTPS 链接。' }
    }

    return { valid: true, value: url.toString() }
  } catch {
    return { valid: false, error: '请输入有效的 HTTP 或 HTTPS 链接。' }
  }
}

/** 将逗号分隔的输入转换为稳定、可展示的标签。 */
export function parseTags(rawTags: string): string[] {
  return [...new Set(rawTags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
}

/** 用户未填写标题时，以域名作为可用的默认标题。 */
export function getDisplayTitle(item: Pick<LinkItem, 'title' | 'url'>): string {
  if (item.title.trim()) {
    return item.title
  }

  try {
    return new URL(item.url).hostname
  } catch {
    return item.url
  }
}

/** 用同一个搜索框匹配用户期望检索的全部字段。 */
export function matchesSearch(item: LinkItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return [item.title, item.url, ...item.tags]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery)
}

/** 开发期的轻量检查，保护唯一的非平凡输入边界规则。 */
export function runLinkChecks(): void {
  const normalized = validateAndNormalizeUrl('example.com/notes')
  const rejected = validateAndNormalizeUrl('ftp://example.com')

  if (!normalized.valid || normalized.value !== 'https://example.com/notes') {
    throw new Error('URL normalization check failed.')
  }

  if (rejected.valid) {
    throw new Error('URL protocol check failed.')
  }
}
