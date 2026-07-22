import { useState, type FormEvent } from 'react'
import { parseTags, validateAndNormalizeUrl } from '../lib/links'
import type { LinkItem } from '../types'

type AddLinkFormProps = {
  onAdd: (link: LinkItem) => Promise<void>
}

/**
 * 此组件只管理表单草稿，已保存链接由父组件管理，
 * 从而确保无效草稿不会写入 IndexedDB。
 */
export function AddLinkForm({ onAdd }: AddLinkFormProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedUrl = validateAndNormalizeUrl(url)

    if (!normalizedUrl.valid) {
      setError(normalizedUrl.error)
      return
    }

    setError('')
    setIsSaving(true)
    const now = new Date().toISOString()

    try {
      await onAdd({
        id: crypto.randomUUID(),
        url: normalizedUrl.value,
        title: title.trim(),
        tags: parseTags(tags),
        status: 'inbox',
        createdAt: now,
        updatedAt: now,
      })
      setUrl('')
      setTitle('')
      setTags('')
    } catch {
      setError('无法保存此链接，请重试。')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="add-link-form" onSubmit={handleSubmit}>
      <div className="form-primary-row">
        <label className="sr-only" htmlFor="link-url">链接网址</label>
        <input
          autoComplete="url"
          id="link-url"
          inputMode="url"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="粘贴要稍后处理的链接"
          value={url}
        />
        <button disabled={isSaving} type="submit">
          {isSaving ? '保存中…' : '添加链接'}
        </button>
      </div>
      <div className="form-details-row">
        <label className="sr-only" htmlFor="link-title">可选标题</label>
        <input
          id="link-title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="可选标题"
          value={title}
        />
        <label className="sr-only" htmlFor="link-tags">标签</label>
        <input
          id="link-tags"
          onChange={(event) => setTags(event.target.value)}
          placeholder="标签，用逗号分隔"
          value={tags}
        />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  )
}
