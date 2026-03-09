# RowIQ — Design Reference

Use this as your source of truth when building the landing page.

---

## Brand Identity

| Property | Value |
|---|---|
| **App name** | RowIQ |
| **Tagline** | "Train smarter. Row faster." |
| **Logo** | `<Waves>` Lucide icon + bold wordmark "RowIQ" |
| **Logo weight** | `font-black` |
| **App type** | PWA (Progressive Web App), mobile-first |
| **PWA theme color** | `#1e3a5f` |

---

## Design Aesthetic

- Clean, **light-mode only** — no dark mode
- **Mobile-first**, max-width capped for readability
- Card-heavy UI with generous white space
- Deep navy primary + warm orange accent — similar feel to Whoop or Strava
- System font stack — no custom web fonts
- Relies on color-coded badges and status indicators rather than decorative elements

---

## Color Palette

### Primary Brand Colors

| Name | Hex | Usage |
|---|---|---|
| **Brand Navy** | `#1e3a5f` | Primary buttons, header bg, active nav, links, focus rings |
| **Navy Dark** | `#162d4a` | Hover state for primary buttons |
| **Navy Darkest** | `#0f2d52` | Gradient start (auth header) |
| **Navy Light** | `#2d5a8e` | Gradient end (auth header) |
| **Accent Orange** | `#f97316` (`orange-500`) | CTAs, streaks, accent highlights, unread badge |
| **Accent Orange Hover** | `#ea6c00` (`orange-600`) | Hover state for accent buttons |

### Neutral Scale (Tailwind Slate)

| Token | Hex approx. | Usage |
|---|---|---|
| `slate-50` | `#f8fafc` | Page background, stat tile backgrounds |
| `slate-100` | `#f1f5f9` | Tab list bg, secondary button bg, hover states, chart grid lines |
| `slate-200` | `#e2e8f0` | Borders on inputs, unselected states |
| `slate-300` | `#cbd5e1` | Chevron icons, disabled borders |
| `slate-400` | `#94a3b8` | Placeholder text, muted icons, inactive nav |
| `slate-500` | `#64748b` | Secondary text, labels, descriptions |
| `slate-600` | `#475569` | Medium text, ghost button text |
| `slate-700` | `#334155` | Label text |
| `slate-900` | `#0f172a` | Primary headings, bold values, body text |

### Semantic / Status Colors

| Meaning | Background | Text / Border |
|---|---|---|
| **Success** | `bg-green-50` | `text-green-700`, `border-green-200` |
| **Warning** | `bg-yellow-50` | `text-yellow-700`, `border-yellow-200` |
| **Danger / Destructive** | `bg-red-50` | `text-red-700`, `border-red-500` |
| **Info** | `bg-blue-50` | `text-blue-800`, `border-blue-200` |
| **Accent** | `bg-orange-100` | `text-orange-700` |

### CSS Custom Properties (HSL)

Defined in `src/index.css`. Use these if working with CSS variables:

```css
--background:          0 0% 100%;       /* white */
--foreground:          222 47% 11%;     /* near-black navy */
--primary:             213 63% 24%;     /* deep navy #1e3a5f */
--primary-foreground:  0 0% 98%;        /* off-white */
--secondary:           210 40% 96%;     /* very light blue-gray */
--muted:               210 40% 96%;     /* very light blue-gray */
--muted-foreground:    215 16% 47%;     /* medium slate */
--accent:              25 95% 53%;      /* warm orange */
--accent-foreground:   0 0% 98%;        /* off-white */
--destructive:         0 84% 60%;       /* red */
--border:              214 32% 91%;     /* light slate */
--input:               214 32% 91%;     /* light slate */
--ring:                213 63% 24%;     /* deep navy */
--radius:              0.75rem;         /* 12px base radius */
```

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
-webkit-font-smoothing: antialiased;
```
No custom web fonts — system fonts only.

### Font Weights

| Weight | Usage |
|---|---|
| `font-medium` (500) | Labels, nav items, secondary text |
| `font-semibold` (600) | Section headers, names |
| `font-bold` (700) | Page titles, card titles, buttons |
| `font-black` (900) | Display numbers, stat callouts, logo wordmark |

### Font Size Scale

| Tailwind class | Size | Usage |
|---|---|---|
| `text-xs` | 12px | Badges, timestamps, uppercase category labels |
| `text-sm` | 14px | Body text, form inputs, descriptions |
| `text-base` | 16px | Card titles, medium-emphasis text |
| `text-lg` | 18px | Stat values in tiles |
| `text-xl` | 20px | Page headings |
| `text-2xl` | 24px | Auth page headings |
| `text-3xl` | 30px | Large stat numbers |
| `text-4xl` | 36px | Logo wordmark on auth/landing |
| `text-5xl` | 48px | Hero display numbers |

---

## Spacing & Layout

### Page Structure

| Property | Value |
|---|---|
| Page background | `bg-slate-50` (`#f8fafc`) |
| Max width (athlete views) | `max-w-lg` (512px) |
| Max width (coach/wide views) | `max-w-2xl` (672px) |
| Horizontal padding | `px-4` (16px) |
| Vertical padding | `py-5` (20px) |
| Section spacing | `space-y-5` (20px gaps) |

### App Shell Pattern

- **Header:** `sticky top-0 z-40`, `px-4 py-3`, `bg-[#1e3a5f]` (deep navy)
- **Body:** `bg-slate-50`, `flex-1 overflow-y-auto pb-20`
- **Bottom navigation:** `fixed bottom-0`, `bg-white border-t border-slate-200`

### Auth / Hero Section Pattern

