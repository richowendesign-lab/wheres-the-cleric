# Phase 12: Share Modal - Research

**Researched:** 2026-03-09
**Domain:** Next.js 16 App Router — URL search param modal trigger, clipboard copy, Server Component / Client Component boundary
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHARE-01 | DM sees a share modal automatically after creating a campaign | URL search param pattern: `createCampaign` appends `?share=1` to redirect; `CampaignDetailPage` reads `searchParams.share` and conditionally mounts `ShareModal` (which opens by default via `useState(true)`) |
| SHARE-02 | DM can copy the join link with one click (button gives "Copied!" feedback) | `CopyLinkButton` pattern already in production — identical `navigator.clipboard.writeText` + `useState(false)` for "Copied!" transient state; copy directly into `ShareModal` |
| SHARE-03 | Join link is displayed in a read-only field in the modal | Render `joinUrl` prop in a `<input type="text" readOnly>` or `<code>` block inside `ShareModal`; `joinUrl` already computed in `CampaignDetailPage` from `joinToken` |
| SHARE-04 | DM can copy a pre-written invite message (includes link + player instructions) | Second `CopyButton` inside `ShareModal` — same pattern as SHARE-02 with a different string; message built inline from `joinUrl` prop |
| SHARE-05 | DM can dismiss the modal to proceed to the campaign dashboard | `dismiss()` handler sets `open` to `false` and calls `router.replace(window.location.pathname, { scroll: false })` to clean `?share=1` from URL |
</phase_requirements>

---

## Summary

Phase 12 is a focused, low-complexity phase. It adds three discrete changes: (1) a one-line modification to the `createCampaign` server action to append `?share=1` to the redirect destination, (2) a `searchParams` prop added to `CampaignDetailPage` to read and pass the flag to a new `ShareModal` component, and (3) the `ShareModal` client component itself.

There are zero new npm dependencies. The clipboard copy pattern (`CopyLinkButton.tsx`) and the join URL construction logic (`CampaignDetailPage`) are already in production. The architecture is fully documented in the project's existing research files. The URL search param trigger pattern is the only viable approach given that `redirect()` in a server action throws a NEXT_REDIRECT exception — no client state survives the navigation boundary, making URL params the sole durable signal.

The only meaningful decisions left for the planner are: the exact pre-written invite message text, whether the modal dismisses on backdrop click (yes — standard pattern), and whether to use native `<dialog>` element or a `<div>` overlay (both are valid; `<dialog>` gives focus trap for free).

**Primary recommendation:** Three tasks in sequence — (1) modify `createCampaign` to redirect with `?share=1`, (2) update `CampaignDetailPage` to accept and forward `searchParams.share`, (3) build `ShareModal` with two copy buttons and URL cleanup on dismiss.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16 (in use) | `searchParams` prop on Server Component pages; `useRouter` for URL cleanup | Already the project's framework; `searchParams` is the idiomatic modal trigger pattern |
| React | 19 (in use) | `useState` for modal open state and "Copied!" transient state; `useEffect` not needed | Already in use; `useState(true)` mounts modal open |
| `navigator.clipboard.writeText` | Browser API | Clipboard write for join link and invite message | Already in production in `CopyLinkButton.tsx` |
| Tailwind CSS 4 | in use | Styling — CSS custom properties `--dnd-accent`, `--dnd-input-bg` etc. already defined | Already the project's CSS framework |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useRouter` from `next/navigation` | Next.js 16 | `router.replace(pathname, { scroll: false })` to clean URL on dismiss | Only in `ShareModal` dismiss handler |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URL `?share=1` param | `sessionStorage.setItem('showModal', '1')` before redirect | Storage approach is fragile — race conditions, SSR unavailable, storage cleared on private browsing. URL param is simpler and shareable. |
| URL `?share=1` param | Return `{ campaignId, joinUrl }` from action instead of `redirect()` | Removes `redirect()` and requires manual `router.push` after dismiss. More code, breaks the established action pattern in the project. |
| `<div>` overlay modal | Native `<dialog>` element | `<dialog>` gives focus trap and Escape key handling for free. Either works. Native `<dialog>` is lower effort and correct. |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

