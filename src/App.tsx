import { useEffect, useMemo, useRef, useState } from 'react'
import { AddLinkForm } from './components/AddLinkForm'
import { LinkList } from './components/LinkList'
import { createDemoLinks } from './lib/demo'
import { matchesSearch } from './lib/links'
import { getLinks, replaceLinks, saveLink } from './lib/storage'
import type { LinkItem, LinkStatus, View } from './types'

const navigation: Array<{ id: View; label: string }> = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'today', label: 'Today' },
  { id: 'archive', label: 'Archive' },
]

/** The app shell owns persisted records and the tiny amount of navigation state. */
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
        setStorageError('Later could not read this browser’s local storage.')
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
      setStorageError('Later could not save that change. Your list was left untouched.')
    }
  }

  async function resetDemoData(): Promise<void> {
    if (!window.confirm('Replace every saved link with the five demo links?')) return

    try {
      const demoLinks = createDemoLinks()
      await replaceLinks(demoLinks)
      setLinks(demoLinks)
      setView('inbox')
      setSearch('')
      setArchiveFilter('all')
    } catch {
      setStorageError('Later could not reset the demo data.')
    }
  }

  const title = view === 'inbox' ? 'Inbox' : view === 'today' ? 'Today' : 'Archive'
  const emptyMessage = view === 'inbox'
    ? 'No links waiting. Add one above when something deserves your attention.'
    : view === 'today'
      ? 'Nothing is waiting for today.'
      : 'Nothing has been archived yet.'

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top">Later</a>
        <nav aria-label="Primary navigation" className="navigation">
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
        <p className="sidebar-note">Private to this browser.</p>
      </aside>

      <section className="content" id="top">
        <header className="topbar">
          <div>
            <p className="eyebrow">Link inbox</p>
            <h1>{title}</h1>
          </div>
          <label className="search-box">
            <span className="sr-only">Search this view</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search  /"
              ref={searchInput}
              type="search"
              value={search}
            />
          </label>
        </header>

        <AddLinkForm onAdd={addLink} />

        {view === 'today' && <p className="view-note">{inboxCount} links waiting · oldest first · ten at a time</p>}
        {view === 'archive' && (
          <label className="archive-filter">
            <span>Show</span>
            <select onChange={(event) => setArchiveFilter(event.target.value as typeof archiveFilter)} value={archiveFilter}>
              <option value="all">Everything</option>
              <option value="done">Done</option>
              <option value="discarded">Discarded</option>
            </select>
          </label>
        )}

        {storageError && <p className="storage-error" role="alert">{storageError}</p>}
        {isLoading ? <p className="empty-state">Opening your local inbox…</p> : (
          <LinkList emptyMessage={emptyMessage} items={visibleLinks} onStatusChange={changeStatus} view={view} />
        )}

        <footer>
          <button className="reset-button" onClick={() => void resetDemoData()} type="button">Reset demo data</button>
        </footer>
      </section>
    </main>
  )
}
