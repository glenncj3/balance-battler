'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { showToast } from '@/components/ui/Toast'

interface CreateSetFormProps {
  open: boolean
  onClose: () => void
  gameId: string
}

export function CreateSetForm({ open, onClose, gameId }: CreateSetFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleNameChange(value: string) {
    setName(value)
    if (!slug || slug === toSlug(name)) {
      setSlug(toSlug(value))
    }
  }

  function toSlug(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create set')
      }

      const set = await res.json()
      showToast.success(`Set "${set.name}" created`)
      handleClose()
      router.push(`/dashboard/games/${gameId}/sets/${set.id}`)
      router.refresh()
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Failed to create set')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setName('')
    setSlug('')
    setDescription('')
    setErrors({})
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create Set" size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Set Name"
          placeholder="e.g. Base Set"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          error={errors.name}
        />
        <Input
          label="Slug"
          placeholder="e.g. base-set"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          error={errors.slug}
          helperText="Used in voting URLs. Lowercase letters, numbers, and hyphens only."
        />
        <Textarea
          label="Description"
          placeholder="Brief description of the set (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Set
          </Button>
        </div>
      </form>
    </Modal>
  )
}
