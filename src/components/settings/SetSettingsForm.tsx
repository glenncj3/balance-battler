'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { showToast } from '@/components/ui/Toast'

interface SetData {
  id: string
  name: string
  slug: string
  description: string | null
  votingOpen: boolean
  defaultShowMetadata: boolean
  minVoteThreshold: number
  balanceZoneSd: number
  voterLimit: number | null
  whyTagsEnabled: boolean
  whyTagLabels: string[]
}

interface SetSettingsFormProps {
  setId: string
  gameId: string
}

export function SetSettingsForm({ setId, gameId }: SetSettingsFormProps) {
  const [set, setSet] = useState<SetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [votingOpen, setVotingOpen] = useState(true)
  const [defaultShowMetadata, setDefaultShowMetadata] = useState(false)
  const [minVoteThreshold, setMinVoteThreshold] = useState(10)
  const [balanceZoneSd, setBalanceZoneSd] = useState(1.5)
  const [voterLimit, setVoterLimit] = useState('')
  const [whyTagsEnabled, setWhyTagsEnabled] = useState(true)
  const [whyTagLabels, setWhyTagLabels] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  // Dialogs
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadSet = useCallback(async () => {
    try {
      const res = await fetch(`/api/sets/${setId}`)
      if (!res.ok) throw new Error('Failed to load set')
      const data = await res.json()
      setSet(data)
      setName(data.name)
      setSlug(data.slug)
      setDescription(data.description || '')
      setVotingOpen(data.votingOpen)
      setDefaultShowMetadata(data.defaultShowMetadata)
      setMinVoteThreshold(data.minVoteThreshold)
      setBalanceZoneSd(data.balanceZoneSd)
      setVoterLimit(data.voterLimit?.toString() || '')
      setWhyTagsEnabled(data.whyTagsEnabled)
      setWhyTagLabels(data.whyTagLabels || [])
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to load set')
    } finally {
      setLoading(false)
    }
  }, [setId])

  useEffect(() => {
    loadSet()
  }, [loadSet])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      showToast.error('Name is required')
      return
    }
    if (!slug.trim()) {
      showToast.error('Slug is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/sets/${setId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          votingOpen,
          defaultShowMetadata,
          minVoteThreshold,
          balanceZoneSd,
          voterLimit: voterLimit ? parseInt(voterLimit, 10) : null,
          whyTagsEnabled,
          whyTagLabels,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      showToast.success('Set settings saved')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function handleAddTag() {
    const trimmed = newTag.trim()
    if (trimmed && !whyTagLabels.includes(trimmed)) {
      setWhyTagLabels([...whyTagLabels, trimmed])
      setNewTag('')
    }
  }

  function handleRemoveTag(index: number) {
    setWhyTagLabels(whyTagLabels.filter((_, i) => i !== index))
  }

  async function handleResetRatings() {
    setResetting(true)
    try {
      // Reset all cards in the set by calling the API
      const res = await fetch(`/api/sets/${setId}/cards?action=reset-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to reset ratings')
      showToast.success('All ratings have been reset')
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to reset ratings')
    } finally {
      setResetting(false)
      setShowResetConfirm(false)
    }
  }

  async function handleDeleteSet() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/sets/${setId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete set')
      showToast.success('Set deleted')
      window.location.href = `/dashboard/games/${gameId}`
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to delete set')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg
          className="h-8 w-8 animate-spin text-accent"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!set) {
    return (
      <div className="py-16 text-center text-text-secondary">Set not found.</div>
    )
  }

  const votingUrl = typeof window !== 'undefined' ? `${window.location.origin}/vote/${slug}` : `/vote/${slug}`

  return (
    <div className="max-w-2xl space-y-8">
      <form onSubmit={handleSave} className="space-y-6">
        <h2 className="text-lg font-bold text-text-primary">General</h2>

        <Input
          label="Set Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          helperText="Used in voting URLs."
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <hr className="border-border-default" />

        <h2 className="text-lg font-bold text-text-primary">Voting</h2>

        {/* Voting link */}
        <div className="rounded-lg border border-border-default bg-bg-tertiary p-3">
          <p className="text-xs font-medium text-text-secondary mb-1">Voting Link</p>
          <p className="text-sm font-mono text-accent-text break-all">{votingUrl}</p>
        </div>

        <Checkbox
          label="Voting Open"
          checked={votingOpen}
          onChange={setVotingOpen}
        />

        <Checkbox
          label="Show card metadata by default"
          checked={defaultShowMetadata}
          onChange={setDefaultShowMetadata}
        />

        <Input
          label="Minimum Vote Threshold"
          type="number"
          value={minVoteThreshold.toString()}
          onChange={(e) => setMinVoteThreshold(parseInt(e.target.value, 10) || 0)}
          helperText="Number of votes needed before a card is considered confident."
        />

        <Input
          label="Balance Zone (Std Deviations)"
          type="number"
          value={balanceZoneSd.toString()}
          onChange={(e) => setBalanceZoneSd(parseFloat(e.target.value) || 0)}
          helperText="Cards within this many standard deviations of the mean are considered balanced."
        />

        <Input
          label="Voter Limit"
          type="number"
          value={voterLimit}
          onChange={(e) => setVoterLimit(e.target.value)}
          helperText="Maximum number of voters allowed. Leave empty for unlimited."
          placeholder="Unlimited"
        />

        <hr className="border-border-default" />

        <h2 className="text-lg font-bold text-text-primary">Why Tags</h2>

        <Checkbox
          label="Enable Why Tags"
          checked={whyTagsEnabled}
          onChange={setWhyTagsEnabled}
        />

        {whyTagsEnabled && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Tags that voters can attach to explain their choice.
            </p>
            <div className="flex flex-wrap gap-2">
              {whyTagLabels.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-tertiary px-3 py-1 text-sm text-text-primary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(i)}
                    className="text-text-tertiary hover:text-error transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 rounded-lg border border-border-default bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddTag}>
                Add
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" loading={saving}>
            Save Settings
          </Button>
        </div>
      </form>

      <hr className="border-border-default" />

      {/* Reset Ratings */}
      <div className="rounded-xl border border-yellow-800/50 bg-yellow-900/10 p-6">
        <h3 className="text-lg font-semibold text-warning">Reset All Ratings</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Reset all card ratings back to 1500 and clear all vote data. This cannot be undone.
        </p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => setShowResetConfirm(true)}
          loading={resetting}
        >
          Reset Ratings
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-800/50 bg-red-900/10 p-6">
        <h3 className="text-lg font-semibold text-error">Danger Zone</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Deleting this set will permanently remove all cards and vote data. This action cannot be undone.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => setShowDeleteConfirm(true)}
          loading={deleting}
        >
          Delete Set
        </Button>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        onConfirm={handleResetRatings}
        onCancel={() => setShowResetConfirm(false)}
        title="Reset All Ratings"
        message="Are you sure? All card ratings will be reset to 1500 and all vote records will be cleared. This action cannot be undone."
        confirmLabel="Reset All"
        variant="danger"
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleDeleteSet}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Set"
        message={`Are you sure you want to delete "${set.name}"? All cards and votes will be permanently removed.`}
        confirmLabel="Delete Set"
        variant="danger"
      />
    </div>
  )
}