No new directories needed. New file locations:

```
src/
├── app/
│   └── campaigns/
│       └── [id]/
│           └── page.tsx          # Modify: add searchParams prop, pass share and joinUrl to ShareModal
├── components/
│   └── ShareModal.tsx            # New: Client Component, mounts open, two copy buttons, URL cleanup on dismiss
└── lib/
    └── actions/
        └── campaign.ts           # Modify: append ?share=1 to createCampaign redirect
```

### Pattern 1: URL Search Param as Modal Trigger

**What:** The server action appends `?share=1` to its redirect destination. The Server Component page reads `searchParams.share` and conditionally passes a prop to the Client Component modal, which mounts with `open` already `true`.

**When to use:** Any time a server-side redirect must communicate intent to a client component on the destination page. This is the only pattern that survives the HTTP redirect boundary.

**Example:**
```typescript
// Source: .planning/research/ARCHITECTURE.md — Question 2

// Step 1: src/lib/actions/campaign.ts
// Change this:
redirect(`/campaigns/${campaign.id}`)
// To this (one-line change):
redirect(`/campaigns/${campaign.id}?share=1`)

// Step 2: src/app/campaigns/[id]/page.tsx
export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ share?: string }>
}) {
  const { id } = await params
  const { share } = await searchParams
  // ... existing data fetch ...

  return (
    <main>
      {/* ... existing JSX ... */}
      {share === '1' && (
        <ShareModal joinUrl={joinUrl} />
      )}
    </main>
  )
}

// Step 3: src/components/ShareModal.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ShareModal({ joinUrl }: { joinUrl: string }) {
  const [open, setOpen] = useState(true)
  const router = useRouter()

  function dismiss() {
    setOpen(false)
    router.replace(window.location.pathname, { scroll: false })
  }

  if (!open) return null

  const inviteMessage = `You're invited to join my D&D campaign! Set your availability here so we can find a date that works:\n\n${joinUrl}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={dismiss} />
      <div className="relative bg-[var(--dnd-input-bg)] border border-[#ba7df6]/30 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
        <h2 className="font-fantasy text-xl text-white">Campaign created!</h2>
        <p className="text-sm text-[var(--dnd-text-muted)]">Share this link with your players:</p>
        <input
          type="text"
          readOnly
          value={joinUrl}
          className="w-full rounded bg-black/30 border border-[#ba7df6]/20 px-3 py-2 text-sm font-mono text-[var(--dnd-accent)] focus:outline-none"
        />
        <CopyButton text={joinUrl} label="Copy link" />
        <CopyButton text={inviteMessage} label="Copy invite message" />
        <button onClick={dismiss} className="w-full py-2 rounded border border-[var(--dnd-border-muted)] text-sm text-[var(--dnd-text-muted)] hover:text-white transition-colors">
          Done
        </button>
      </div>
    </div>
  )
}
```

### Pattern 2: CopyButton Sub-Component (Inline or Extracted)

**What:** A minimal stateful button that calls `navigator.clipboard.writeText`, shows "Copied!" for 2 seconds, then resets. Directly mirrors the existing `CopyLinkButton.tsx`.

**When to use:** Every clipboard copy action in the modal. Two instances: one for the raw join URL, one for the pre-written invite message.

**Example:**
```typescript
// Source: src/components/CopyLinkButton.tsx (existing, in production)
// Inline version for use inside ShareModal — or extract as a shared CopyButton component

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="w-full py-2 rounded bg-[var(--dnd-accent)] text-black text-sm font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}
```

**Decision note:** The `CopyButton` helper can be defined inline in `ShareModal.tsx` or extracted to a shared component. Given `CopyLinkButton.tsx` already exists and serves a different purpose (URL-specific), define `CopyButton` inline in `ShareModal.tsx` unless the planner determines sharing makes sense. Keep it simple.

### Anti-Patterns to Avoid

- **Reading `searchParams` in a child client component with `useSearchParams()`:** This requires a `<Suspense>` boundary. Read `searchParams` only in the Server Component (`page.tsx`) and pass the result as a prop.
- **Using `sessionStorage` or cookies to signal modal open:** Fragile, SSR-incompatible, overkill. URL param is the canonical pattern.
- **Auto-copying to clipboard on modal mount via `useEffect`:** Browsers block `clipboard.writeText` calls that are not initiated by a direct user gesture. Never call it in `useEffect`.
- **Calling `redirect()` inside a `try/catch`:** The project's established rule (from PROJECT.md). `redirect()` throws NEXT_REDIRECT internally — wrapping it in `try/catch` catches and swallows the redirect. The existing `createCampaign` already follows this correctly; the one-line `?share=1` addition does not change this.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clipboard write with feedback | Custom clipboard API wrapper | `navigator.clipboard.writeText` + `useState` (already in `CopyLinkButton.tsx`) | Already proven in production; 4 lines; no abstraction needed |
| URL cleanup without navigation | History API manipulation | `router.replace(window.location.pathname, { scroll: false })` | Next.js App Router idiom; avoids direct `window.history` usage |
| Modal focus trap | Custom focus management | Native `<dialog>` element with `.showModal()` | Built-in focus trap, Escape key handling, backdrop; zero code |

**Key insight:** The entire Phase 12 surface area is covered by patterns already in the codebase or browser-native APIs. There is nothing genuinely new to build from scratch.

---

## Common Pitfalls

### Pitfall 1: `useSearchParams()` in ShareModal requires Suspense boundary

**What goes wrong:** If `ShareModal` calls `useSearchParams()` internally to detect whether it should be open, Next.js App Router requires the component to be wrapped in `<Suspense>` — otherwise a build-time static generation error occurs.

**Why it happens:** `useSearchParams()` opts the subtree into dynamic rendering. Without `<Suspense>`, Next.js cannot pre-render the parent segment.

**How to avoid:** Never call `useSearchParams()` in `ShareModal`. Read `searchParams.share` in the Server Component `page.tsx` and pass a boolean or the `joinUrl` as a plain prop. The modal has no knowledge of the URL.

**Warning signs:** Build error: `useSearchParams() should be wrapped in a suspense boundary`.

### Pitfall 2: Modal cannot open after server-side `redirect()`

**What goes wrong:** Any attempt to pass modal state through `useActionState`'s return value fails because a successful `redirect()` unmounts the `CampaignForm` component entirely. The state is thrown away.

**Why it happens:** `redirect()` throws a NEXT_REDIRECT exception internally. The form component never sees a successful action return — the page just changes.

**How to avoid:** The URL param pattern (`?share=1`) is the only mechanism that crosses the redirect boundary. This is already the decided architecture.

**Warning signs:** Modal never opens; no JS error — the component simply isn't there anymore.

### Pitfall 3: `navigator.clipboard.writeText` blocked without user gesture

**What goes wrong:** Calling `clipboard.writeText` in `useEffect` on mount (to auto-copy the link) is silently blocked by browsers because it lacks a user gesture.

**Why it happens:** The Clipboard API requires a user-initiated gesture (`click`, `keydown`, etc.) as the trigger. Effects run asynchronously after render and do not qualify.

**How to avoid:** Keep all clipboard calls inside `onClick` handlers, exactly as `CopyLinkButton.tsx` does. Do not attempt auto-copy on modal open.

**Warning signs:** `clipboard.writeText` call appears to succeed (no error thrown) but nothing is copied.

### Pitfall 4: `router.replace` with pathname only vs. with full URL

**What goes wrong:** If `router.replace` is called with a relative path that doesn't include the current path, it may navigate to the wrong location, especially in nested routes.

**How to avoid:** Use `window.location.pathname` which always reflects the exact current path. This is safe because this code only runs in the browser (it's inside an `onClick` handler in a `'use client'` component).

```typescript
router.replace(window.location.pathname, { scroll: false })
```

### Pitfall 5: Invite message text computed in state goes stale

**What goes wrong:** If the invite message string is computed once in `useState` initialiser or `useMemo`, it won't update if `joinUrl` prop somehow changes (unlikely in practice but a code smell).

**How to avoid:** Compute the invite message inline at render time from the `joinUrl` prop. Since `joinUrl` is a prop, this is naturally reactive and requires no memoisation.

---

## Code Examples

### Exact current state of createCampaign redirect (line to change)

```typescript
// Source: src/lib/actions/campaign.ts — line 59 (current)
redirect(`/campaigns/${campaign.id}`)

