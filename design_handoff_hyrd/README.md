# Handoff: Hyrd — Premium Career Platform

## Overview

**Hyrd** is a premium, all-in-one career platform that helps students, job seekers, and professionals land interviews. It combines four interconnected surfaces into one calm, considered workspace:

1. **Resume Optimizer** — upload résumé + JD, get a recruiter-grade rewrite with diff annotations and ATS scoring
2. **Job Tracker** — Kanban board (Saved → Applied → Interview → Offer → Rejected) with linked résumé versions, notes, contacts
3. **AI Mock Interview** — voice-first 2-minute interview tuned to a specific JD
4. **Performance Dashboard** — post-interview analytics with radar scoring, transcript replay, personalized improvement plan

The product voice is **second person, no exclamation marks, no gamification**. Think senior career coach: composed, surgical, evidence-based.

---

## About the Design Files

The files in `design_reference/` are **design references created in HTML/JSX** — high-fidelity prototypes showing the intended look, layout, and behavior. **They are not production code to copy directly.**

Your job is to **recreate these designs in the target codebase's existing environment** (React, Next.js, Remix, etc.) using its established patterns, libraries, and component primitives. If no environment exists yet, choose the most appropriate stack — recommended: **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion** for animations.

The CSS variables in `tokens.css` are the source of truth for colors, type, spacing, radii, and shadows — port them verbatim.

---

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, copy, and interaction states are all decided. Recreate pixel-perfectly using the codebase's component library, lifting exact values from `tokens.css`.

---

## Aesthetic Direction (commit to this — don't re-invent)

**Editorial / serif.** Newsprint-grade typography on warm ivory. Confident, expensive, restrained. References: NYT meets Linear meets a literary quarterly. Anti-references: gradient-heavy SaaS dashboards, glassmorphism, AI-startup look.

- **Hairline 1px rules** divide everything. No heavy borders.
- **Italic serif** for emphasis (in headings: `<em>` styled italic, often colored terracotta).
- **Mono labels** (`.eyebrow`, `.label`) used as section markers — uppercase, tracked.
- **Tabular nums** on every numeric value.
- **Generous whitespace** + asymmetric grid; one number louder than everything else.
- **No emoji, no character illustrations, no stock photos.** Empty states use a quote-and-rule treatment. Imagery uses subtly-striped placeholders with monospace captions.
- **Decorative serif numerals** (huge, low-opacity, bottom-right of cards) as visual texture.

---

## Design Tokens

All tokens live in `design_reference/tokens.css`. Import that file directly or port to your token system.

### Colors — Light (primary)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#f4f1ea` | Canvas (ivory) |
| `--bg-raised` | `#fbf8f1` | Cards (paper) |
| `--bg-sunk` | `#ece7dc` | Recessed surfaces, score chip backgrounds |
| `--bg-inverse` | `#15140f` | Inverse surfaces (CTA cards) |
| `--ink` | `#15140f` | Primary text |
| `--ink-2` | `#2a2722` | Secondary text |
| `--ink-3` | `#555048` | Tertiary text |
| `--ink-4` | `#8a857a` | Muted / metadata |
| `--ink-5` | `#b6b1a4` | Disabled |
| `--hairline` | `rgba(21,20,15,0.10)` | 1px rules everywhere |
| `--hairline-2` | `rgba(21,20,15,0.05)` | Hover backgrounds |
| `--hairline-3` | `rgba(21,20,15,0.20)` | Stronger borders |
| `--accent` | `#9c4a2c` | Terracotta — single primary accent |
| `--accent-soft` | `rgba(156,74,44,0.12)` | Accent backgrounds |
| `--accent-ink` | `#fbf8f1` | Text on accent |
| `--positive` | `#3f5c3a` | Loam — success, "added" diff, offers |
| `--negative` | `#8b2e1f` | Rust — destructive, "rejected" |
| `--warning` | `#b3781a` | Amber-brown — caution |

### Colors — Dark variant

Set `[data-theme="dark"]` on `<html>`. See `tokens.css` for full overrides — bg becomes `#14130e`, accent shifts to `#d97a4a`.

### Diff colors (Resume Optimizer)
- `--diff-add`: `#3f5c3a` on `#3f5c3a14` background — green-tinted
- `--diff-change`: `#9c4a2c` on `#9c4a2c14` background — terracotta-tinted
- `--diff-kept`: `#8a857a` — muted gray

### Typography

