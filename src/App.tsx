import { useEffect, useMemo, useRef, useState } from 'react'
import { AddLinkForm } from './components/AddLinkForm'
import { LinkList } from './components/LinkList'
import { createDemoLinks } from './lib/demo'
import { matchesSearch } from './lib/links'
import { getLinks, replaceLinks, saveLink } from './lib/storage'
import type { LinkItem, LinkStatus, View } from './types'

const navigation: Array<{ id: View; label: string }> = [
  { id: 'inbox', label: '收件箱' },
  { id: 'today', label: '今日' },
  { id: 'archive', label: '归档' },
]

/** 应用外壳统一管理持久化记录和少量导航状态。 */
export default function App() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [view, setView] = useState<View>('inbox')
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'done' | 'discarded'>('all')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [storageError, setStorageError] = useState('')
  const searchInput = useRef<HTMLInputElement>(null)
  const didLoad = useRef(false)

  useEffect(() => {
    if (didLoad.current) return
    didLoad.current = true

    async function loadLinks() {
      try {
        const savedLinks = await getLinks()
        const initialLinks = savedLinks.length ? savedLinks : createDemoLinks()

        if (!savedLinks.length) {
          await replaceLinks(initialLinks)
        }

        setLinks(initialLinks)
      } catch {
        setStorageError('无法读取此浏览器中的本地数据。')
      } finally {
        setIsLoading(false)
      }
    }

    void loadLinks()
  }, [])

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')

      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const visibleLinks = useMemo(() => {
    const inboxLinks = links.filter((link) => link.status === 'inbox')
    const newestFirst = (items: LinkItem[]) => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const oldestFirst = (items: LinkItem[]) => [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    if (view === 'today') {
      return oldestFirst(inboxLinks).slice(0, 10).filter((link) => matchesSearch(link, search))
    }

    if (view === 'archive') {
      const archived = links.filter((link) => link.status !== 'inbox')
      const filteredArchive = archiveFilter === 'all'
        ? archived
        : archived.filter((link) => link.status === archiveFilter)

      return newestFirst(filteredArchive).filter((link) => matchesSearch(link, search))
    }

    return newestFirst(inboxLinks).filter((link) => matchesSearch(link, search))
  }, [archiveFilter, links, search, view])

  const inboxCount = links.filter((link) => link.status === 'inbox').length

  async function addLink(link: LinkItem): Promise<void> {
    await saveLink(link)
    setLinks((currentLinks) => [link, ...currentLinks])
    setView('inbox')
  }

  async function changeStatus(link: LinkItem, status: LinkStatus): Promise<void> {
    const updatedLink = { ...link, status, updatedAt: new Date().toISOString() }

    try {
      await saveLink(updatedLink)
      setLinks((currentLinks) => currentLinks.map((item) => item.id === link.id ? updatedLink : item))
    } catch {
      setStorageError('无法保存此更改，列表内容未被修改。')
    }
  }

  async function resetDemoData(): Promise<void> {
    if (!window.confirm('要用 5 条演示链接替换所有已保存的链接吗？')) return

    try {
      const demoLinks = createDemoLinks()
      await replaceLinks(demoLinks)
      setLinks(demoLinks)
      setView('inbox')
      setSearch('')
      setArchiveFilter('all')
    } catch {
      setStorageError('无法重置演示数据。')
    }
  }

  const title = view === 'inbox' ? '收件箱' : view === 'today' ? '今日' : '归档'
  const emptyMessage = view === 'inbox'
    ? '暂无待处理链接。遇到值得稍后查看的内容时，可在上方添加。'
    : view === 'today'
      ? '今天没有待处理链接。'
      : '尚未归档任何链接。'

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top">Later</a>
        <nav aria-label="主导航" className="navigation">
          {navigation.map((item) => (
            <button
              aria-current={view === item.id ? 'page' : undefined}
              className={view === item.id ? 'nav-item is-active' : 'nav-item'}
              key={item.id}
              onClick={() => setView(item.id)}
              type="button"
            >
              {item.label}
              {item.id === 'inbox' && inboxCount > 0 && <span>{inboxCount}</span>}
            </button>
          ))}
        </nav>
        <p className="sidebar-note">数据仅保存在此浏览器中。</p>
      </aside>

      <section className="content" id="top">
        <header className="topbar">
          <div>
            <p className="eyebrow">链接收件箱</p>
            <h1>{title}</h1>
          </div>
          <label className="search-box">
            <span className="sr-only">搜索当前视图</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索  /"
              ref={searchInput}
              type="search"
              value={search}
            />
          </label>
        </header>

        <AddLinkForm onAdd={addLink} />

        {view === 'today' && <p className="view-note">待处理 {inboxCount} 条 · 最早添加的优先 · 每次最多 10 条</p>}
        {view === 'archive' && (
          <label className="archive-filter">
            <span>显示</span>
            <select onChange={(event) => setArchiveFilter(event.target.value as typeof archiveFilter)} value={archiveFilter}>
              <option value="all">全部</option>
              <option value="done">已完成</option>
              <option value="discarded">已丢弃</option>
            </select>
          </label>
        )}

        {storageError && <p className="storage-error" role="alert">{storageError}</p>}
        {isLoading ? <p className="empty-state">正在打开本地收件箱…</p> : (
          <LinkList emptyMessage={emptyMessage} items={visibleLinks} onStatusChange={changeStatus} view={view} />
        )}

        <footer>
          <button className="reset-button" onClick={() => void resetDemoData()} type="button">重置演示数据</button>
        </footer>
      </section>
    </main>
  )
}