- Full-height gradient block: `bg-gradient-to-br from-[#0f2d52] via-[#1e3a5f] to-[#2d5a8e]`
- Content lifts up from below: `bg-white rounded-t-3xl` (24px top radius)
- Content padding: `px-6 pt-8 pb-8`

---

## Border Radius Patterns

| Radius | Tailwind | Usage |
|---|---|---|
| 4px | `rounded` | — |
| 8px | `rounded-lg` | Tab triggers, small chip buttons |
| 12px | `rounded-xl` | Buttons, inputs, selects, stat boxes |
| 16px | `rounded-2xl` | Cards, page containers, alerts |
| 24px | `rounded-3xl` | Auth bottom sheet, hero content card |
| 9999px | `rounded-full` | Avatars, pills, badges, circular icons |

---

## Shadows

| Value | Usage |
|---|---|
| `shadow-sm` | Cards (default resting state) |
| `shadow-md` | Cards on hover |
| `shadow-lg` | Gradient CTA cards on hover |
| `shadow-xl` | Modals / dialogs |

---

## Component Patterns

### Buttons

Base: `rounded-xl text-sm font-semibold transition-colors focus-visible:ring-2`

| Variant | Style |
|---|---|
| **Primary** (default) | `bg-[#1e3a5f] text-white hover:bg-[#162d4a]` |
| **Accent** | `bg-orange-500 text-white hover:bg-orange-600` |
| **Outline** | `border-2 border-[#1e3a5f] text-[#1e3a5f] bg-transparent hover:bg-blue-50` |
| **Secondary** | `bg-slate-100 text-slate-900 hover:bg-slate-200` |
| **Ghost** | `text-slate-700 hover:bg-slate-100` |
| **Destructive** | `bg-red-600 text-white hover:bg-red-700` |
| **Success** | `bg-green-600 text-white hover:bg-green-700` |

Button heights: `sm` = 36px, `default` = 44px, `lg` = 56px, `xl` = 64px

### Cards

```
bg-white rounded-2xl shadow-sm border border-slate-100
header: p-5 pb-3
content: p-5 pt-0
hover: hover:shadow-md transition-shadow
```

### Badges / Pills

Base: `rounded-full px-2.5 py-0.5 text-xs font-semibold`

Uses the semantic color combinations from the status table above.

### Inputs / Selects

```
h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-base
focus: border-[#1e3a5f]
placeholder: text-slate-400
```

### Tabs

```
List:    h-11 rounded-xl bg-slate-100 p-1
Active:  bg-white text-[#1e3a5f] shadow-sm font-bold rounded-lg
Inactive: text-slate-600 rounded-lg
```

### Modals / Bottom Sheets

- Overlay: `bg-black/50 backdrop-blur-sm`
- Sheet: `bg-white rounded-t-3xl px-6 pt-6 pb-8 max-h-[92dvh] overflow-y-auto`
- Dialog: `max-w-lg bg-white p-6 shadow-xl rounded-2xl border max-h-[90dvh] overflow-y-auto`

### Alert / Status Banners

Left-border accent pattern:
```
bg-red-50    border-l-4 border-red-500    rounded-2xl p-4   (high severity)
bg-yellow-50 border-l-4 border-yellow-500 rounded-2xl p-4   (medium severity)
```

---

## Animations & Transitions

| Effect | Where used |
|---|---|
| `transition-colors` | Buttons, inputs, nav links, interactive cards |
| `transition-shadow` | Cards on hover |
| `transition-all` | Toggle buttons, chip selectors |
| `animate-pulse` | Alert/unread indicator dots |
| `backdrop-blur-sm` | Modal overlays |

---

## Icon Library

**Lucide React** exclusively.  
Icons use `stroke-width` adjusted contextually — `stroke-[2.5]` for active nav icons, default `stroke-2` elsewhere.

---

## Mobile / PWA Specifics

```css
min-height: 100dvh;           /* dynamic viewport height for iOS */
overscroll-behavior: none;    /* prevents pull-to-refresh */
box-sizing: border-box;       /* global reset */

.safe-bottom { padding-bottom: max(env(safe-area-inset-bottom, 0px), 8px); }
.safe-top    { padding-top: env(safe-area-inset-top, 0px); }
```

---

## Tech Stack (for matching implementation)

| Tool | Version / Notes |
|---|---|
| **Tailwind CSS** | v4 — no `tailwind.config.js`, uses `@import "tailwindcss"` |
| **Radix UI** | Dialog, Select, Tabs, Label, Slot |
| **CVA** | `class-variance-authority` for variant components |
| **Icons** | `lucide-react` |
| **Charts** | `recharts` |
| **Utility** | `clsx` + `tailwind-merge` via `cn()` helper |

---

## Landing Page Recommendations

Based on the existing design language, a landing page should:

1. **Hero:** Full-width gradient block — `bg-gradient-to-br from-[#0f2d52] via-[#1e3a5f] to-[#2d5a8e]` — white logo + tagline "Train smarter. Row faster." — primary CTA button in white or accent orange.
2. **Content card:** `bg-white rounded-t-3xl` lifting up from the hero, matching the auth page pattern.
3. **Feature cards:** `bg-white rounded-2xl shadow-sm border border-slate-100` with `p-5` padding.
4. **CTAs:** Primary = `bg-[#1e3a5f]`, secondary accent = `bg-orange-500` — both `rounded-xl h-12 font-semibold`.
5. **Body background:** `bg-slate-50`.
6. **Typography:** System font stack, headings in `font-bold` / `font-black`, body in `text-slate-600` or `text-slate-700`.
7. **Max width:** Center content at `max-w-2xl` or `max-w-4xl` with `px-4`–`px-6` horizontal padding.
8. **No dark mode** — build light-only.
