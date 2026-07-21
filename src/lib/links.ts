import type { LinkItem } from '../types'

type UrlResult =
  | { valid: true; value: string }
  | { valid: false; error: string }

/**
 * Accepts a pasted web address and returns one canonical http(s) URL.
 * Keeping this rule here prevents the form and future extension from disagreeing.
 */
export function validateAndNormalizeUrl(rawUrl: string): UrlResult {
  const trimmed = rawUrl.trim()

  if (!trimmed) {
    return { valid: false, error: 'Enter a link first.' }
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+-.]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)

    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      return { valid: false, error: 'Use a valid http or https link.' }
    }

    return { valid: true, value: url.toString() }
  } catch {
    return { valid: false, error: 'Use a valid http or https link.' }
  }
}

/** Turns one comma-separated field into stable, display-ready tags. */
export function parseTags(rawTags: string): string[] {
  return [...new Set(rawTags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
}

/** Uses the hostname as a useful title when the user intentionally leaves title blank. */
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

/** Matches the one search box against every field a user expects to find. */
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

/** A tiny development-time guard for the one non-trivial trust-boundary rule. */
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
