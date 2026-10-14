# Todo: redesign da tela de perfil (SPEC-013)

> Plano: [`./plan-perfil-redesign.md`](./plan-perfil-redesign.md)
> Spec: [`../docs/specs/SPEC-013-perfil-identidade-jornada-e-configuracoes.md`](../docs/specs/SPEC-013-perfil-identidade-jornada-e-configuracoes.md)
> Cópia de grupo: [`../../docs/specs/mobile/SPEC-M-017-perfil-identidade-jornada-e-configuracoes.md`](../../docs/specs/mobile/SPEC-M-017-perfil-identidade-jornada-e-configuracoes.md)

> **Estado em 2026-10-14.** F0–F8 fechadas; F9 fecha em duas linhas que
> **dependem de navegador** e não rodam nesta máquina (ver F9). As remoções que
> estavam marcadas "fecha com a reescrita do `PerfilView`" aconteceram: os
> componentes antigos não existem mais em `src/components/views/perfil/`.
>
> **Contagem é gerada, não copiada.** Para o número de testes do perfil:
> `npm run test -- src/components/views/perfil src/lib/__tests__/profileViewModel.test.ts`

## F0 — Governança e blindagem

- [x] Registrar `SPEC-013` (app) e `SPEC-M-017` (grupo) no índice `docs/specs/README.md`
- [x] Flag local de dev (perfil antigo × novo) — **não foi criada**: a composição nova entra direto e o perfil antigo morre no mesmo commit; a remoção anotada em F9 fica sem efeito
- [x] Congelar baseline: `git diff --stat contracts/` vazio
- [x] Registro de decisão: funil sai (D7); ofensiva vira conquista (D8)

## F1 — View model

- [x] `src/lib/profileViewModel.ts` com `deriveProfileViewModel` puro e memoizado
- [x] Reusar `degreeProgress`/`semestersLeft` (`termScope`), `formatStudyTime` (`profileMeta`), `totalXp`/`levelFor`/`generalTitle`/`xpToNextLevel` (`levels`)
- [x] `profile.semester` só como fallback; nenhuma janela temporal
- [x] `src/lib/__tests__/profileViewModel.test.ts` cobre os 10 casos do §2/D2

## F2 — Identidade + edição

- [x] `perfil/ProfileHero.tsx` (eyebrow, avatar, nome `h1`, curso·universidade, frase, nível)
- [x] `perfil/ProfileAvatar.tsx` (foto/iniciais, câmera, remover)
- [x] `perfil/ProfileEditSheet.tsx` (`guardar perfil`, dirty state, erros por campo)
- [x] Formulário de identidade saiu do fim da página — `PersonalizationSection.tsx` não existe mais
- [x] `perfil/__tests__/ProfileHero.test.tsx` + interação (salvar/fechar-dirty/foto)

## F3 — Jornada agora + trilho

- [x] `perfil/JourneyNow.tsx` (semestre, badge, %, CTA, `corrigir`, aviso além-do-total)
- [x] `perfil/JourneyRail.tsx` (passado/atual/futuro, texto, `aria-current`, até 12)
- [x] Barra de progresso do antigo `ProfileHeader` e a frase do `JourneyTimeline` saíram — ambos os arquivos não existem mais
- [x] `perfil/__tests__/JourneyRail.test.tsx` (1, 2, 8, 12 e ordinal > total)

## F4 — Ritmo + saída do funil

- [x] `perfil/ProgressPulse.tsx` (horas, páginas, tarefas feitas/total, provas)
- [x] `perfil/PulseMetric.tsx` (`button`/`a`, sem `div role=button`)
- [x] `DitherFunnelChart` saiu da tela (D7) — garantido por teste, não só por revisão
- [x] `perfil/__tests__/ProgressPulse.test.tsx` + navegação por métrica

## F5 — Memória + conquistas

- [x] `perfil/JourneyHistory.tsx` (atual + 2 anteriores, por id, CTA histórico)
- [x] `perfil/AchievementsPreview.tsx` (nível/título, stickers, próximo objetivo, ofensiva)
- [x] CTA de virada duplicado saiu — o `JourneyTimeline.tsx` não existe mais, e `ProfilePage.test.tsx` fixa **um** CTA na tela (I3)
- [x] `StudyStatsWidget` deixou de ser bloco próprio (D8) — virou item de `AchievementsPreview`, coberto por `ProfilePage.test.tsx`

## F6 — Preferências em rows

- [x] `perfil/ProfilePreferences.tsx` + `perfil/PreferenceRow.tsx`
- [x] Tema em sheet reaproveitando `ThemePickerCard`; lembrete e gcal com handlers atuais
- [x] `perfil/__tests__/PreferenceRow.test.tsx` + navegação por teclado

## F7 — Dados e manutenção

- [x] `perfil/ProfileDataMaintenance.tsx` + `DangerZone.tsx`
- [x] Reaproveitar `DataSection` (modais de reset/import/decrypt/export); sync em primeiro
- [x] OTA só no nativo (via `native` do VM)

## F8 — Responsivo, temas, motion e a11y

- [x] Grid 7/5 a partir de 900 px; container 1120 px em ≥1200 — `ProfilePage.test.tsx` fixa as três classes
- [~] Contraste nos 6 temas — **verificado, com débito**: os pares de corpo passam (`themes.test.ts` cobre WCAG AA nos 6), mas `ceci-brand-strong` sobre `surface-rose`/`surface-muted` **falha** em `neon` (3.52 / 3.79) e `amanhecer` (4.43). É um **token compartilhado**, usado como idioma em 100+ lugares do app — corrigir é decisão de design do tema inteiro, não do perfil. Ver "Débito de contraste" abaixo.
- [x] `prefers-reduced-motion`: a tela não anima nada (sem `animate-*`, sem `framer-motion`, sem `AnimatedNumber`), então não há cascata, pulse de nó nem contador para desligar. A regra global vive em `src/index.css:558`
- [x] Foco visível, alvo ≥44 px (`.touch-target`) e semântica do trilho (`aria-current="step"` + legenda `sr-only` + `aria-hidden` na decoração) — cobertos por `JourneyRail.test.tsx` e `ProfilePage.test.tsx`
- [x] Nenhum hex cru em `className` (I6) — conferido por `grep` em `perfil/`

