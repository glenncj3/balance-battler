'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type { SetConfig, VoteCard as VoteCardType } from '@/types'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { FilterPanel } from './FilterPanel'
import { VotingPair } from './VotingPair'
import { VoteCounter } from './VoteCounter'
import { WhyTags } from './WhyTags'
import { UndoButton } from './UndoButton'
import { VotingComplete } from './VotingComplete'
import { VotingPaused } from './VotingPaused'

// ─── State & Actions ────────────────────────────────────────

type Phase = 'loading' | 'paused' | 'filtering' | 'voting' | 'complete'

interface VoterState {
  phase: Phase
  rarities: string[]
  types: string[]
  selectedRarities: string[]
  selectedTypes: string[]
  showMetadata: boolean
  defaultShowMetadata: boolean
  whyTagsEnabled: boolean
  whyTagLabels: string[]
  currentPair: { cardA: VoteCardType; cardB: VoteCardType } | null
  isLoadingPair: boolean
  isTransitioning: boolean
  voteCount: number
  sessionId: string | null
  lastVote: {
    voteId: string
    cardAId: string
    cardBId: string
    winnerId: string
  } | null
  undoVisible: boolean
  showWhyTags: boolean
  pendingWhyTag: string | null
  pairStartTime: number
  error: string | null
}

type Action =
  | { type: 'CONFIG_LOADED'; payload: ConfigPayload }
  | { type: 'SET_SELECTED_RARITIES'; payload: string[] }
  | { type: 'SET_SELECTED_TYPES'; payload: string[] }
  | { type: 'SET_SHOW_METADATA'; payload: boolean }
  | { type: 'SESSION_CREATED'; payload: { sessionId: string } }
  | { type: 'PAIR_LOADING' }
  | { type: 'PAIR_LOADED'; payload: { cardA: VoteCardType; cardB: VoteCardType } }
  | { type: 'PAIRS_EXHAUSTED' }
  | { type: 'TRANSITION_START' }
  | { type: 'TRANSITION_END' }
  | {
      type: 'VOTE_SUBMITTED'
      payload: { voteId: string; cardAId: string; cardBId: string; winnerId: string }
    }
  | { type: 'SHOW_WHY_TAGS' }
  | { type: 'WHY_TAG_SELECTED'; payload: string }
  | { type: 'HIDE_UNDO' }
  | { type: 'VOTE_UNDONE' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }

interface ConfigPayload {
  votingOpen: boolean
  defaultShowMetadata: boolean
  whyTagsEnabled: boolean
  whyTagLabels: string[]
  rarities: string[]
  types: string[]
}

const initialState: VoterState = {
  phase: 'loading',
  rarities: [],
  types: [],
  selectedRarities: [],
  selectedTypes: [],
  showMetadata: false,
  defaultShowMetadata: false,
  whyTagsEnabled: false,
  whyTagLabels: [],
  currentPair: null,
  isLoadingPair: false,
  isTransitioning: false,
  voteCount: 0,
  sessionId: null,
  lastVote: null,
  undoVisible: false,
  showWhyTags: false,
  pendingWhyTag: null,
  pairStartTime: 0,
  error: null,
}

