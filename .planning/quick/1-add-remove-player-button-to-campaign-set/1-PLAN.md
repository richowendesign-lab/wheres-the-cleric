---
phase: quick-1-remove-player
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/actions/campaign.ts
  - src/components/CampaignTabs.tsx
autonomous: true
requirements:
  - REMOVE-PLAYER-01
must_haves:
  truths:
    - "Each player row in Settings > Players shows a remove button"
    - "Clicking remove shows inline confirmation with the player name"
    - "Confirming deletes the player and their availability data"
    - "Cancelling returns the row to normal state with no data change"
    - "DM must own the campaign to remove a player"
    - "After deletion the player list refreshes without a full page reload"
  artifacts:
    - path: "src/lib/actions/campaign.ts"
      provides: "removePlayer server action"
      contains: "export async function removePlayer"
    - path: "src/components/CampaignTabs.tsx"
      provides: "Inline confirm UI per player row in Settings Players section"
      contains: "confirmingPlayerId"
  key_links:
    - from: "src/components/CampaignTabs.tsx"
      to: "src/lib/actions/campaign.ts"
      via: "removePlayer(campaignId, playerId) call"
      pattern: "removePlayer"
---

<objective>
Add a "Remove" button to each player row in the Settings tab's Players section. Clicking shows inline confirm/cancel text; confirming calls a server action that deletes the PlayerSlot (cascading to AvailabilityEntry records) and revalidates the campaign page. The DM must own the campaign.

Purpose: DMs need a way to remove players who have left the campaign.
Output: `removePlayer` server action + inline confirm UI in the Players section of Settings.
</objective>

<execution_context>
@/Users/richardowen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/richardowen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

@src/lib/actions/campaign.ts
@src/components/CampaignTabs.tsx
@src/components/DmSyncToggle.tsx
@src/components/DeleteCampaignButton.tsx

<interfaces>
<!-- Key patterns the executor needs. Extracted from codebase. -->

Auth + ownership pattern (from campaign.ts):
```typescript
const dm = await getSessionDM()
if (!dm) return { error: 'Not authenticated' }
const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { dmId: true } })
if (!campaign || campaign.dmId !== dm.id) return { error: 'Unauthorized' }
```

Revalidation pattern:
```typescript
revalidatePath(`/campaigns/${campaignId}`)
return { success: true }
```

Optimistic UI with rollback pattern (from DmSyncToggle.tsx):
```typescript
const prev = localState
setLocalState(next)          // optimistic update
const result = await action()
if ('error' in result) {
  setLocalState(prev)        // rollback on failure
}
```

Schema — PlayerSlot (onDelete: Cascade already set on Campaign relation):
```
model PlayerSlot {
  id                  String              @id @default(cuid())
  campaignId          String
  name                String
  availabilityEntries AvailabilityEntry[] // deleted via cascade
  campaign            Campaign            @relation(fields: [campaignId], references: [id], onDelete: Cascade)
}
```

CampaignTabsProps (relevant fields):
```typescript
campaignId: string
playerSlots: { id: string; name: string }[]
```

Settings > Players section currently renders UpdateMaxPlayersForm — player rows with names are NOT currently rendered there. The `playerSlots` prop contains the list. The executor must add the player list rendering with remove buttons to this section.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add removePlayer server action</name>
  <files>src/lib/actions/campaign.ts</files>
  <action>
    Add `export async function removePlayer(campaignId: string, playerSlotId: string)` to the bottom of the file.

    Implementation:
    1. Call `getSessionDM()` — return `{ error: 'Not authenticated' }` if null.
    2. Query campaign with `select: { dmId: true }` — return `{ error: 'Unauthorized' }` if not found or dmId !== dm.id.
    3. Delete the PlayerSlot: `await prisma.playerSlot.delete({ where: { id: playerSlotId } })`. AvailabilityEntry records cascade automatically via the existing schema relation.
    4. Call `revalidatePath('/campaigns/${campaignId}')`.
    5. Return `{ success: true }`.
    6. Wrap in try/catch — return `{ error: 'Failed to remove player. Please try again.' }` on exception.

    Return type: `Promise<{ success: true } | { error: string }>`
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>removePlayer is exported from campaign.ts, TypeScript compiles clean, follows the same auth + ownership + revalidate pattern as other actions in the file.</done>
</task>

