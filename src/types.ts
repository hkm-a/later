export type LinkStatus = 'inbox' | 'done' | 'discarded'

/** 用户保存的链接，也是应用唯一的持久化记录。 */
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
