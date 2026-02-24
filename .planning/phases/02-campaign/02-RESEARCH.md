# Phase 2: Campaign - Research

**Researched:** 2026-02-24
**Domain:** Next.js 15 App Router — Server Actions, dynamic routes, Google Fonts, date inputs
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Player landing page leads directly with availability form area — no welcome intro
- In Phase 2 (before availability exists): show campaign name, player name, planning window dates, fellow player names, DM name
- Show all player names ("Playing with: Aragorn, Gandalf, Legolas, Gimli")
- Show DM name ("Richard is organising this campaign")
- Show planning window date range ("We're planning sessions for March 2026")
- Browser tab / page title: "D&D Session Planner" (app name, not campaign name)
- Invalid/expired invite link: friendly error page — "This link doesn't look right — ask your DM to resend it"
- Fully responsive — mobile-first layout
- The invite link IS the player's identity — no extra auth state, no sessions, no cookies
- D&D themed but subtle: dark colour palette, fantasy font for headings only; dark mode with thematic heading typography
- Phase 3 CTA: design player page layout to accommodate a big "Set your availability" button — placeholder or disabled state in Phase 2
- Planning window: two date pickers (start + end), required upfront during campaign creation, editable any time after creation, no min/max length constraint
- DM must set the planning window during campaign creation (not optional)

### Claude's Discretion

- DM campaign creation form layout (single page or multi-step — keep it simple)
- How the DM views and copies invite links after campaign creation (table with copy buttons is fine)
- Exact colour palette and font choices for the D&D theme
- Date picker component choice

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAMP-01 | DM can create a campaign by setting a name and adding named player slots | Server Action creates Campaign + PlayerSlots in one transaction; form on a `/campaigns/new` page |
| CAMP-02 | Each player slot generates a unique persistent invite link | `inviteToken` is already `@unique @default(cuid())` in schema — generated at slot creation; invite URL is `/invite/[token]` |
| CAMP-03 | DM can set a planning window (start and end date) for the current scheduling period | `planningWindowStart` / `planningWindowEnd` already on Campaign model; date inputs on creation form; editable via update action on a campaign detail page |
| ACCESS-01 | Player can access and submit availability via invite link with no account required | Dynamic route `/invite/[token]` reads `inviteToken` from DB, renders player page; no auth middleware required |
</phase_requirements>

---

## Summary

Phase 2 is a pure Next.js 15 App Router CRUD phase. The schema is already fully deployed (Campaign, PlayerSlot, AvailabilityEntry with correct fields and cascade deletes). No new dependencies or schema migrations are required. The work is: build a DM campaign creation flow (Server Action + form), a campaign detail page where the DM can see invite links and edit the planning window, and a player landing page at `/invite/[token]` that renders read-only campaign info.

The invite-link-as-identity model (ACCESS-01) is the defining architectural choice. The `/invite/[token]` route does a DB lookup on `inviteToken`, and if found, renders the player page. If not found it renders a friendly error. No middleware, no sessions, no cookies. This is maximally simple and already aligns with the schema.

The only discretionary choices are UI-level: font selection (Cinzel from Google Fonts is the obvious pick for a D&D fantasy heading), dark colour palette via Tailwind CSS, and date picker component (native `<input type="date">` is sufficient — no third-party library needed for two date fields).

**Primary recommendation:** Use Next.js 15 Server Actions for all mutations, `notFound()` for the invalid invite case, and Cinzel via `next/font/google` for the fantasy heading. Zero new npm dependencies required.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 (installed) | Routing, Server Components, Server Actions | Already in project; App Router is the current standard |
| Prisma 7 | 7.4.1 (installed) | DB access via PrismaBetterSqlite3 adapter | Already in project; all models defined |
| Tailwind CSS | 4 (installed) | Styling, dark mode, responsive layout | Already in project |
| `next/font/google` | built-in | Load Cinzel (fantasy heading font) with zero layout shift | Built into Next.js; no extra package |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `<input type="date">` | HTML built-in | Date range pickers for planning window | Two date fields only; no complex calendar needed |
| `useFormStatus` / `useActionState` | React 19 (installed) | Pending state and error display on forms | Server Action forms need feedback |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native date input | react-datepicker / react-day-picker | Third-party pickers add dependency; native is sufficient for two simple date fields |
| Cinzel (Google Fonts) | MedievalSharp, Uncial Antiqua | All viable; Cinzel is most readable at heading sizes and widely used for D&D UIs |
| Server Actions | API routes (`/api/...`) | API routes require separate fetch logic; Server Actions are simpler for this form-based CRUD |