```css
--font-display: 'Fraunces', 'Tiempos Headline', Georgia, serif;
--font-body:    'Geist', 'Söhne', 'Inter Tight', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
```

Load Fraunces with full optical-size and italic axis: `Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500`.

**Type scale (px):** 11, 12.5, 14 (base), 15, 17, 20, 24, 32, 44, 64, 92, 132.

**Letter-spacing:** display headings `-0.025em` to `-0.035em`; mono labels `0.08em` to `0.16em` (tighter for inline labels, looser for section eyebrows).

**Line-height:** display `0.95`; tight `1.1`; snug `1.3`; body `1.55`.

### Spacing (4px base)
4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96 px.

### Radii
3, 6, 10, 14, 22 px, plus pill (999).

### Shadows (intentionally subtle)
- `--shadow-1`: 0 1px 0 hairline
- `--shadow-2`: 0 1px 2px 4% black + hairline ring
- `--shadow-3`: card lift — 0 6px 24px -12px 18% black
- `--shadow-4`: drawer / modal — 0 24px 64px -28px 25% black

### Motion
- `--ease`: `cubic-bezier(0.32, 0.72, 0, 1)` (Linear's curve)
- `--ease-out`: `cubic-bezier(0.16, 1, 0.3, 1)` (Apple's curve)
- Durations: 120, 200, 360, 600 ms
- **No bouncy springs, no confetti, no scale-bounce animations.** Hover transitions are `200ms var(--ease)`. Page transitions are crossfade or hairline reveal, never slide-and-bounce.

---

## Component System

All component styles are in `tokens.css`. Build these as primitives in your component library before screens.

### Button
- Heights: `btn-sm` 28, default 36, `btn-lg` 44.
- Variants: `primary` (ink/bg), `accent` (terracotta/paper), `secondary` (paper/ink with hairline border), `ghost` (transparent), `destructive` (rust).
- States: default, hover (slightly darker bg), active (`translateY(0.5px)`), disabled (45% opacity), loading (replace text with hairline spinner).
- Icon-only: `btn-icon` makes it square (36×36).

### Input / Textarea / Select
- Background: `--bg-raised`. Border: 1px `--hairline-3`. Radius: 10px. Padding: 10×14.
- Focus: border becomes `--ink`, 3px `--hairline-2` glow ring.

### Chip
- Height 22, padding 0 8, radius 6. Mono font, 10.5px, uppercase, tracked 0.08em.
- Variants: default (sunk bg), `accent`, `positive`, `negative`, `warning`, `ink` (inverse).

### Score chip — color by range
- High (≥80): `positive-soft` bg, `positive` text
- Mid (60–79): `warning-soft` bg, `warning` text
- Low (<60): `negative-soft` bg, `negative` text
- Format: `<serif num> <mono "/ 100">`.

### Tabs / Segmented control / Toggle
- Tabs: bottom border on selected, mono count badges in `bg-sunk`
- Segmented: 2px-padded pill group, selected button gets paper bg + shadow-1
- Toggle: 36×20 pill, ink when on, white knob slides 16px

### Cards
- Background `--bg-raised`, 1px `--hairline` border, radius 14.
- Inverse CTA card: ink bg, paper text, decorative italic serif letter at bottom-right (10–15% opacity).

### Hairline rules
- `.rule` — 1px hairline, used between sections
- `.rule-thick` — 1px ink, used under section marks (`<SectionMark>`)

### Section mark
Editorial heading pattern: `№ 04` (mono) + serif title + (optional right-aligned eyebrow / button), separated from content by 1px ink rule. See `<SectionMark>` in `shared.jsx`.

### Sidebar
240px wide, ivory bg, hairline right border. Logo + search at top, nav sections in the middle, "Up next" mini-card showing next interview, settings + user pill at bottom.

### Top nav
Crumb breadcrumb (mono uppercase, tracked, ink-4 with ink-5 separators, current item ink-2). Right-side: contextual action buttons + bell icon.

### Charts
- **Radial gauge**: stroke 3, color-by-range, `-90°` rotation. Big serif number centered.
- **Radar**: 6 axes, 4 concentric polygons at 25/50/75/100, accent fill at 14% opacity + 1.5px stroke, dashed comparison line for 30-day average, dot markers at each value.
- **Sparkline**: 1.25 stroke, single dot at last value.
- **Slider track**: 2px height, hairline-3 background, ink fill.

### Audio visualizer (Live Interview)
- Layered concentric rings (`140 + i*70 px`) at decreasing opacity.
- Outer halo: radial-gradient terracotta blur.
- Main blob: 240px circle, radial-gradient `#f4d4b8 → #d97a4a → #9c4a2c`, with inset highlights (top-left bright, bottom-right dark) and 80px terracotta glow.
- Inner highlight: 60px white-soft radial blob.
- SVG `feTurbulence` grain overlay at 6% opacity, mix-blend overlay.
- States: idle (still), listening (subtle pulse), speaking (rings expand on amplitude — drive with Web Audio AnalyserNode in production).

### Empty states — "quote-rule"
Italic serif text at 24px, left-bordered with 1px ink, padded-left 20. Mono attribution underneath. **No illustrations, no characters.**

### Loading skeletons
Linear shimmer animation: 1.6s linear, gradient sweep across `bg-sunk → hairline-2 → bg-sunk`.

### Logo squares
32×32 default, radius 6, hairline border, initials in serif 14px. When a brand color is provided, fill with that color and use paper text. Sizes: 28 (chips), 32 (default), 36 (lists), 48 (drawer hero).

---

## Screens / Views

### 01a — Sign in
**Layout:** 50/50 split. Left = editorial pane on ivory. Right = form pane.
- Left: brand top-left, eyebrow + Vol. 01, then huge serif headline `Job hunting, composed.` (composed in italic terracotta), supporting paragraph, bottom row of three big serif stats (14k offers / +38% lift / 4.9 reviews) separated by 1px hairline verticals.
- Right: section mark `№ 01 · Sign in`, h2, two social-auth buttons (Google + Apple with brand-colored SVGs), `or` divider with hairlines, email + password fields, primary "Sign in" button with arrow, footer text linking to signup.

### 01b — Onboarding
**Step 02 of 03.** Top progress bar (3 segments, 2 filled). Left = copy + form (target role input, years-of-experience segmented control with 5 options, industry chips). Right = upload card with paged-document icon (50×64 with three hairline rules indicating text), drop zone, back/continue footer.

### 02 — Dashboard / Home
**Greeting hero**: serif h1 with greeting (`Good morning, Maya.`) + counts inline (`14 active applications.` muted + `3 interviews` italic terracotta + `this week.`). Bottom-bordered with 1px ink rule.

**Top row** (3-column grid):
- **Primary CTA card** (ink background): "Tailor a résumé to a job description." with action button + ghost link, decorative italic serif `R` numeral at bottom-right (`280px`, 8% white).
- **Up next** card: 3 upcoming interviews with logo, role, company + time, big serif countdown ("1d 4h" — first one in terracotta).
- **Trend** card: huge serif "86" + `+8 vs prior` chip, sparkline over 14 points.

**Kanban preview** (5 columns): same card vocabulary as Screen 05 but compressed.

### 03 — Resume Optimizer · Input
**Section mark** `№ 03 · Tailor a résumé`. Two-column 50/50 grid:
- **Left card** — résumé upload. Parsed file pill at top (`● Parsed` in positive). File preview row with PDF doc-icon, filename, metadata. Below: dashed dropzone for additional version.
- **Right card** — JD textarea (9 rows), with auto-detected role chip top-right (terracotta). Footer: char count + keyword count in mono.

**Below:** single-row card with three segmented controls (Tone / Length / Emphasis) + right-aligned big terracotta action button with ~30s estimate eyebrow.

### 04 — Resume Optimizer · Output (HERO)
**Three-pane** layout: 240 / flex / 360.
- **Left**: Section nav with diff indicators (`+4` add chip, `~7` change chip), diff legend at bottom.
- **Center**: Sunk gray background. White paper card centered (max 720). Renders the résumé verbatim — name in serif 32, bordered-bottom; sections marked with mono eyebrows; bullets with 4px ink dots; **diff highlights**: rewritten phrases get `diff-change-bg` background with terracotta text at bold weight; added phrases get `diff-add-bg` background; new skills appear as `+ skill` chips in `diff-add-bg`.
- **Right**: Match scores (4 metrics with progress sliders, color by range), then "Why we changed this" — annotation cards with left 2px border (terracotta for rewrites, green for adds), 9 notes scrollable. Bottom: secondary download button.

### 05 — Job Tracker · Kanban (HERO)
**Top bar**: serif h1 with italic count (`14 roles in motion.`), right-side stat eyebrows separated by hairlines.

**5 columns** in equal grid:
- **Saved / Applied / Offer / Rejected** — column header is just serif name + mono count.
- **Interview** — accented column: terracotta border, soft accent gradient fade at top, terracotta column title. Includes a dashed-border drop zone at bottom: `Move card here to schedule mock`.

**Card anatomy**:
- Top row: 28px logo square (brand color), role title, mono "more" button
- Middle: salary range (mono) + days indicator (mono)
- Interview cards have a terracotta accent strip with mic icon + "Thu 2:00 PM" in mono uppercase, ending with `→`
- Offer cards have a positive-soft strip with "OFFER" eyebrow + serif amount
- Bottom (if linked artifacts): hairline-top row of small icon+count pairs (résumé doc, notes, mic-booked)
- Rejected cards: 55% opacity throughout

### 06 — Job Detail Drawer
**600px right-side panel** over a dimmed kanban (32% black scrim). Drawer has shadow-4 and 1px hairline left border.

- Header: close button + `JOB · INTERVIEW` eyebrow + Source/More on right
- Hero: 48px logo, serif h2 role, chip row (salary, full-time, equity, **terracotta `Interview · Thu 2:00 PM`**)
- **Inverse CTA card** (ink bg) with terracotta button: "Take a 2-minute mock interview." with metadata
- Tabs: Overview / JD / Résumé Versions (count) / Notes (count) / Timeline
- **Overview** tab content: Active résumé version card with score chip, People list (3 rows with status chips), Notes preview as italic serif blockquote with mono datestamp
- **Timeline** tab: vertical 1px hairline rail with 7px dots (terracotta for next-up event), date in mono left + activity right
- Footer: hairline-top, ghost left button, secondary + primary right buttons

### 07 — AI Interview · Pre-call lobby
Centered 720px column on ivory. Job context strip at top (logo + role + chips). Centered serif h1: `Compose yourself.` (italic on "Compose"). Three sections vertically:

1. **Mic check card**: round 44px positive-soft icon, device name, "● LISTENING" eyebrow, **live waveform** (38 vertical bars varying 3–24px tall, every 4th at full opacity)
2. **Voice picker** — three buttons in equal grid. Each button: serif name (18px) + 24px ▶ play circle + mono description. Selected = ink fill, paper text.
3. **Bottom row**: Style segmented (Friendly/Neutral/Tough) + right-aligned "Begin interview →" big terracotta button with `2 minutes · You can end anytime` eyebrow

### 08 — Live Interview (HERO)
**Theater mode**, full-bleed dark `#14130e` with `feTurbulence` grain at 6% opacity.

- **Top bar**: red recording dot + "RECORDING · Thu, 1:47 PM" mono / question counter centered (`Question 02 of 04`) / countdown `00:42` in serif terracotta
- **Center stage**: layered rings (4 concentric circles at decreasing opacity), terracotta halo (radial-gradient blur), main 240px **morphing orb** (radial-gradient `#f4d4b8 → #d97a4a → #9c4a2c` with inset shadows), 60px white-soft inner highlight, "● Halden is speaking" mono caption below
- **Question text overlay**: serif 36px italic with key phrase `last shipped project` in italic terracotta
- **Bottom bar** 3-col: user mic indicator (waveform 22 bars) / **78px round red end-button** (square stop-icon, 8px outer glow ring) / "Live transcript" toggle
- **Floating live transcript** card top-left: glassmorphic blur, mono speaker labels (Halden in terracotta, You in muted), filler words underlined dotted-terracotta, in-progress text highlighted with translucent box

### 09 — Performance Dashboard (HERO)
Single scrollable page on ivory. **Long: 2400px.**

1. **Hero strip** — 3-column: 240px radial gauge (84) / serif h1 `Strong, with one soft edge.` (italic terracotta on "soft edge") + meta eyebrows row / right-aligned positive chip "+12 vs last run" + neutral chip "Top 18%"
2. **Radar + breakdown** — 50/50: card with 6-axis radar (Clarity, Confidence, Relevance, Structure, Technical, Pace) showing solid terracotta polygon for current run + dashed gray comparison polygon for 30-day average / 6-row breakdown table with mono index, dimension name + descriptor, big serif number, score chip
3. **Question by question** — Section mark + segmented filter. 4 cards, each: left rail with `Q1`–`Q4` eyebrow, big serif score (color by range), mono time. Right: italic serif question, italic gray transcript box (sunk bg), and (when applicable) terracotta "A better answer would have…" callout
4. **Filler + pace** — 50/50: filler words bar chart (4 rows with rust fill) / pace sparkline with Q-segments labeled, Q4 in warning. Footnote box explaining 140–170 wpm sweet spot
5. **Improvement plan** — Section mark + 3 cards: mono FOCUS index in terracotta, serif title, body, hairline-top footer with time estimate + "Begin →"
6. **Footer ink-card** — "Apply learnings to résumé" with secondary "Retake" + primary terracotta "Apply to résumé" buttons

### 10 — Settings
240px tabs nav left (Profile selected) + form content right. Section mark `№ 10 · Profile`. Two-column form, then hairline-divided rows for: 2FA toggle, default voice select, delete account (negative-colored title + secondary button on right).

### Auxiliary states
- **Empty Optimizer**: 2-column. Left = serif h2 + body + actions. Right = quote-rule blockquote ("The best résumé is the one written for the room you want to be in.")
- **Loading Optimizer**: same 3-pane shell as output, but center is a paper card with skeleton bars (shimmer animation), right rail is a 4-step generation progress (✓ ✓ ⊙ spinning ○ pending)
- **Dashboard dark variant**: identical layout, dark tokens applied via `[data-theme="dark"]`

---

## Interactions & Behavior

### Navigation
- Sidebar links navigate top-level surfaces. `aria-current="page"` on active.
- Crumbs are not interactive in this design; treat them as a route indicator.

### Kanban (screen 05)
- Cards are draggable between columns. Use `@dnd-kit/sortable` or HTML5 DnD.
- Ghost preview during drag: 60% opacity copy of the card, follows cursor.
- Dropping into "Interview" column triggers a side-effect: open Job Detail Drawer to schedule mock (or auto-create a 30-min slot).
- Search filters in real-time (client-side filter on title + company).
- Filter button opens a popover with status, salary range, location, days-since.

### Drawer (screen 06)
- Slide-in from right at 360ms `--ease`, scrim fades simultaneously.
- ESC closes; click on scrim closes.
- Tabs are uncontrolled; `useState("overview")`.
- "Take AI Mock Interview" button navigates to Pre-call lobby (screen 07) carrying job context.

### Resume Optimizer (screen 04)
- Clicking an annotation in the right rail scrolls the corresponding line in the center pane into view (`scrollIntoView({ behavior: "smooth", block: "center" })`) **WAIT** — do not use scrollIntoView per project conventions; instead compute the offset and animate `scrollTop`.
- Hovering an annotation highlights its target line with a 200ms accent flash.
- The active version toggle in the drawer's "Résumé Versions" tab updates which version is "active" — only one can be on at a time.

### Pre-call lobby (screen 07)
- Voice picker plays a 3-second sample on click (no auto-play).
- Mic check requires `navigator.mediaDevices.getUserMedia({audio:true})` — show error state if denied.
- "Begin interview" navigates to live call (screen 08) and starts countdown.

### Live call (screen 08)
- Countdown 2:00 → 0:00. **Last 30 seconds**: countdown turns terracotta and pulses at 1s interval.
- Audio visualizer reacts to interviewer voice amplitude — connect Web Audio `AnalyserNode` to the orb's scale/glow.
- Live transcript can be toggled — when off, only the question text is shown.
- End button: confirm dialog → navigate to Performance Dashboard (screen 09).

### Performance Dashboard (screen 09)
- Question cards: clicking the transcript expands inline to full transcript with timestamps.
- "Apply learnings to résumé" navigates to Optimizer Input with the suggestions pre-filled as constraints.
- "Retake interview" navigates back to Pre-call lobby.

### Form validation
- Email: standard regex; show inline error below field in negative color, italic serif 13px.
- Required fields: subtle red asterisk in label.
- File upload: max 8MB, PDF/DOCX only. Reject other types with toast.

### Toasts (not shown in mocks but specified)
- Bottom-center, 14px ink-card, 4s auto-dismiss, slide-up-fade enter, fade exit. One at a time.

---

## State Management

### Global / app-level
- `currentUser` (auth)
- `theme` ("light" | "dark") — persist to localStorage
- `accentHue` (number 0–360, default 22) — persist to localStorage
- `density` ("comfortable" | "compact") — persist

### Resume Optimizer
- `draftId`, `resumeFile`, `jobDescription`, `tone`, `length`, `emphasis`
- After generate: `output`, `diffs[]`, `scores`, `annotations[]`
- `selectedAnnotationId` for cross-highlighting

### Job Tracker
- `jobs[]` with `{ id, company, role, location, salary, status, daysSince, links: { resumeIds[], notes[], interviewBooked }, color }`
- `filters` (status, salaryMin/Max, location, dayRange)
- `searchQuery`

### Job Detail Drawer
- `openJobId | null`
- `activeTab` ("overview" | "jd" | "resumes" | "notes" | "timeline")

### Live Interview
- `state` ("idle" | "listening" | "speaking" | "ended")
- `currentQuestion` (1–4), `transcript[]`, `remainingMs`, `audioStream`

### Performance
- `runId`, `scores`, `dimensions[]`, `questions[]` (each with q, score, time, transcript, suggestion)
- `compareTo` (30d avg run)

---

## Data fetching

- Auth: standard JWT or session cookie.
- Résumé optimization: streaming response — show skeleton (screen 04 loading state) while server processes; the 4-step progress indicator should reflect actual server-sent events.
- Live interview: WebSocket or WebRTC for bidirectional audio + transcript stream.
- Performance computation: synchronous after interview ends; accept up to 5s wait with skeleton.

---

## Assets

No external assets required. All visuals are CSS, SVG, or Google Fonts.

- **Fonts**: Fraunces (Google), JetBrains Mono (Google), Geist (Vercel — `npm install geist`)
- **Icons**: All inline SVGs in `icons.jsx`. Single-stroke, 1.25 width, currentColor. ~30 icons. Port to your icon system (e.g., Lucide is acceptable substitute — closest matches: home, file-text, columns, mic, line-chart, settings, search, plus, arrow-right, x, check, upload, download, filter, more-horizontal, sun, moon, eye, bell, sticky-note, pin, flame, clock, map-pin, cpu, grip-vertical, link, sparkles, phone, quote).
- **Logos**: company logos in screens are CSS squares with brand color + initials. In production, use real logo SVGs from Clearbit or similar and fall back to the initials square.

---

## Accessibility

- All interactive elements have visible focus rings (3px accent-soft glow + 1px accent border).
- Color is never the sole indicator (score chips have number; diff highlights have ARIA labels).
- Live interview countdown announces every 30s via `aria-live="polite"`.
- Transcript is the source of truth for audio content (always available via toggle).
- Minimum tap target 44×44 on mobile (this design is desktop-primary, but plan ahead).

---

## Files in `design_reference/`

- `Hyrd.html` — entry point, mounts the design canvas with all 10 screens
- `tokens.css` — **all design tokens + base component styles. Port these verbatim.**
- `icons.jsx` — icon component (replace with your icon library)
- `shared.jsx` — `AppShell`, `RadialGauge`, `Radar`, `Sparkline`, `LogoSq`, `ScoreChip`, `Brand`, `SectionMark`, `Chip`, `Eyebrow`
- `screens-1.jsx` — Auth, Onboarding, Dashboard, Optimizer Input, Settings
- `screens-2.jsx` — Optimizer Output, Kanban, Job Detail Drawer
- `screens-3.jsx` — Pre-call Lobby, Live Interview, Performance Dashboard
- `screens-extra.jsx` — Empty / Loading / Dark variant states
- `design-canvas.jsx`, `tweaks-panel.jsx` — preview shell only; **do not port to production**

---

## Recommended implementation order

1. Set up Next.js + TS + Tailwind. Port `tokens.css` → `globals.css` + extend Tailwind theme.
2. Build primitives: Button, Input, Chip, ScoreChip, Card, Tabs, Toggle, Segmented, SectionMark, Eyebrow, Skeleton.
3. Build layout: AppShell (sidebar + topnav). Get routing working between empty pages.
4. Build charts: RadialGauge, Radar, Sparkline as headless components.
5. Build screens in this order (low risk → high risk): Settings → Auth → Onboarding → Dashboard → Optimizer Input → Kanban → Job Detail Drawer → Performance Dashboard → Optimizer Output → Pre-call Lobby → Live Interview.
6. Wire interactions and data fetching.
7. Pass design QA against `Hyrd.html` reference.

---

## Anti-patterns — do not introduce

- No bouncy springs, no scale-pop animations, no confetti
- No emoji in UI copy
- No generic stock illustrations or character mascots
- No gradient backgrounds (the orb is the only gradient surface — and it's intentional)
- No glassmorphism on light surfaces (only on the dark live-call transcript card)
- No drop-shadows above `--shadow-3` outside of the drawer/modal
- No mixing serif and sans within a single line (serif for display only)
- No exclamation marks in any copy

The bar: **every screen should look finished enough to ship to production tomorrow.**