### Débito de contraste (herdado, não introduzido aqui)

`text-ceci-brand-strong` sobre `bg-surface-rose` é o idioma de "chip destacado" do
app inteiro, não uma escolha do perfil. Em `neon` e `amanhecer` o par não chega a
4.5:1 para texto pequeno. **Não foi corrigido aqui**: mexer em `ceci-brand-strong`
altera toda a paleta do app e é decisão da dona do produto, não da tela de perfil.

Reproduzir (número gerado, não copiado):

```bash
npx tsx -e "import {THEMES,contrastRatio} from './src/lib/themes'; for (const t of Object.values(THEMES)) console.log(t.id, contrastRatio(t.tokens['ceci-brand-strong'], t.tokens['surface-rose']).toFixed(2))"
```

Correção aplicada dentro do módulo do perfil: o texto do modal de importação
(`ProfileDataMaintenance.tsx:212`) usava `text-ceci-muted`, que dá 2.5–2.7:1 em 4
temas. Trocado por `text-ceci-secondary` (≥5.6:1 em todos os 6).

## F9 — Testes visuais e fechamento

- [ ] Screenshots: 375/390/768/1280; claro, escuro, tema alternativo, reduced motion — **bloqueado**: esta máquina não tem driver de navegador (`playwright`/`puppeteer` ausentes em `node_modules/.bin/`) nem display
- [ ] Screenshots de estado: vazio, completo, além-do-total, erro OTA/sync — mesmo bloqueio
- [x] `__tests__` afetados: `JourneyTimeline`/`JourneyTermCard`/`ThemePickerCard` antigos removidos ou adaptados; `ThemePickerCard.test.tsx` segue verde
- [x] Remover a flag de dev — nunca existiu (F0)
- [x] `check-boundaries` + `git diff --stat contracts/` vazio
- [x] Conferir U+FFFD e BOM nos arquivos tocados (skill `utf8-e-encoding`)
- [x] Índice `docs/specs/README.md` e status das specs atualizados

> **O que falta de fato é a inspeção visual.** O resto da F8 foi verificado por
> teste. As duas linhas de screenshot dependem de alguém rodar a tela num
> navegador real — em breakpoints de verdade, que o jsdom não simula.

## Gate final (Definition of Done)

- [x] `npm run lint` = 0
- [x] `npm run test` do perfil = 0 — 3 rodadas seguidas, estável (ver abaixo)
- [x] `node .github/scripts/check-boundaries.mjs` = 0
- [x] `npm run verify:contract` = 0
- [~] `npm run verify` = 0 — passa até `build:web` e **para em `bundle:report`** (ver "Gate de bundle")
- [x] `git diff --stat contracts/` vazio
- [x] Sem U+FFFD; sem BOM

### Gate de bundle (bloqueia o `verify`, fora do perfil)

```
[bundle-report] REGRESSÃO: entrada crítica cresceu 19% (antes 798903 B, agora 950816 B) — limite da spec §10 é +10%
```

O perfil **não** causa isso. A única alteração de código empacotado feita aqui foi
trocar uma classe CSS em `ProfileDataMaintenance.tsx` (`text-ceci-muted` →
`text-ceci-secondary`), que move bytes, não volume. O trabalho acumulado sem
commit na árvore explica a entrada crítica: `src/lib/performance/`,
`src/lib/db/writeQueue.ts`, `src/lib/sync/useBackgroundSyncTriggers.ts`,
`src/components/ui/BootSplash.tsx`, `src/lib/bootPreload.ts` e os shaders.

**Não rodei `npm run bundle:report -- --force`.** Aceitar o baseline aqui
apagaria uma regressão real de outra frente de trabalho e esconderia o problema
de quem está mexendo em performance. O gate continua vermelho até alguém
justificar a mudança ou reduzir a entrada crítica.

### Flakiness da suíte (pré-existente, fora do perfil)

Rodando a suíte completa em paralelo, o **conjunto de arquivos que falha muda a
cada rodada** — não é um arquivo quebrado e sim instabilidade sob concorrência:

| rodada | arquivos com falha |
|---|---|
| 1 | (nenhum) |
| 2 | `quizzes/QuizFlowHarness` (`window is not defined` no `setInterval` de `QuizPlayer.tsx:38`, pós-teardown) |
| 3 | `tcc/TccView` |
| 4 | `tcc/TccView`, `ui/ToggleRow`, `perfil/ProfileHero` |

Ou seja: o problema **não** é do perfil — na rodada 4 ele atingiu um teste do
perfil junto com dois de fora, e na rodada 1 a suíte inteira passou. Nenhum
arquivo instável importa `src/components/views/perfil/` ou
`src/lib/profileViewModel.ts`.

Contra-prova de que o perfil é estável: 3 rodadas seguidas só com o módulo do
perfil + view model + rota, todas verdes.

```bash
for i in 1 2 3; do npm run test -- src/components/views/perfil src/components/views/__tests__/PerfilView.test.tsx src/lib/__tests__/profileViewModel.test.ts; done
```

**Não corrigido aqui** — é dívida própria da suíte. O sintoma (`window is not
defined` depois do teardown) é timer de teste vazando do worker.