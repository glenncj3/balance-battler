'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { showToast } from '@/components/ui/Toast'

interface GameSettings {
  id: string
  name: string
  slug: string
  description: string | null
}

export default function GameSettingsPage() {
  const params = useParams<{ gameId: string }>()
  const router = useRouter()
  const [game, setGame] = useState<GameSettings | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/games/${params.gameId}`)
        if (!res.ok) throw new Error('Failed to load game')
        const data = await res.json()
        setGame(data)
        setName(data.name)
        setSlug(data.slug)
        setDescription(data.description || '')
      } catch (err) {
        showToast.error(err instanceof Error ? err.message : 'Failed to load game')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.gameId])

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!slug.trim()) errs.slug = 'Slug is required'
    else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
      errs.slug = 'Slug must be lowercase alphanumeric with hyphens'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const res = await fetch(`/api/games/${params.gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      showToast.success('Game settings saved')
      router.refresh()
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/games/${params.gameId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete game')
      showToast.success('Game deleted')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to delete game')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-text-secondary">Loading settings...</span>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="py-16 text-center text-text-secondary">
        Game not found.
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-text-primary mb-6">Game Settings</h2>

      <form onSubmit={handleSave} className="space-y-5">
        <Input
          label="Game Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          error={errors.slug}
          helperText="Used in URLs. Lowercase letters, numbers, and hyphens only."
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>

      <hr className="my-8 border-border-default" />

      <div className="rounded-xl border border-red-800/50 bg-red-900/10 p-6">
        <h3 className="text-lg font-semibold text-error">Danger Zone</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Deleting this game will permanently remove all of its sets, cards, and vote data.
          This action cannot be undone.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => setShowDeleteConfirm(true)}
          loading={deleting}
        >
          Delete Game
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Game"
        message={`Are you sure you want to delete "${game.name}"? All sets, cards, and votes will be permanently removed.`}
        confirmLabel="Delete Game"
        variant="danger"
      />
    </div>
  )
}
