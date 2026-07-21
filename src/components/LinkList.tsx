import { getDisplayTitle } from '../lib/links'
import type { LinkItem, LinkStatus } from '../types'

type LinkListProps = {
  emptyMessage: string
  items: LinkItem[]
  onStatusChange: (item: LinkItem, status: LinkStatus) => Promise<void>
  view: 'inbox' | 'today' | 'archive'
}

/** Renders saved items; status changes remain in App because they affect the shared collection. */
export function LinkList({ emptyMessage, items, onStatusChange, view }: LinkListProps) {
  if (!items.length) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <ul className="link-list">
      {items.map((item) => (
        <li className="link-item" key={item.id}>
          <div className="link-copy">
            <a href={item.url} rel="noreferrer" target="_blank">{getDisplayTitle(item)}</a>
            <p>{getHostname(item.url)} · added {formatDate(item.createdAt)}</p>
            {item.tags.length > 0 && (
              <div aria-label="Tags" className="tag-list">
                {item.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              </div>
            )}
          </div>
          <div className="item-actions">
            {view !== 'archive' && <a className="text-button" href={item.url} rel="noreferrer" target="_blank">Open</a>}
            {item.status === 'inbox' && <button className="text-button" onClick={() => void onStatusChange(item, 'done')} type="button">Done</button>}
            {item.status === 'inbox' && <button className="text-button muted-action" onClick={() => void onStatusChange(item, 'discarded')} type="button">Discard</button>}
            {view === 'archive' && <button className="text-button" onClick={() => void onStatusChange(item, 'inbox')} type="button">Restore</button>}
          </div>
        </li>
      ))}
    </ul>
  )
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(isoDate))
}