<task type="auto">
  <name>Task 2: Add player list with inline remove confirm to Settings Players section</name>
  <files>src/components/CampaignTabs.tsx</files>
  <action>
    In `CampaignTabs.tsx`:

    1. Import `removePlayer` from `@/lib/actions/campaign`.
    2. Import `useTransition` from react (already has useState, useEffect, useCallback — add useTransition).
    3. Add state: `const [confirmingPlayerId, setConfirmingPlayerId] = useState<string | null>(null)`.
    4. Add state for optimistic list: `const [players, setPlayers] = useState(playerSlots)`. Keep this in sync — on successful removal, filter out the deleted player optimistically before revalidation resolves.
    5. Add `const [isPending, startTransition] = useTransition()`.

    In the Settings tab, Players section (currently after the `<h2>Players</h2>` heading and description, before `UpdateMaxPlayersForm`), add a player list:

    ```
    {players.length > 0 && (
      <ul className="mb-4 space-y-1">
        {players.map(player => (
          <li key={player.id} className="flex items-center justify-between py-1.5">
            {confirmingPlayerId === player.id ? (
              // Inline confirmation state
              <span className="flex items-center gap-3 text-sm">
                <span className="text-gray-300">Remove {player.name}?</span>
                <button
                  type="button"
                  onClick={() => {
                    const prev = players
                    setPlayers(p => p.filter(x => x.id !== player.id))
                    setConfirmingPlayerId(null)
                    startTransition(async () => {
                      const result = await removePlayer(campaignId, player.id)
                      if (result && 'error' in result) {
                        setPlayers(prev)  // rollback
                      }
                    })
                  }}
                  disabled={isPending}
                  className="text-red-400 hover:text-red-300 font-medium disabled:opacity-50 cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingPlayerId(null)}
                  className="text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
              </span>
            ) : (
              // Default row state
              <>
                <span className="text-sm text-gray-200">{player.name}</span>
                <button
                  type="button"
                  onClick={() => setConfirmingPlayerId(player.id)}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    )}
    ```

    Place the list between the section description `<p>` and the `<UpdateMaxPlayersForm>`. The existing description text ("Manage the maximum number of player slots…") can stay as-is — the player list renders above the form.

    Do NOT change any other section, the planning window section, or the availability tab.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    - TypeScript compiles clean.
    - Players section in Settings shows each player's name with a "Remove" button.
    - Clicking "Remove" replaces the row with "Remove [name]? Confirm Cancel".
    - "Cancel" restores the default row.
    - "Confirm" optimistically removes the row and calls removePlayer; on server error the row is restored.
    - Empty player list renders nothing (list is hidden).
  </done>
</task>

</tasks>

<verification>
After both tasks:
- `npx tsc --noEmit` exits 0
- `npm run build` completes without errors
- In the browser: Settings > Players section shows the player list with Remove buttons above the max players form
- Inline confirm text shows player name: "Remove Alice?"
- Confirming a removal causes the row to disappear immediately (optimistic), and the server revalidates the route
</verification>

<success_criteria>
- `removePlayer` server action exists in campaign.ts, guards DM ownership, deletes PlayerSlot (cascading AvailabilityEntry), revalidates the campaign path
- Each player row in Settings > Players has a Remove button that triggers inline confirm/cancel
- Optimistic removal with rollback on server error (same pattern as DmSyncToggle)
- No TypeScript errors, no build failures
</success_criteria>

<output>
After completion, create `.planning/quick/1-add-remove-player-button-to-campaign-set/1-SUMMARY.md`
</output>
