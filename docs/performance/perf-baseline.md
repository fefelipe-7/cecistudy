# Baseline de performance — cecistudy

> Gerado pela F1 do [`tasks/todo-performance.md`](../tasks/todo-performance.md)
> (spec-performance.md §"Fase 1 — Instrumentação e baseline").
> **Data:** 2026-10-10 · **Ambiente:** máquina de dev Windows (Node 26.3.1,
> npm 12) — sem SDK Android/iOS, sem browser automatizado para tempo de carga.

## Como medir a partir da F1

1. `npm run dev`, abra o app no navegador (ou device via `npm run dev -- --host`).
2. No console em dev, o grupo **`[perf] N medições · M eventos`** aparece
   quando a splash sai (`interactive-ready` → `flushDevMetrics()`).
3. As mesmas marcas ficam no User Timing API — visíveis no DevTools
   (Performance → Timings) e mensuráveis via
   `performance.getEntriesByType('measure')`.

### Marcas no ar (F1)

| Marca / medição | Onde dispara |
|---|---|
| `app-entry-start` | `src/main.tsx:21` · `apps/mobile/src/app/main.tsx:27` |
| `theme-ready` | `src/main.tsx:24` (web; no cliente mobile o tema vem com a hidratação do provider — vira passo de boot na F2) |
| `first-screen-mounted` | `src/shells/MobileAppShell.tsx` (montagem da casca — cobre web e mobile) |
| `interactive-ready` | `src/components/ui/BootSplash.tsx` (fim do fade = primeira interação possível) |
| `boot-critical-start/end` + `critical-boot-duration` | `runBootPreload` — hoje o span inteiro é crítico (splash espera tudo); a separação deferred/opportunistic é a F2 |
| `first-route-chunk-start/end` | passo `views` do boot (chunk da Home) |
| `sqlite-hydration-start/end` | `getUserDb()` (bootstrap + migrações, nativo) |
| `catalog-request-start/end` | `getCatalogApproaches` / `getCatalogQuestions` (nativo) |
| `persist-write-start/end` | `useSqliteState` (cada write-through, debounce 200 ms) |
| `sync-cycle-start/end` | `performSync` (toda tentativa, manual ou background) |
| `FrameStats` (`frames`/`skipped`) | `createFrameStats()` — consumo pelos gráficos dithered entra na F4 |

Em produção todas as funções são no-op (zero custo no caminho quente).

## O que está medido (reproduzível nesta máquina)

| Métrica | Valor (2026-10-10) | Como reproduzir |
|---|---|---|
| Bundle web (JS) | 18,0 MiB · 120 arquivos | `Remove-Item dist -Recurse -Force; npm run build:web` |
| Entrada crítica (4 chunks do `index.html`) | 799 KB raw / ~253 KB gzip | `artifacts/bundle-report.json` |
| Top chunks | banco de questões 4,39 MiB · ThreeDPaper 2,44 MiB · authors 2,11 MiB · comparisons 1,99 MiB | `artifacts/bundle-report.json` |
| Fontes | 103 arquivos · 1,37 MiB (woff+woff2 duplicados) | `artifacts/bundle-report.json` |
| Catálogo | 19,95 MiB (`public/assets/databases/cecistudy_catalog.db`) | disco |
| Testes | 1466 pass / 123 arquivos | `npm run test:ci` |
| Typecheck / boundaries | 0 erros / OK | `npm run verify` |

## O que NÃO está medido (pendência de ambiente)

Os P50/P75/P95 da spec (§"Critério de conclusão" da Fase 1) exigem:

- **TTI / cold / warm start reais** — browser com timing automatizado
  (Playwright + `performance.getEntriesByType('measure')` via script) ou
  aparelho com DevTools remoto. A máquina atual não tem nenhum dos dois
  configurado.
- **Android mid/low-end e iPhone anterior** — sem JDK/SDK/Xcode nesta máquina
  (bloqueio conhecido do repo). Quando houver device: `npm run dev --
  --host`, abrir com remote debugging e ler o grupo `[perf]` do console.
- **Conexão lenta / `saveData`** — DevTools → Network → Fast 3G + "request
  doesn't respect saveData" (emulação); registrar `critical-boot-duration` e
  `interactive-ready` nos dois modos.

Quando medir, preencher aqui (manter a forma `P50/P75/P95`):

| Cenário | critical-boot-duration | interactive-ready | observações |
|---|---|---|---|
| web desktop, cold | — | — | |
| web desktop, warm | — | — | |
| Android mid-range, cold | — | — | |
| Android low-end, cold | — | — | |
| iPhone anterior, cold | — | — | |
| 3G + saveData | — | — | |