**Installation:**
```bash
# No new packages required — all dependencies already installed in Phase 1
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── campaigns/
│   │   ├── new/
│   │   │   └── page.tsx          # DM: create campaign form
│   │   └── [id]/
│   │       └── page.tsx          # DM: campaign detail + invite links + edit planning window
│   ├── invite/
│   │   └── [token]/
│   │       └── page.tsx          # Player: landing page (read-only in Phase 2)
│   ├── layout.tsx                # Root layout (already exists)
│   └── page.tsx                  # Updated: link/redirect to /campaigns/new
├── lib/
│   ├── prisma.ts                 # Already exists — singleton client
│   └── actions/
│       ├── campaign.ts           # Server Actions: createCampaign, updatePlanningWindow
│       └── (invite.ts in Phase 3)
└── generated/prisma/client/      # Already exists — Prisma generated client
```

### Pattern 1: Server Action for Campaign Creation

**What:** A single `async function createCampaign(formData)` decorated with `'use server'` that creates Campaign + PlayerSlots in a Prisma transaction, then redirects to the campaign detail page.

**When to use:** Any mutation triggered by a form submit in App Router.

**Example:**
```typescript
// src/lib/actions/campaign.ts
'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function createCampaign(formData: FormData) {
  const name = formData.get('name') as string
  const planningWindowStart = new Date(formData.get('planningWindowStart') as string)
  const planningWindowEnd = new Date(formData.get('planningWindowEnd') as string)
  const playerNames = formData.getAll('playerName') as string[]

  const campaign = await prisma.campaign.create({
    data: {
      name,
      planningWindowStart,
      planningWindowEnd,
      playerSlots: {
        create: playerNames.filter(n => n.trim()).map(name => ({ name })),
      },
    },
    include: { playerSlots: true },
  })

  redirect(`/campaigns/${campaign.id}`)
}
```

### Pattern 2: Invite Token Lookup with notFound()

**What:** Dynamic route reads `params.token`, queries `PlayerSlot` by `inviteToken`, calls `notFound()` if missing. Next.js renders the nearest `not-found.tsx`.

**When to use:** Any route where a missing record should show a user-friendly error rather than a 500.

**Example:**
```typescript
// src/app/invite/[token]/page.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function InvitePage({ params }: { params: { token: string } }) {
  const slot = await prisma.playerSlot.findUnique({
    where: { inviteToken: params.token },
    include: {
      campaign: {
        include: { playerSlots: true },
      },
    },
  })

  if (!slot) notFound()

  // render player landing page
}
```

### Pattern 3: Custom not-found.tsx for Friendly Error

**What:** A `not-found.tsx` file co-located in `src/app/invite/[token]/` scopes the friendly error message to the invite route only.

**Example:**
```typescript
// src/app/invite/[token]/not-found.tsx
export default function InviteNotFound() {
  return (
    <div className="...">
      <h1>This link doesn&apos;t look right</h1>
      <p>Ask your DM to resend your invite link.</p>
    </div>
  )
}
```

### Pattern 4: Google Fonts via next/font

**What:** Load Cinzel at the layout level so it's available as a CSS variable throughout the app. Apply only to heading elements.

**Example:**
```typescript
// src/app/layout.tsx
import { Cinzel, Inter } from 'next/font/google'

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="bg-gray-950 text-gray-100 font-sans">{children}</body>
    </html>
  )
}
```

In Tailwind CSS 4 with `@theme`:
```css
/* src/app/globals.css */
@theme {
  --font-fantasy: var(--font-cinzel);
}
```

Then use `font-fantasy` class on heading elements.

### Pattern 5: Dynamic Invite Link Generation (after creation)

**What:** Invite links are constructed at render time from `process.env.NEXT_PUBLIC_APP_URL` + `/invite/` + `inviteToken`. The token is already stored in the DB.

**Example:**
```typescript
// In campaign detail page (server component)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const inviteUrl = `${baseUrl}/invite/${slot.inviteToken}`
```

### Pattern 6: Dynamic Player Name Slots in Creation Form

**What:** The DM needs to add N player name inputs. Use React state with client component to add/remove name fields dynamically. The names are submitted as `playerName[]` in formData.

**Example:**
```typescript
// Client component for the player names section
'use client'
import { useState } from 'react'

export function PlayerSlotsInput() {
  const [names, setNames] = useState([''])
  // render inputs with name="playerName" for each slot
  // add/remove buttons
}
```

### Anti-Patterns to Avoid

