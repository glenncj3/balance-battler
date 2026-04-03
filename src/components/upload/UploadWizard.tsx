'use client'

import { useReducer, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { showToast } from '@/components/ui/Toast'
import { ImageDropzone } from './ImageDropzone'
import { CsvDropzone } from './CsvDropzone'

type Step = 'input' | 'validating' | 'results' | 'preview' | 'uploading' | 'done'

interface ValidationResult {
  matched: { filename: string; name: string; rarity: string; cardType: string }[]
  unmatched: { filename: string; reason: string }[]
  unmatchedImages: string[]
}

interface WizardState {
  step: Step
  imageFiles: File[]
  csvFile: File | null
  validationResult: ValidationResult | null
  uploadProgress: number
  uploadTotal: number
  error: string | null
}

type WizardAction =
  | { type: 'SET_IMAGES'; payload: File[] }
  | { type: 'SET_CSV'; payload: File | null }
  | { type: 'START_VALIDATION' }
  | { type: 'VALIDATION_DONE'; payload: ValidationResult }
  | { type: 'VALIDATION_ERROR'; payload: string }
  | { type: 'GO_TO_PREVIEW' }
  | { type: 'START_UPLOAD' }
  | { type: 'UPLOAD_PROGRESS'; payload: { current: number; total: number } }
  | { type: 'UPLOAD_DONE' }
  | { type: 'UPLOAD_ERROR'; payload: string }
  | { type: 'RESET' }

const initialState: WizardState = {
  step: 'input',
  imageFiles: [],
  csvFile: null,
  validationResult: null,
  uploadProgress: 0,
  uploadTotal: 0,
  error: null,
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_IMAGES':
      return { ...state, imageFiles: action.payload }
    case 'SET_CSV':
      return { ...state, csvFile: action.payload }
    case 'START_VALIDATION':
      return { ...state, step: 'validating', error: null }
    case 'VALIDATION_DONE':
      return { ...state, step: 'results', validationResult: action.payload }
    case 'VALIDATION_ERROR':
      return { ...state, step: 'input', error: action.payload }
    case 'GO_TO_PREVIEW':
      return { ...state, step: 'preview' }
    case 'START_UPLOAD':
      return { ...state, step: 'uploading', uploadProgress: 0, error: null }
    case 'UPLOAD_PROGRESS':
      return { ...state, uploadProgress: action.payload.current, uploadTotal: action.payload.total }
    case 'UPLOAD_DONE':
      return { ...state, step: 'done' }
    case 'UPLOAD_ERROR':
      return { ...state, step: 'results', error: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

interface UploadWizardProps {
  setId: string
  gameId: string
}

export function UploadWizard({ setId, gameId }: UploadWizardProps) {
  const router = useRouter()
  const [state, dispatch] = useReducer(reducer, initialState)

  const handleImageDrop = useCallback((files: File[]) => {
    dispatch({ type: 'SET_IMAGES', payload: files })
  }, [])

  const handleCsvDrop = useCallback((files: File[]) => {
    dispatch({ type: 'SET_CSV', payload: files[0] || null })
  }, [])

  const handleValidate = useCallback(async () => {
    if (state.imageFiles.length === 0) {
      showToast.error('Please add at least one image')
      return
    }
    if (!state.csvFile) {
      showToast.error('Please add a CSV metadata file')
      return
    }

    dispatch({ type: 'START_VALIDATION' })

    try {
      const formData = new FormData()
      formData.append('csv', state.csvFile)
      state.imageFiles.forEach((f) => formData.append('images', f))
      formData.append('mode', 'validate')

      const res = await fetch(`/api/sets/${setId}/cards`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Validation failed')
      }

      const data = await res.json()
      dispatch({
        type: 'VALIDATION_DONE',
        payload: {
          matched: data.matched || [],
          unmatched: data.unmatched || [],
          unmatchedImages: data.unmatchedImages || [],
        },
      })
    } catch (err) {
      dispatch({
        type: 'VALIDATION_ERROR',
        payload: err instanceof Error ? err.message : 'Validation failed',
      })
    }
  }, [state.imageFiles, state.csvFile, setId])

  const handleConfirmUpload = useCallback(async () => {
    dispatch({ type: 'START_UPLOAD' })

    try {
      const formData = new FormData()
      formData.append('csv', state.csvFile!)
      state.imageFiles.forEach((f) => formData.append('images', f))
      formData.append('mode', 'upload')

      const total = state.validationResult?.matched.length || state.imageFiles.length
      dispatch({ type: 'UPLOAD_PROGRESS', payload: { current: 0, total } })

      const res = await fetch(`/api/sets/${setId}/cards`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await res.json()
      dispatch({ type: 'UPLOAD_PROGRESS', payload: { current: data.created || total, total } })
      dispatch({ type: 'UPLOAD_DONE' })
      showToast.success(`${data.created || total} cards uploaded successfully`)
    } catch (err) {
      dispatch({
        type: 'UPLOAD_ERROR',
        payload: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }, [state.csvFile, state.imageFiles, state.validationResult, setId])

  // Step: input
  if (state.step === 'input') {
    return (
      <div className="space-y-6">
        {state.error && (
          <div className="rounded-lg border border-red-800/50 bg-red-900/30 px-4 py-3 text-sm text-error">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">Card Images</h3>
            <ImageDropzone files={state.imageFiles} onDrop={handleImageDrop} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">CSV Metadata</h3>
            <CsvDropzone file={state.csvFile} onDrop={handleCsvDrop} />
          </div>
        </div>

        <div className="rounded-lg border border-border-default bg-bg-secondary p-4 text-sm text-text-secondary">
          <p className="font-medium text-text-primary mb-2">CSV Format</p>
          <p>Your CSV should have these columns (header row required):</p>
          <code className="mt-2 block rounded bg-bg-tertiary px-3 py-2 text-xs font-mono text-text-primary">
            filename,name,rarity,type
          </code>
          <p className="mt-2">
            The <code className="text-accent-text">filename</code> column should match the image file names exactly.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleValidate}
            disabled={state.imageFiles.length === 0 || !state.csvFile}
          >
            Validate
          </Button>
        </div>
      </div>
    )
  }

  // Step: validating
  if (state.step === 'validating') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <svg
          className="h-10 w-10 animate-spin text-accent"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-text-secondary">Validating files...</p>
      </div>
    )
  }

  // Step: results
  if (state.step === 'results') {
    const vr = state.validationResult!
    return (
      <div className="space-y-6">
        {state.error && (
          <div className="rounded-lg border border-red-800/50 bg-red-900/30 px-4 py-3 text-sm text-error">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-green-800/50 bg-green-900/10 p-4 text-center">
            <p className="text-2xl font-bold text-success">{vr.matched.length}</p>
            <p className="text-sm text-text-secondary">Matched</p>
          </div>
          <div className="rounded-xl border border-yellow-800/50 bg-yellow-900/10 p-4 text-center">
            <p className="text-2xl font-bold text-warning">{vr.unmatchedImages.length}</p>
            <p className="text-sm text-text-secondary">Unmatched Images</p>
          </div>
          <div className="rounded-xl border border-red-800/50 bg-red-900/10 p-4 text-center">
            <p className="text-2xl font-bold text-error">{vr.unmatched.length}</p>
            <p className="text-sm text-text-secondary">Unmatched CSV Rows</p>
          </div>
        </div>

        {/* Matched cards preview */}
        {vr.matched.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Matched Cards ({vr.matched.length})
            </h3>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border-default">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default bg-bg-tertiary">
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Filename</th>
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Rarity</th>
                    <th className="px-3 py-2 text-left font-medium text-text-secondary">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {vr.matched.map((m, i) => (
                    <tr key={i} className="border-b border-border-default last:border-b-0">
                      <td className="px-3 py-2 font-mono text-xs text-text-secondary">{m.filename}</td>
                      <td className="px-3 py-2 text-text-primary">{m.name}</td>
                      <td className="px-3 py-2 text-text-secondary">{m.rarity}</td>
                      <td className="px-3 py-2 text-text-secondary">{m.cardType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Unmatched images */}
        {vr.unmatchedImages.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-warning mb-2">
              Unmatched Images ({vr.unmatchedImages.length})
            </h3>
            <div className="rounded-lg border border-yellow-800/50 bg-yellow-900/10 p-3 text-sm space-y-1">
              {vr.unmatchedImages.map((name, i) => (
                <p key={i} className="font-mono text-xs text-text-secondary">{name}</p>
              ))}
            </div>
          </div>
        )}

        {/* Unmatched CSV rows */}
        {vr.unmatched.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-error mb-2">
              Unmatched CSV Rows ({vr.unmatched.length})
            </h3>
            <div className="rounded-lg border border-red-800/50 bg-red-900/10 p-3 text-sm space-y-1">
              {vr.unmatched.map((u, i) => (
                <p key={i} className="text-xs text-text-secondary">
                  <span className="font-mono">{u.filename}</span> - {u.reason}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={() => dispatch({ type: 'RESET' })}>
            Start Over
          </Button>
          <Button
            onClick={handleConfirmUpload}
            disabled={vr.matched.length === 0}
          >
            Upload {vr.matched.length} Cards
          </Button>
        </div>
      </div>
    )
  }

  // Step: uploading
  if (state.step === 'uploading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        <svg
          className="h-10 w-10 animate-spin text-accent"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <div className="w-64">
          <ProgressBar value={state.uploadProgress} max={state.uploadTotal} />
          <p className="mt-2 text-center text-sm text-text-secondary">
            Uploading cards... {state.uploadProgress} / {state.uploadTotal}
          </p>
        </div>
      </div>
    )
  }

  // Step: done
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30 border border-green-800/50">
        <svg
          className="h-8 w-8 text-success"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-text-primary">Upload Complete</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Your cards have been uploaded successfully.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => dispatch({ type: 'RESET' })}>
          Upload More
        </Button>
        <Button
          onClick={() =>
            router.push(`/dashboard/games/${gameId}/sets/${setId}/manage`)
          }
        >
          Manage Cards
        </Button>
      </div>
    </div>
  )
}