// After change:
redirect(`/campaigns/${campaign.id}?share=1`)
```

### How joinUrl is already computed in CampaignDetailPage

```typescript
// Source: src/app/campaigns/[id]/page.tsx — lines 39-42 (existing, unchanged)
const hdrs = await headers()
const host = hdrs.get('host') ?? 'localhost:3000'
const proto = hdrs.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
const joinUrl = `${proto}://${host}/join/${campaign.joinToken}`
```

This `joinUrl` is already being passed to `CopyLinkButton`. The same value is passed to `ShareModal`.

### CampaignDetailPage searchParams signature update

```typescript
// Source: .planning/research/ARCHITECTURE.md — Question 2
// Before:
export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> })

// After:
export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ share?: string }>
})
```

### CopyLinkButton (existing pattern — copy this approach)

```typescript
// Source: src/components/CopyLinkButton.tsx (in production)
'use client'
import { useState } from 'react'
export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={async () => {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }}
      className="px-3 py-1 rounded text-sm bg-[var(--dnd-accent)] text-black hover:bg-[var(--dnd-accent-hover)] transition-colors">
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pass modal state through `useActionState` return value | URL search param (`?share=1`) as modal trigger | Next.js App Router era | `useActionState` state is lost on successful `redirect()`; URL param is the only durable signal |
| `useSearchParams()` in child client component | Read `searchParams` in Server Component, pass as prop | Next.js 13+ App Router | `useSearchParams()` in client components requires `<Suspense>` wrapper |
| Clipboard write wrapped in utility library | `navigator.clipboard.writeText()` direct | Modern browsers | Browser API is sufficient; no library overhead |