- **`params` accessed synchronously in Next.js 15:** In Next.js 15, `params` in page components is a Promise. Must `await params` before accessing properties. Failure causes a runtime error.
- **Using `@prisma/client` import:** This project generates to `src/generated/prisma`. Import from `@/generated/prisma/client`, not `@prisma/client`.
- **Date stored as string in Prisma:** Pass `new Date(formData.get('date') as string)` — Prisma expects a `DateTime` (JS Date object), not a raw ISO string.
- **Planning window validation skipped:** Date inputs must have `required` and the action must validate `start < end`. An empty or reversed range should return a user-facing error.
- **Constructing base URL without env var:** Never hardcode `localhost:3000` for invite links — use `NEXT_PUBLIC_APP_URL` so Vercel deployment generates correct absolute URLs.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fantasy font loading | Custom CSS @font-face with self-hosted files | `next/font/google` with Cinzel | Automatic optimisation, zero layout shift, privacy-safe proxying |
| Form pending state | Manual `useState` loading flag | `useFormStatus` from React 19 | Built-in, works with Server Actions without extra wiring |
| Friendly 404 pages | Conditional rendering in page component | `notFound()` + `not-found.tsx` | Next.js pattern; correct HTTP 404 status; scoped to route |
| Invite token generation | `crypto.randomUUID()` or nanoid | Prisma `@default(cuid())` already in schema | Token already exists on every PlayerSlot — no generation code needed |

**Key insight:** The schema already does the hard work. Phase 2 is wiring UI to data that already exists in the DB.

---

## Common Pitfalls

### Pitfall 1: Next.js 15 `params` is a Promise

**What goes wrong:** Accessing `params.token` directly (not awaited) causes a runtime error in production builds. Next.js 15 changed `params` to be a Promise.

**Why it happens:** Next.js 15 breaking change — params and searchParams are now async.

**How to avoid:** Always `await params` at the top of page components:
```typescript
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
```

**Warning signs:** TypeScript error on `params.token` if types are set correctly; runtime crash in production.

### Pitfall 2: `planningWindowStart` / `planningWindowEnd` are nullable in schema

**What goes wrong:** The schema defines `planningWindowStart DateTime?` and `planningWindowEnd DateTime?` (nullable). The DM must provide them at creation (locked decision), but the type system allows null. If not validated in the Server Action, null values can be stored.

**Why it happens:** Schema was designed for flexibility across phases; the "required upfront" constraint is a UX rule, not a DB constraint.

**How to avoid:** Validate in Server Action before Prisma write. Return error to form if either date is missing.

### Pitfall 3: Invite URL breaks on Vercel without `NEXT_PUBLIC_APP_URL`

**What goes wrong:** Invite links show `http://localhost:3000/invite/...` on the deployed site.

**Why it happens:** No environment variable set for the production base URL.

**How to avoid:** Add `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app` to Vercel environment variables. Use it when constructing invite links in the campaign detail page.

### Pitfall 4: Copy-to-clipboard requires client component

**What goes wrong:** `navigator.clipboard.writeText()` is a browser API — calling it in a Server Component throws.

**Why it happens:** Server Components run on the server; no `window` or `navigator`.

**How to avoid:** Wrap the "Copy link" button in a small `'use client'` component that handles clipboard write on click.

### Pitfall 5: Date input value format mismatch

**What goes wrong:** `<input type="date">` returns `"YYYY-MM-DD"` strings. `new Date("YYYY-MM-DD")` parsed in a server action resolves to UTC midnight, which may display as the previous day in certain timezones when formatted back.

**Why it happens:** JS `Date` constructor treats date-only strings as UTC; display formatting uses local timezone.

**How to avoid:** For a planning window (date range, not time-specific), store dates as-is and format them consistently using `toLocaleDateString` with explicit locale, or treat them purely as date strings. Since the schema is `DateTime`, store as UTC midnight and display with UTC-anchored formatting.

---

## Code Examples

### Creating a Campaign with Player Slots (Server Action pattern)

```typescript
// src/lib/actions/campaign.ts
'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function createCampaign(_prevState: unknown, formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const startVal = formData.get('planningWindowStart') as string
  const endVal = formData.get('planningWindowEnd') as string
  const playerNames = (formData.getAll('playerName') as string[]).filter(n => n.trim())

  if (!name || !startVal || !endVal || playerNames.length === 0) {
    return { error: 'All fields are required.' }
  }

  const planningWindowStart = new Date(startVal)
  const planningWindowEnd = new Date(endVal)

  if (planningWindowEnd <= planningWindowStart) {
    return { error: 'End date must be after start date.' }
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      planningWindowStart,
      planningWindowEnd,
      playerSlots: {
        create: playerNames.map(n => ({ name: n.trim() })),
      },
    },
  })

  redirect(`/campaigns/${campaign.id}`)
}
```

