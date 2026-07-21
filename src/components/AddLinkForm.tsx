import { useState, type FormEvent } from 'react'
import { parseTags, validateAndNormalizeUrl } from '../lib/links'
import type { LinkItem } from '../types'

type AddLinkFormProps = {
  onAdd: (link: LinkItem) => Promise<void>
}

/**
 * This component owns temporary form text only. The parent owns saved links,
 * which keeps an invalid draft from ever reaching IndexedDB.
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
      setError('Could not save this link. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="add-link-form" onSubmit={handleSubmit}>
      <div className="form-primary-row">
        <label className="sr-only" htmlFor="link-url">Link URL</label>
        <input
          autoComplete="url"
          id="link-url"
          inputMode="url"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste a link to deal with later"
          value={url}
        />
        <button disabled={isSaving} type="submit">
          {isSaving ? 'Saving…' : 'Add link'}
        </button>
      </div>
      <div className="form-details-row">
        <label className="sr-only" htmlFor="link-title">Optional title</label>
        <input
          id="link-title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Optional title"
          value={title}
        />
        <label className="sr-only" htmlFor="link-tags">Tags</label>
        <input
          id="link-tags"
          onChange={(event) => setTags(event.target.value)}
          placeholder="Tags, separated by commas"
          value={tags}
        />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  )
}