**Deprecated/outdated:**
- Reading search params via `useRouter().query` (Pages Router pattern): Not applicable in App Router — use `searchParams` prop on page Server Components.
- Opening modals via URL hash (`#share`): Hashes are client-only; Server Components cannot read them.

---

## Open Questions

1. **Pre-written invite message text**
   - What we know: Must include the join URL and player instructions; the ARCHITECTURE.md example uses `"Join my D&D campaign! Set your availability here: ${joinUrl}"`
   - What's unclear: Exact wording is a product/copy decision. The planner/implementer should decide on specific phrasing.
   - Recommendation: Use a friendly, brief message. Example: `"You're invited to join my D&D campaign! Click the link below to set your availability and help us find the best session date:\n\n${joinUrl}"`

2. **Native `<dialog>` vs `<div>` overlay**
   - What we know: Both approaches work. Native `<dialog>` with `useEffect` + `dialogRef.current.showModal()` gives focus trap and Escape key for free. `<div>` overlay with `onClick` on backdrop is simpler to style.
   - What's unclear: Whether the project's existing component patterns prefer one over the other. No existing modal components to reference.
   - Recommendation: Use `<div>` overlay (simpler, no ref wiring needed, explicit Escape key via `onKeyDown` on the modal container if desired). The `<dialog>` approach adds complexity for marginal accessibility gain at this scale.

3. **Whether to extract `CopyButton` as a shared component**
   - What we know: `CopyLinkButton.tsx` exists for URL-specific copying. `ShareModal` needs two copy buttons.
   - What's unclear: Whether Phase 15 (`CopyBestDaysButton`) would benefit from a shared `CopyButton` primitive.
   - Recommendation: Define the copy button logic inline inside `ShareModal.tsx` for Phase 12. If Phase 15 needs the same pattern, extract then. Premature extraction adds indirection without benefit now.

---

## Data Flow

