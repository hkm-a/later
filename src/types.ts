export type LinkStatus = 'inbox' | 'done' | 'discarded'

/** A link saved by the user. This is the only persisted application record. */
export type LinkItem = {
  id: string
  url: string
  title: string
  tags: string[]
  status: LinkStatus
  createdAt: string
  updatedAt: string
}

export type View = 'inbox' | 'today' | 'archive'