function reducer(state: VoterState, action: Action): VoterState {
  switch (action.type) {
    case 'CONFIG_LOADED': {
      const { votingOpen, defaultShowMetadata, whyTagsEnabled, whyTagLabels, rarities, types } =
        action.payload
      if (!votingOpen) {
        return { ...state, phase: 'paused' }
      }
      return {
        ...state,
        phase: 'filtering',
        rarities,
        types,
        selectedRarities: [...rarities],
        selectedTypes: [...types],
        showMetadata: defaultShowMetadata,
        defaultShowMetadata,
        whyTagsEnabled,
        whyTagLabels,
      }
    }

    case 'SET_SELECTED_RARITIES':
      return { ...state, selectedRarities: action.payload }

    case 'SET_SELECTED_TYPES':
      return { ...state, selectedTypes: action.payload }

    case 'SET_SHOW_METADATA':
      return { ...state, showMetadata: action.payload }

    case 'SESSION_CREATED':
      return {
        ...state,
        phase: 'voting',
        sessionId: action.payload.sessionId,
        isLoadingPair: true,
      }

    case 'PAIR_LOADING':
      return { ...state, isLoadingPair: true }

    case 'PAIR_LOADED':
      return {
        ...state,
        currentPair: action.payload,
        isLoadingPair: false,
        isTransitioning: false,
        pairStartTime: Date.now(),
      }

    case 'PAIRS_EXHAUSTED':
      return {
        ...state,
        phase: 'complete',
        currentPair: null,
        isLoadingPair: false,
      }

    case 'TRANSITION_START':
      return { ...state, isTransitioning: true }

    case 'TRANSITION_END':
      return { ...state, isTransitioning: false }

    case 'VOTE_SUBMITTED':
      return {
        ...state,
        voteCount: state.voteCount + 1,
        lastVote: action.payload,
        undoVisible: true,
        showWhyTags: state.whyTagsEnabled,
        pendingWhyTag: null,
      }

    case 'SHOW_WHY_TAGS':
      return { ...state, showWhyTags: true }

    case 'WHY_TAG_SELECTED':
      return {
        ...state,
        pendingWhyTag: action.payload,
        showWhyTags: false,
      }

    case 'HIDE_UNDO':
      return {
        ...state,
        undoVisible: false,
        showWhyTags: false,
        lastVote: null,
        pendingWhyTag: null,
      }

    case 'VOTE_UNDONE':
      return {
        ...state,
        voteCount: Math.max(0, state.voteCount - 1),
        undoVisible: false,
        showWhyTags: false,
        lastVote: null,
        pendingWhyTag: null,
      }

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoadingPair: false }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    default:
      return state
  }
}

// ─── Component ──────────────────────────────────────────────

interface VotingArenaProps {
  setConfig: SetConfig
  setSlug: string
}

