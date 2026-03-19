'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { DayAggregation } from '@/lib/availability'
import { DashboardCalendar } from '@/components/DashboardCalendar'
import { BestDaysList } from '@/components/BestDaysList'
import { DmExceptionCalendar } from '@/components/DmExceptionCalendar'
import { UpdatePlanningWindowForm } from '@/components/UpdatePlanningWindowForm'
import { UpdateMaxPlayersForm } from '@/components/UpdateMaxPlayersForm'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { DeleteCampaignButton } from '@/components/DeleteCampaignButton'
import { DmSyncToggle } from '@/components/DmSyncToggle'
import { removePlayer } from '@/lib/actions/campaign'

interface CampaignTabsProps {
  campaignId: string
  joinUrl: string
  windowStartStr: string | null
  windowEndStr: string | null
  dayAggregations: DayAggregation[]
  playerSlots: { id: string; name: string }[]
  missingPlayers: { id: string; name: string }[]
  dmExceptionDates: string[]
  dmExceptionMode: 'block' | 'flag' | null
  maxPlayers: number | null
  playerSlotCount: number
  dmSyncEnabled: boolean
}

function formatWindowDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

function formatPanelDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.475 0l1.085 1.086a1.75 1.75 0 0 1 0 2.474L5.91 13.65a.75.75 0 0 1-.364.194l-3.75.833a.75.75 0 0 1-.906-.906l.833-3.75a.75.75 0 0 1 .194-.364L11.013 1.427Zm1.414 1.06a.25.25 0 0 0-.353 0L3.51 11.05l-.585 2.635 2.634-.586 8.573-8.573a.25.25 0 0 0 0-.354L12.427 2.487Z" fill="currentColor"/>
  </svg>
)