### Share Modal Complete Flow

```
DM submits CampaignForm (src/components/CampaignForm.tsx)
  → createCampaign Server Action (src/lib/actions/campaign.ts)
  → Validation passes
  → prisma.campaign.create()
  → redirect(`/campaigns/${campaign.id}?share=1`)   ← ONE LINE CHANGE
      (redirect throws NEXT_REDIRECT; browser navigates)
  → CampaignDetailPage Server Component renders
      (src/app/campaigns/[id]/page.tsx)
  → await searchParams → { share: '1' }
  → joinUrl computed from campaign.joinToken + host headers  (UNCHANGED)
  → {share === '1'} → <ShareModal joinUrl={joinUrl} />
  → ShareModal Client Component mounts with useState(true) → open
  → DM sees modal with join link and two copy buttons

DM clicks "Copy link"
  → navigator.clipboard.writeText(joinUrl)
  → button shows "Copied!" for 2s then resets

DM clicks "Copy invite message"
  → navigator.clipboard.writeText(inviteMessage)
  → button shows "Copied!" for 2s then resets

DM clicks "Done" (or backdrop)
  → dismiss() called
  → setOpen(false) → modal disappears from DOM
  → router.replace(window.location.pathname, { scroll: false })
  → URL changes from /campaigns/[id]?share=1 to /campaigns/[id]
  → No Server Component re-render (same path, no navigation)
  → DM is on campaign dashboard with clean URL
```

### What Does NOT Change

- `joinUrl` computation in `CampaignDetailPage` — unchanged, same logic
- `CampaignDetailPage` data fetching (prisma query) — unchanged
- `CampaignForm.tsx` — unchanged (form itself is unmodified; only the action's redirect changes)
- All other campaign.ts server actions — unchanged
- `CopyLinkButton` in the Join Link section of the dashboard — unchanged, still present

---

## Files to Modify

| File | Change | Size |
|------|--------|------|
| `src/lib/actions/campaign.ts` | Line 59: append `?share=1` to redirect URL | 1 line |
| `src/app/campaigns/[id]/page.tsx` | Add `searchParams` to function signature and props type; add `{share === '1' && <ShareModal joinUrl={joinUrl} />}` to JSX | ~8 lines |

## Files to Create

| File | Purpose | Est. Lines |
|------|---------|-----------|
| `src/components/ShareModal.tsx` | Client Component — mounts open, read-only URL field, two copy buttons, backdrop + Done dismiss | ~60 lines |

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection: `src/lib/actions/campaign.ts` — confirmed current redirect destination (line 59)
- Direct codebase inspection: `src/app/campaigns/[id]/page.tsx` — confirmed no `searchParams` prop currently; `joinUrl` already computed and in scope
- Direct codebase inspection: `src/components/CopyLinkButton.tsx` — confirmed clipboard pattern in production
- Direct codebase inspection: `src/components/CampaignForm.tsx` — confirmed `useActionState(createCampaign, null)` pattern
- Direct codebase inspection: `prisma/schema.prisma` — confirmed `joinToken` field on Campaign; `DmAvailabilityException` already added by Phase 11
- `.planning/research/ARCHITECTURE.md` — Question 2 documents the complete URL param modal trigger pattern with code samples
- `.planning/research/PITFALLS.md` — Pitfalls 3, 6, 7 directly relevant to this phase

### Secondary (MEDIUM confidence)

- Next.js App Router `searchParams` as async prop on page Server Components — documented in ARCHITECTURE.md, consistent with Next.js 15/16 behaviour
- `router.replace` with `{ scroll: false }` for URL cleanup without navigation — standard App Router pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all patterns directly observed in production codebase
- Architecture: HIGH — complete data flow documented; exact file changes identified; all code samples drawn from existing codebase patterns
- Pitfalls: HIGH — all pitfalls specific to this phase are documented in PITFALLS.md and grounded in actual project code

**Research date:** 2026-03-09
**Valid until:** 2026-06-09 (stable — App Router `searchParams` pattern and Clipboard API are not fast-moving)
