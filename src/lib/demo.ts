import type { LinkItem } from '../types'

/** 每次生成新记录，避免重置时复用旧时间戳或 ID。 */
export function createDemoLinks(): LinkItem[] {
  const now = Date.now()
  const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString()

  return [
    {
      id: crypto.randomUUID(),
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API',
      title: '使用 IndexedDB 存储数据',
      tags: ['网页', '参考'],
      status: 'inbox',
      createdAt: hoursAgo(90),
      updatedAt: hoursAgo(90),
    },
    {
      id: crypto.randomUUID(),
      url: 'https://www.w3.org/WAI/ARIA/apg/patterns/',
      title: 'ARIA 编写实践',
      tags: ['无障碍'],
      status: 'inbox',
      createdAt: hoursAgo(60),
      updatedAt: hoursAgo(60),
    },
    {
      id: crypto.randomUUID(),
      url: 'https://www.nngroup.com/articles/ten-usability-heuristics/',
      title: '10 条可用性启发原则',
      tags: ['产品', '设计'],
      status: 'inbox',
      createdAt: hoursAgo(35),
      updatedAt: hoursAgo(35),
    },
    {
      id: crypto.randomUUID(),
      url: 'https://react.dev/learn',
      title: '学习 React',
      tags: ['react'],
      status: 'done',
      createdAt: hoursAgo(120),
      updatedAt: hoursAgo(12),
    },
    {
      id: crypto.randomUUID(),
      url: 'https://www.example.com/old-idea',
      title: '旧想法',
      tags: ['归档'],
      status: 'discarded',
      createdAt: hoursAgo(180),
      updatedAt: hoursAgo(24),
    },
  ]
}