function VotingArena({ setSlug }: VotingArenaProps) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undoCountdownRef = useRef(5)
  const [, forceRender] = useReducer((x: number) => x + 1, 0)

  // ─── Load config on mount ──────────────────────────────────
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`/api/vote/${setSlug}/config`)
        if (!res.ok) throw new Error('Failed to load voting config')
        const data = await res.json()
        dispatch({
          type: 'CONFIG_LOADED',
          payload: {
            votingOpen: data.votingOpen,
            defaultShowMetadata: data.defaultShowMetadata,
            whyTagsEnabled: data.whyTagsEnabled,
            whyTagLabels: data.whyTagLabels ?? [],
            rarities: data.rarities,
            types: data.types,
          },
        })
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to load config',
        })
      }
    }
    loadConfig()
  }, [setSlug])

  // ─── Fetch next pair ───────────────────────────────────────
  const fetchPair = useCallback(async () => {
    dispatch({ type: 'PAIR_LOADING' })
    try {
      const res = await fetch(`/api/vote/${setSlug}/pair`)
      if (!res.ok) throw new Error('Failed to fetch pair')
      const data = await res.json()
      if (data.exhausted) {
        dispatch({ type: 'PAIRS_EXHAUSTED' })
      } else {
        dispatch({
          type: 'PAIR_LOADED',
          payload: { cardA: data.cardA, cardB: data.cardB },
        })
      }
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to fetch pair',
      })
    }
  }, [setSlug])

  // ─── Start session ─────────────────────────────────────────
  const handleStartVoting = useCallback(async () => {
    try {
      const res = await fetch(`/api/vote/${setSlug}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rarityFilter: state.selectedRarities,
          typeFilter: state.selectedTypes,
          showMetadata: state.showMetadata,
        }),
      })
      if (!res.ok) throw new Error('Failed to create session')
      const data = await res.json()
      dispatch({ type: 'SESSION_CREATED', payload: { sessionId: data.sessionId } })
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to start session',
      })
    }
  }, [setSlug, state.selectedRarities, state.selectedTypes, state.showMetadata])

  // ─── Fetch first pair when session is created ──────────────
  useEffect(() => {
    if (state.phase === 'voting' && state.isLoadingPair && state.currentPair === null) {
      fetchPair()
    }
  }, [state.phase, state.isLoadingPair, state.currentPair, fetchPair])

  // ─── Clear undo timers on unmount ──────────────────────────
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current)
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    }
  }, [])

  // ─── Start undo timer when undoVisible changes ─────────────
  const startUndoTimer = useCallback(() => {
    // Clear any existing timers
    if (undoTimerRef.current) clearInterval(undoTimerRef.current)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)

    undoCountdownRef.current = 5
    forceRender()

    undoTimerRef.current = setInterval(() => {
      undoCountdownRef.current -= 1
      forceRender()
      if (undoCountdownRef.current <= 0) {
        if (undoTimerRef.current) clearInterval(undoTimerRef.current)
      }
    }, 1000)

    undoTimeoutRef.current = setTimeout(() => {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current)
      dispatch({ type: 'HIDE_UNDO' })
    }, 5000)
  }, [])

  // ─── Submit vote ───────────────────────────────────────────
  const handleVote = useCallback(
    async (winnerId: string) => {
      if (!state.currentPair || state.isTransitioning) return

      const { cardA, cardB } = state.currentPair
      const cardAId = cardA.id
      const cardBId = cardB.id
      const decisionTimeMs = Date.now() - state.pairStartTime

      // Start transition
      dispatch({ type: 'TRANSITION_START' })

      try {
        const res = await fetch(`/api/vote/${setSlug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardAId, cardBId, winnerId, decisionTimeMs }),
        })
        if (!res.ok) throw new Error('Failed to submit vote')
        const data = await res.json()

        dispatch({
          type: 'VOTE_SUBMITTED',
          payload: {
            voteId: data.vote.id,
            cardAId,
            cardBId,
            winnerId,
          },
        })

        startUndoTimer()

        // Small delay for transition then fetch next pair
        setTimeout(() => {
          fetchPair()
        }, 200)
      } catch (err) {
        dispatch({ type: 'TRANSITION_END' })
        dispatch({
          type: 'SET_ERROR',
          payload: err instanceof Error ? err.message : 'Failed to submit vote',
        })
      }
    },
    [state.currentPair, state.isTransitioning, state.pairStartTime, setSlug, fetchPair, startUndoTimer]
  )

  // ─── Skip pair ─────────────────────────────────────────────
  const handleSkip = useCallback(async () => {
    if (!state.currentPair || state.isTransitioning) return

    const { cardA, cardB } = state.currentPair
    const decisionTimeMs = Date.now() - state.pairStartTime

    dispatch({ type: 'TRANSITION_START' })

    try {
      await fetch(`/api/vote/${setSlug}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardAId: cardA.id,
          cardBId: cardB.id,
          decisionTimeMs,
        }),
      })

      setTimeout(() => {
        fetchPair()
      }, 200)
    } catch (err) {
      dispatch({ type: 'TRANSITION_END' })
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to skip pair',
      })
    }
  }, [state.currentPair, state.isTransitioning, state.pairStartTime, setSlug, fetchPair])

  // ─── Undo vote ─────────────────────────────────────────────
  const handleUndo = useCallback(async () => {
    if (!state.lastVote) return

    // Clear undo timers
    if (undoTimerRef.current) clearInterval(undoTimerRef.current)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)

    try {
      const res = await fetch(`/api/vote/${setSlug}/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteId: state.lastVote.voteId }),
      })
      if (!res.ok) throw new Error('Failed to undo vote')

      dispatch({ type: 'VOTE_UNDONE' })
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to undo vote',
      })
    }
  }, [state.lastVote, setSlug])

  // ─── Why tag selection ─────────────────────────────────────
  const handleWhyTagSelect = useCallback(
    async (tag: string) => {
      dispatch({ type: 'WHY_TAG_SELECTED', payload: tag })
      // Send the why tag to the API (fire-and-forget update)
      if (state.lastVote) {
        // The vote API accepts whyTag on submission; for post-hoc tagging
        // we just store it locally for now. The next vote can include it.
      }
    },
    [state.lastVote]
  )

  // ─── Keyboard shortcuts ────────────────────────────────────
  const shortcuts = useMemo(
    () => ({
      '1': () => {
        if (state.currentPair) handleVote(state.currentPair.cardA.id)
      },
      ArrowLeft: () => {
        if (state.currentPair) handleVote(state.currentPair.cardA.id)
      },
      '2': () => {
        if (state.currentPair) handleVote(state.currentPair.cardB.id)
      },
      ArrowRight: () => {
        if (state.currentPair) handleVote(state.currentPair.cardB.id)
      },
      z: () => {
        if (state.undoVisible) handleUndo()
      },
      s: () => {
        if (state.currentPair) handleSkip()
      },
    }),
    [state.currentPair, state.undoVisible, handleVote, handleUndo, handleSkip]
  )

  useKeyboardShortcuts(shortcuts, state.phase === 'voting')

  // ─── Render ────────────────────────────────────────────────

  if (state.phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm text-text-secondary">Loading...</span>
        </div>
      </div>
    )
  }

  if (state.phase === 'paused') {
    return <VotingPaused />
  }

  if (state.phase === 'filtering') {
    return (
      <FilterPanel
        rarities={state.rarities}
        types={state.types}
        selectedRarities={state.selectedRarities}
        selectedTypes={state.selectedTypes}
        showMetadata={state.showMetadata}
        defaultShowMetadata={state.defaultShowMetadata}
        onRaritiesChange={(s) =>
          dispatch({ type: 'SET_SELECTED_RARITIES', payload: s })
        }
        onTypesChange={(s) =>
          dispatch({ type: 'SET_SELECTED_TYPES', payload: s })
        }
        onMetadataToggle={(v) =>
          dispatch({ type: 'SET_SHOW_METADATA', payload: v })
        }
        onStartVoting={handleStartVoting}
      />
    )
  }

  if (state.phase === 'complete') {
    return <VotingComplete totalVotes={state.voteCount} />
  }

  // Phase: voting
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Error banner */}
      {state.error && (
        <div className="w-full max-w-2xl rounded-lg border border-red-800/50 bg-red-900/30 px-4 py-3 text-sm text-error">
          <div className="flex items-center justify-between">
            <span>{state.error}</span>
            <button
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
              className="ml-3 text-error/70 hover:text-error"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Vote counter */}
      {state.voteCount > 0 && <VoteCounter count={state.voteCount} />}

      {/* Loading state */}
      {state.isLoadingPair && !state.currentPair && (
        <div className="flex items-center justify-center py-16">
          <svg
            className="h-8 w-8 animate-spin text-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}

      {/* Voting pair */}
      {state.currentPair && (
        <VotingPair
          cardA={state.currentPair.cardA}
          cardB={state.currentPair.cardB}
          showMetadata={state.showMetadata}
          onVote={handleVote}
          onSkip={handleSkip}
          isTransitioning={state.isTransitioning}
        />
      )}

      {/* Why tags */}
      {state.whyTagsEnabled && state.whyTagLabels.length > 0 && (
        <WhyTags
          tags={state.whyTagLabels}
          selectedTag={state.pendingWhyTag}
          onSelect={handleWhyTagSelect}
          visible={state.showWhyTags}
        />
      )}

      {/* Keyboard shortcut hints (desktop only) */}
      {state.currentPair && (
        <div className="hidden items-center gap-4 text-xs text-text-tertiary md:flex">
          <span>
            <kbd className="rounded border border-border-default bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px]">
              1
            </kbd>{' '}
            or{' '}
            <kbd className="rounded border border-border-default bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px]">
              &larr;
            </kbd>{' '}
            Left
          </span>
          <span>
            <kbd className="rounded border border-border-default bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px]">
              2
            </kbd>{' '}
            or{' '}
            <kbd className="rounded border border-border-default bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px]">
              &rarr;
            </kbd>{' '}
            Right
          </span>
          <span>
            <kbd className="rounded border border-border-default bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px]">
              S
            </kbd>{' '}
            Skip
          </span>
          <span>
            <kbd className="rounded border border-border-default bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px]">
              Z
            </kbd>{' '}
            Undo
          </span>
        </div>
      )}

      {/* Undo button */}
      <UndoButton
        visible={state.undoVisible}
        onUndo={handleUndo}
        timeRemaining={undoCountdownRef.current}
      />
    </div>
  )
}

export { VotingArena }
export type { VotingArenaProps }