export function CampaignTabs({
  campaignId,
  joinUrl,
  windowStartStr,
  windowEndStr,
  dayAggregations,
  playerSlots,
  missingPlayers,
  dmExceptionDates,
  dmExceptionMode,
  maxPlayers,
  playerSlotCount,
  dmSyncEnabled,
}: CampaignTabsProps) {
  const [activeTab, setActiveTab] = useState<'availability' | 'settings'>('availability')
  const [editingWindow, setEditingWindow] = useState(false)
  const [windowSaved, setWindowSaved] = useState(false)
  const [confirmingPlayerId, setConfirmingPlayerId] = useState<string | null>(null)
  const [players, setPlayers] = useState(playerSlots)
  const [isPending, startTransition] = useTransition()

  // Shared side-panel state — used by both BestDaysList and DashboardCalendar
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Close panel on Escape
  useEffect(() => {
    if (!selectedDate) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setSelectedDate(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedDate])

  // O(1) lookup for the side panel
  const aggMap = new Map<string, DayAggregation>()
  for (const agg of dayAggregations) aggMap.set(agg.date, agg)

  // Called when UpdatePlanningWindowForm succeeds
  const handleWindowSaved = useCallback(() => {
    setEditingWindow(false)
    setWindowSaved(true)
    setTimeout(() => setWindowSaved(false), 3000)
  }, [])

  const windowLabel = windowStartStr && windowEndStr
    ? `${formatWindowDate(windowStartStr)} – ${formatWindowDate(windowEndStr)}`
    : null

  return (
    <>
      {/* ── Snackbar — planning window saved ── */}
      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300
          bg-green-900/90 border border-green-700/60 text-green-300 text-sm px-5 py-3 rounded-xl shadow-2xl
          ${windowSaved ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
        aria-live="polite"
      >
        Planning window updated
      </div>

      {/* ── Shared fixed slide-in date panel ── */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-[51]"
          onClick={() => setSelectedDate(null)}
          aria-hidden="true"
        />
      )}
      <div className={`fixed top-0 right-0 w-80 h-[100dvh] bg-gray-900 border-l border-gray-800
        shadow-2xl z-[52] flex flex-col transition-transform duration-200
        ${selectedDate ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedDate && (() => {
          const agg = aggMap.get(selectedDate)
          return (
            <>
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h3 className="font-semibold text-gray-100">{formatPanelDate(selectedDate)}</h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-100 transition-colors cursor-pointer"
                  aria-label="Close panel"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {agg?.dmBlocked && (
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-amber-400/80 shrink-0">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                      <line x1="8" y1="4.5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>
                    </svg>
                    <span className="text-amber-300/80 text-sm font-medium">DM unavailable</span>
                  </div>
                )}
                {agg && agg.freeCount === 0 && agg.totalPlayers > 0 && (
                  <p className="text-sm text-gray-500 italic">No players available this day.</p>
                )}
                {playerSlots.map(slot => {
                  const status = agg?.playerStatuses[slot.id] ?? 'no-response'
                  return (
                    <div key={slot.id} className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full shrink-0
                        ${status === 'free' ? 'bg-green-400' : 'bg-gray-500'}`}
                      />
                      <span className="text-gray-100 font-medium">{slot.name}</span>
                      <span className={`text-sm ml-auto
                        ${status === 'free' ? 'text-green-400' : 'text-gray-500'}`}>
                        {status === 'free' ? 'Free' : 'No response'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )
        })()}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-0 border-b border-[var(--dnd-border-muted)] mb-6" role="tablist">
        {(['availability', 'settings'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[var(--dnd-accent)] text-white'
                : 'border-transparent text-[var(--dnd-text-muted)] hover:text-gray-200'
            }`}
          >
            {tab === 'availability' ? 'Availability' : 'Settings'}
          </button>
        ))}
      </div>

      {/* ── Availability tab ── */}
      {activeTab === 'availability' && (
        <>
          {/* Awaiting Response — full width above the two-column grid */}
          {missingPlayers.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-2">Awaiting Response</h2>
              <div className="flex flex-wrap gap-2">
                {missingPlayers.map(slot => (
                  <span key={slot.id} className="bg-purple-950/40 border border-[var(--dnd-border-muted)] text-[var(--dnd-text-muted)] text-sm rounded-md px-3 py-1.5">
                    {slot.name}
                  </span>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-2">
                {missingPlayers.length === 1
                  ? '1 player has not yet submitted availability.'
                  : `${missingPlayers.length} players have not yet submitted availability.`}
              </p>
            </section>
          )}

          {/* Two-column grid: sidebar first in DOM (→ top on mobile), calendar second (→ below on mobile) */}
          {/* On desktop (lg+): sidebar placed in right column via col-start-2, calendar in left column via col-start-1 */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

            {/* Sidebar — first in source order so it stacks above calendar on mobile */}
            <aside className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-20">
              {windowStartStr && windowEndStr && (
                <BestDaysList
                  days={dayAggregations}
                  playerSlots={playerSlots}
                  dmExceptionMode={dmExceptionMode}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
            </aside>

            {/* Calendar column — second in source order so it appears below sidebar on mobile */}
            <div className="lg:col-start-1 lg:row-start-1 min-w-0">
              <section>
                {/* Heading row — title + window dates + pencil */}
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 mb-2">
                  <h2 className="text-lg font-semibold text-white">Group Availability</h2>
                  {windowLabel ? (
                    <span className="text-sm text-[var(--dnd-text-muted)]">{windowLabel}</span>
                  ) : (
                    <span className="text-sm text-gray-500 italic">No planning window set</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingWindow(v => !v)}
                    aria-label="Edit planning window"
                    className="p-1 rounded text-[var(--dnd-text-muted)] hover:text-white transition-colors"
                  >
                    <PencilIcon />
                  </button>
                </div>

                {/* Inline planning window editor */}
                {editingWindow && (
                  <div className="border border-[var(--dnd-border-muted)] rounded-lg px-4 pt-4 pb-2 mb-4 bg-[#140326]/80">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-300">Planning Window</p>
                      <button
                        type="button"
                        onClick={() => setEditingWindow(false)}
                        className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>
                    <UpdatePlanningWindowForm
                      campaignId={campaignId}
                      planningWindowStart={windowStartStr}
                      planningWindowEnd={windowEndStr}
                      onSuccess={handleWindowSaved}
                    />
                  </div>
                )}

                {windowStartStr && windowEndStr ? (
                  <>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400" />Free
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-600" />No response
                      </span>
                      {dmExceptionDates.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2.5 h-2.5 rounded border border-amber-400/60" />DM unavailable
                        </span>
                      )}
                    </div>
                    <DashboardCalendar
                      dayAggregations={dayAggregations}
                      playerSlots={playerSlots}
                      windowStart={windowStartStr}
                      windowEnd={windowEndStr}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                    />
                  </>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">
                    Set a planning window to see group availability.
                  </p>
                )}
              </section>
            </div>

          </div>
        </>
      )}

      {/* ── Settings tab ── */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl">

          {/* 1. Join Link */}
          <section className="py-7">
            <h2 className="text-base font-semibold text-white mb-1">Join Link</h2>
            <p className="text-sm text-[var(--dnd-text-muted)] mb-3">Share this link with your players. Anyone who visits it can join the campaign.</p>
            <div className="flex items-center gap-3 bg-[var(--dnd-input-bg)] border border-[#ba7df6]/30 rounded px-4 py-3">
              <span className="flex-1 text-sm font-mono text-[var(--dnd-accent)] truncate">{joinUrl}</span>
              <CopyLinkButton url={joinUrl} />
            </div>
          </section>

          <div className="border-t border-[var(--dnd-border-muted)]" />

          {/* 2. Planning Window */}
          <section className="py-7">
            <h2 className="text-base font-semibold text-white mb-1">Planning Window</h2>
            <p className="text-sm text-[var(--dnd-text-muted)] mb-3">Set the date range for scheduling your next session.</p>
            <UpdatePlanningWindowForm
              campaignId={campaignId}
              planningWindowStart={windowStartStr}
              planningWindowEnd={windowEndStr}
            />
          </section>

          <div className="border-t border-[var(--dnd-border-muted)]" />

          {/* 3. Players */}
          <section className="py-7">
            <h2 className="text-base font-semibold text-white mb-1">Players</h2>
            <p className="text-sm text-[var(--dnd-text-muted)] mb-3">Manage the maximum number of player slots for this campaign.</p>
            {players.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {players.map(player => (
                  <span
                    key={player.id}
                    className={`inline-flex items-center gap-2 pl-4 pr-2 py-2 rounded-full text-base border transition-colors ${
                      confirmingPlayerId === player.id
                        ? 'bg-red-950/40 border-red-700 text-red-300'
                        : 'bg-[var(--dnd-input-bg)] border-gray-700 text-gray-200'
                    }`}
                  >
                    {confirmingPlayerId === player.id ? (
                      <>
                        <span>Remove {player.name}?</span>
                        <button
                          type="button"
                          onClick={() => {
                            const prev = players
                            setPlayers(p => p.filter(x => x.id !== player.id))
                            setConfirmingPlayerId(null)
                            startTransition(async () => {
                              const result = await removePlayer(campaignId, player.id)
                              if (result && 'error' in result) {
                                setPlayers(prev)
                              }
                            })
                          }}
                          disabled={isPending}
                          className="flex items-center justify-center w-6 h-6 rounded-full bg-red-700 hover:bg-red-600 text-white disabled:opacity-50 cursor-pointer transition-colors"
                          aria-label={`Confirm remove ${player.name}`}
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingPlayerId(null)}
                          className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-700 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
                          aria-label="Cancel"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <span>{player.name}</span>
                        <button
                          type="button"
                          onClick={() => setConfirmingPlayerId(player.id)}
                          className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-red-900/60 text-gray-500 hover:text-red-400 cursor-pointer transition-colors"
                          aria-label={`Remove ${player.name}`}
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </span>
                ))}
              </div>
            )}
            <UpdateMaxPlayersForm
              key={String(maxPlayers ?? '')}
              campaignId={campaignId}
              currentMax={maxPlayers}
              currentCount={playerSlotCount}
              alwaysShowForm
            />
          </section>

          <div className="border-t border-[var(--dnd-border-muted)]" />

          {/* 4. My Unavailable Dates */}
          <section className="py-7">
            <h2 className="text-base font-semibold text-white mb-1">My Unavailable Dates</h2>
            <p className="text-sm text-[var(--dnd-text-muted)] mb-4">Mark dates when you can't run a session. These show on the availability calendar.</p>
            {windowStartStr && windowEndStr ? (
              <DmExceptionCalendar
                campaignId={campaignId}
                planningWindowStart={windowStartStr}
                planningWindowEnd={windowEndStr}
                initialExceptions={dmExceptionDates}
                exceptionMode={dmExceptionMode}
              />
            ) : (
              <p className="text-sm text-gray-500 italic">Set a planning window first to mark unavailable dates.</p>
            )}
            <div className="mt-8">
              <DmSyncToggle campaignId={campaignId} initialEnabled={dmSyncEnabled} />
            </div>
          </section>

          <div className="border-t border-[var(--dnd-border-muted)]" />

          {/* 5. Danger Zone */}
          <section className="py-7">
            <h2 className="text-base font-semibold text-white mb-1">Danger Zone</h2>
            <p className="text-sm text-[var(--dnd-text-muted)] mb-3">Permanently delete this campaign and all its data.</p>
            <DeleteCampaignButton campaignId={campaignId} />
          </section>

        </div>
      )}
    </>
  )
}
