---
name: cecistudy-design-system
description: Use when building or modifying any UI element in the cecistudy project (components, styles, colors, fonts, spacing, layout). Apply the design system tokens from src/index.css, use semantic token classes, follow existing UI patterns (pill tabs, journal-card, modal overlay, book cover, badges), and never hardcode raw hex colors.
---

# cecistudy Design System

Guide for writing UI that matches the cecistudy visual language. Reference:
`.context/design-system.md` for the full tables.

## Core rules

1. **Never hardcode raw hex** (e.g. `text-[#40383A]`, `bg-[#FFF5F7]`). Prefer the
   semantic tokens already defined in `src/index.css` (`@theme`):
   - `ceci-primary/secondary/tertiary/muted` — text
   - `ceci-brand` / `ceci-brand-strong` — rose brand accents
   - `ceci-academic` / `ceci-academic-strong` — blue academic accents
   - `surface-default/subtle/muted/rose/blue`, `canvas`
   - `ceci-border-subtle/default/strong/brand/academic`
   - `rose-*`, `blue-*`, `cream-*`, `beige-*`, `green-*`, `yellow-*`, `red-*` scales

2. Keep radius and shadows inside the token scale:
   - Radius: `--radius-xs..3xl` (6–32px). Cards `rounded-[20-24px]`, pills `rounded-full`.
   - Shadows: `shadow-xs..xl` + `shadow-floating` (base `rgba(64,56,58,…)`).

3. Follow existing UI patterns instead of inventing new ones:
   - **Pill sub-tab:** `rounded-full text-xs font-semibold`; active = `bg-[#40383A] text-white shadow-xs`, inactive = `bg-white text-[#6D6366] border-[#E9DFDC]`.
   - **Card:** `.journal-card` or `rounded-[24px] bg-white border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)]`.
   - **Modal overlay:** `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200`.
   - **Book cover:** colored container with spine (`absolute left-0 w-2.5 bg-black/10`), top badge, centered title, author at base, progress bar when `status === 'lendo'`.
   - **Bookmark/favorite:** active = `bg-[#FFF5F7] border-[#FFD3DD] text-[#B94862]` + filled icon.

4. Mobile-first: container `max-w-md sm:max-w-xl mx-auto`. Ensure touch targets ≥ 44px (`.touch-target`).

## Fonts
- Body: Inter (`--font-sans`). Titles: `font-display` (Plus Jakarta Sans).
- Academic serif: `.font-serif-academic` (DM Serif Display). Mono: `--font-mono` (JetBrains Mono).

## When in doubt
Read `.context/design-system.md` and mirror the pattern used by the nearest existing component.
Do not introduce new color palettes or shadow/radius values outside the token scale.
