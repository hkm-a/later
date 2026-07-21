import type { LinkItem } from '../types'

/** Creates fresh records so the reset button never reuses stale timestamps or IDs. */
export function createDemoLinks(): LinkItem[] {
  const now = Date.now()
  const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString()

  return [
    {
      id: crypto.randomUUID(),
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API',
      title: 'Using IndexedDB',
      tags: ['web', 'reference'],
      status: 'inbox',
      createdAt: hoursAgo(90),
      updatedAt: hoursAgo(90),
    },
    {
      id: crypto.randomUUID(),
      url: 'https://www.w3.org/WAI/ARIA/apg/patterns/',
      title: 'ARIA Authoring Practices',
      tags: ['accessibility'],
      status: 'inbox',
      createdAt: hoursAgo(60),
      updatedAt: hoursAgo(60),
    },
    {
      id: crypto.randomUUID(),
      url: 'https://www.nngroup.com/articles/ten-usability-heuristics/',
      title: '10 usability heuristics',
      tags: ['product', 'design'],
      status: 'inbox',
      createdAt: hoursAgo(35),
      updatedAt: hoursAgo(35),
    },
    {
      id: crypto.randomUUID(),
      url: 'https://react.dev/learn',
      title: 'Learn React',
      tags: ['react'],
      status: 'done',
      createdAt: hoursAgo(120),
      updatedAt: hoursAgo(12),
    },
    {
      id: crypto.randomUUID(),
      url: 'https://www.example.com/old-idea',
      title: 'Old idea',
      tags: ['archive'],
      status: 'discarded',
      createdAt: hoursAgo(180),
      updatedAt: hoursAgo(24),
    },
  ]
}