### Player Landing Page — Token Lookup

```typescript
// src/app/invite/[token]/page.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const slot = await prisma.playerSlot.findUnique({
    where: { inviteToken: token },
    include: {
      campaign: {
        include: { playerSlots: { select: { id: true, name: true } } },
      },
    },
  })

  if (!slot) notFound()

  const { campaign } = slot
  const fellows = campaign.playerSlots.filter(s => s.id !== slot.id)

  return (
    <main>
      <h1 className="font-fantasy">{campaign.name}</h1>
      <p>{slot.name}&apos;s invitation</p>
      <p>Playing with: {fellows.map(f => f.name).join(', ')}</p>
      {/* Phase 3 CTA placeholder */}
      <button disabled className="opacity-50 cursor-not-allowed">
        Set your availability — coming soon
      </button>
    </main>
  )
}
```

### Copy Invite Link Button (client component)

```typescript
// src/components/CopyLinkButton.tsx
'use client'

export function CopyLinkButton({ url }: { url: string }) {
  return (
    <button onClick={() => navigator.clipboard.writeText(url)}>
      Copy link
    </button>
  )
}
```

### Updating Planning Window (Server Action)

```typescript
// src/lib/actions/campaign.ts (add to same file)
export async function updatePlanningWindow(campaignId: string, formData: FormData) {
  'use server'
  const startVal = formData.get('planningWindowStart') as string
  const endVal = formData.get('planningWindowEnd') as string

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      planningWindowStart: new Date(startVal),
      planningWindowEnd: new Date(endVal),
    },
  })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API routes for mutations | Server Actions | Next.js 13+ (stable in 14) | No separate API layer needed for form mutations |
| `params.token` (sync) | `await params` (async) | Next.js 15 | Breaking — all page params must be awaited |
| `@prisma/client` import | `@/generated/prisma/client` | Prisma 7 (this project) | Custom output path; standard import breaks |
| `_document.tsx` for fonts | `next/font/google` | Next.js 13 | Automatic optimisation, no layout shift |

---

## Open Questions

1. **DM identity / campaign access control**
   - What we know: The DM has no login. Campaign creation produces a URL (`/campaigns/[id]`). Anyone with that URL can view it.
   - What's unclear: Should the DM campaign page be "secret by obscurity" (just a long ID), or is this acceptable for v1?
   - Recommendation: Treat the campaign `id` (cuid) as sufficiently unguessable for v1 — no auth needed. This is consistent with the invite-link-as-identity model. Flag as a v2 concern if the user wants DM login.

2. **DM name on player page**
   - What we know: The locked decision says show "Richard is organising this campaign". The Campaign model has no `dmName` field.
   - What's unclear: Where does the DM name come from? There is no DM user model.
   - Recommendation: Add a `dmName` field to the Campaign model (or store it as a string on Campaign). The DM enters their name during campaign creation. This requires a schema migration (`npx prisma db push`) — a trivial change but must be planned as a task.

3. **How many player slots — fixed or dynamic?**
   - What we know: CONTEXT.md says "adding named player slots" — dynamic list.
   - What's unclear: Is there a minimum (e.g., at least 1 player)?
   - Recommendation: Require at least 1 player in Server Action validation. No maximum enforced.

---

## Sources

### Primary (HIGH confidence)

- Next.js 15 App Router docs (official) — Server Actions, dynamic routes, `notFound()`, async params
- Prisma schema.prisma in this repo — confirmed model fields, inviteToken setup
- Phase 1 SUMMARY (01-01-SUMMARY.md) — confirmed import paths, adapter pattern, generated client location
- `next/font/google` — built into Next.js, no external source needed

### Secondary (MEDIUM confidence)

- Cinzel font — Google Fonts listing; suitable for D&D heading use (widely documented in community)
- `useFormStatus` — React 19 built-in, confirmed in React docs; installed version is React 19.2.3

### Tertiary (LOW confidence)

- Date UTC midnight display issue — general JS Date behaviour; not Next.js-specific

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and working in Phase 1
- Architecture: HIGH — patterns are standard Next.js 15 App Router; schema already exists
- Pitfalls: HIGH (params async, copy button) / MEDIUM (date timezone edge case)

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (Next.js stable, Prisma stable — 30-day window appropriate)
