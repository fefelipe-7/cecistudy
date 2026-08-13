---
name: cecistudy-navigation
description: Use when adding or modifying navigation flows in the cecistudy project — views, sub-tabs, the dynamic header, cross-view deep links (targetId), or the global search. There is no router; navigation is state-driven from App.tsx.
---

# cecistudy Navigation

The project has no router. Navigation is driven by state in `App.tsx`. Full reference:
`.context/architecture.md` (section 4).

## Model
- `activeTab: NavTab` → `'home' | 'faculdade' | 'estudos' | 'biblioteca' | 'perfil'`.
- Per-tab sub-tabs (state inside each view): `SubTabFaculdade`, `SubTabEstudos`,
  `SubTabBiblioteca`, `SubTabPerfil`.
- `handleNavigate(tab, subTab?, targetId?)` centralizes tab changes and scrolls to top.

## Deep links / cross-view navigation
- `targetId` lets the GlobalSearchModal open a specific entity (e.g. a Course) from another tab.
- `focusedCourseId` renders `CourseDetailView` as a drill-down within Faculdade.

## Dynamic header (`DynamicHeaderConfig`)
Built in `App.tsx`. Two modes:
- **default** — brand header (logo "C", "cecistudy ♡", semester badge, search, mood).
- **detail** — back button, icon/code, title/subtitle, bookmark toggle, and `rightActions`
  (e.g. an "Anotação" quick-add button).

Fields: `type`, `title`, `subtitle`, `code`, `badge`, `badgeColor`, `icon`, `color`,
`onBack`, `isBookmarked`, `onToggleBookmark`, `rightActions`.

## Rules
1. Add sub-tabs via the existing pill pattern (see design-system skill).
2. Route deep links through `handleNavigate` / `targetId`; don't build ad-hoc navigation.
3. When opening a detail view, set the matching `headerConfig` (detail mode) so the header
   shows a back button and context.
4. Views receive navigation via props (`onNavigate`, `onOpenQuickAdd`, etc.) — follow the
   existing prop-drilling contract.
