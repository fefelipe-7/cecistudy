# Todo: redesign da tela de perfil (SPEC-013)

> Plano: [`./plan-perfil-redesign.md`](./plan-perfil-redesign.md)
> Spec: [`../docs/specs/SPEC-013-perfil-identidade-jornada-e-configuracoes.md`](../docs/specs/SPEC-013-perfil-identidade-jornada-e-configuracoes.md)

## F0 — Governança e blindagem

- [x] Registrar `SPEC-013` (app) e `SPEC-M-017` (grupo) no índice `docs/specs/README.md`
- [x] Criar a flag local de dev (perfil antigo × novo) e anotar a remoção em F9 — **não usada**: a composição nova entra direto (o perfil antigo morre no mesmo commit); a remoção anotada em F9 fica sem efeito
- [ ] Congelar baseline: `npm run verify` verde; `git diff --stat contracts/` vazio — **`contracts/` vazio** ✓ e `verify` termina em 0 ✓, **mas** o `bundle:report` falhou na primeira execução e se auto-curou na segunda (ver F9): o baseline do gate não é confiável, e há +19% de entrada crítica de outra origem nesta árvore
- [x] Registro de decisão: funil sai (D7); ofensiva vira conquista (D8)

## F1 — View model

- [x] `src/lib/profileViewModel.ts` com `deriveProfileViewModel` puro e memoizado
- [x] Reusar `degreeProgress`/`semestersLeft`/`clampOrdinal` (`termScope`), `formatStudyTime` (`profileMeta`), `totalXp`/`levelFor`/`generalTitle` (`levels`)
- [x] `profile.semester` só como fallback; nenhuma janela temporal
- [x] `src/lib/__tests__/profileViewModel.test.ts` com os 10 casos da spec (16 testes verdes)

## F2 — Identidade + edição

- [x] `perfil/ProfileHero.tsx` (eyebrow, avatar, nome `h1`, curso·universidade, frase, nível)
- [x] `perfil/ProfileAvatar.tsx` (foto/iniciais, câmera, remover)
- [x] `perfil/ProfileEditSheet.tsx` (`guardar perfil`, dirty state, erros por campo)
- [x] Remover o `<form>` de `PersonalizationSection.tsx:107-144` — o arquivo foi apagado na reescrita do `PerfilView`; a edição virou `ProfileEditSheet`
- [x] `perfil/__tests__/ProfileHero.test.tsx` + interação (salvar/fechar-dirty/foto) — 9 testes

## F3 — Jornada agora + trilho

- [x] `perfil/JourneyNow.tsx` (semestre, badge, %, CTA, `corrigir`, aviso além-do-total)
- [x] `perfil/JourneyRail.tsx` (passado/atual/futuro, texto, `aria-current`, até 12)
- [x] Remover a barra de progresso de `ProfileHeader` e a frase de `JourneyTimeline` — `ProfileHeader` e `JourneyTimeline` apagados; o progresso existe uma vez, em `JourneyNow` (garantido por teste)
- [x] `perfil/__tests__/JourneyRail.test.tsx` (1, 2, 8, 12 e ordinal > total) — 16 testes

## F4 — Ritmo + saída do funil

- [x] `perfil/ProgressPulse.tsx` (horas, páginas, tarefas feitas/total, provas)
- [x] `perfil/PulseMetric.tsx` (`button`/`a`, sem `div role=button`)
- [x] Remover `DitherFunnelChart` de `PerfilView.tsx:363-370` — fora da tela. O componente `src/components/ui/dither-funnel.tsx` **foi mantido** (D7 manda parar de renderizar, não apagar a biblioteca de gráficos) e ficou sem consumidor de produção: sobrou só o próprio teste em `src/components/ui/__tests__/dither-charts.test.tsx`. Decidir se ele vive ou sai é produto, não agente
- [x] `perfil/__tests__/ProgressPulse.test.tsx` + navegação por métrica — 4 testes

## F5 — Memória + conquistas

- [x] `perfil/JourneyHistory.tsx` (atual + 2 anteriores, por id, CTA histórico)
- [x] `perfil/AchievementsPreview.tsx` (nível/título, stickers, próximo objetivo, ofensiva)
- [x] Remover o CTA de virada duplicado de `JourneyTimeline.tsx:115-163` — o arquivo foi apagado; o CTA existe uma vez, em `JourneyNow` (I3 garantido por teste na página inteira)
- [x] Remover `StudyStatsWidget` como bloco próprio — `src/components/widgets/StudyStatsWidget.tsx` apagado; a ofensiva virou item em `AchievementsPreview`, que abre a tela por `openStreak` (D8)

## F6 — Preferências em rows

- [x] `perfil/ProfilePreferences.tsx` + `perfil/PreferenceRow.tsx`
- [x] Tema em sheet reaproveitando `ThemePickerCard`; lembrete e gcal com handlers atuais
- [x] `perfil/__tests__/PreferenceRow.test.tsx` + navegação por teclado (7 testes, `user-event`)

## F7 — Dados e manutenção

- [x] `perfil/ProfileDataMaintenance.tsx` + `DangerZone` (reset isolado, D6)
- [x] Reaproveitar `DataSection` (modais de reset/import/decrypt/export); sync em primeiro
- [x] OTA só no nativo (via `maintenance.native` do VM)
- [x] `perfil/__tests__/ProfileDataMaintenance.test.tsx` (6 testes, incluindo o reset na zona de cuidado)

## F8 — Responsivo, temas, motion e a11y

- [x] Grid 7/5 a partir de 900 px; container 1120 px em ≥1200 (`ProfilePage.tsx`)
- [x] Tokens só semânticos: nenhum hex cru nos 14 arquivos novos (I6)
- [x] `prefers-reduced-motion`: nenhum componente novo anima; as transições são de toque e caem no bloco global (`src/index.css:558-564`)
- [x] Foco visível: inputs com `focus:ring-2 focus:ring-ceci-brand/30` (convenção do app); botões mantêm o outline do browser
- [x] Alvo ≥44 px: `.touch-target` nas ações, inclusive os botões do avatar (o círculo visível tem 32 px, o `button` tem 44 px)
- [ ] Contraste nos 6 temas validado visualmente — **pendente**: sem navegador no ambiente (ver F9)
- [ ] Grid 7/5 conferido em 900/1200 px — **pendente**: idem

## F9 — Testes visuais e fechamento

- [ ] Screenshots: 375/390/768/1280; claro, escuro, tema alternativo, reduced motion — **não executável aqui**: o app não tem Playwright/Puppeteer, só `vitest` + `jsdom`
- [ ] Screenshots de estado: vazio, completo, além-do-total, erro OTA/sync — idem
- [x] Testes dos componentes removidos atualizados/removidos: `JourneyTermCard` e `JourneyTimeline` foram portados para `JourneyRail.test.tsx` (16 testes, incluindo escape, teto global, stepper do total e rascunho por id) e depois apagados junto com os componentes
- [x] Flag de dev: nunca existiu (a composição nova entrou direto); nada a remover em F9
- [x] `npm run verify` sai com 0 — typecheck, 1591 testes, fronteiras, contrato, `build:web`, `bundle:report` e `build:mobile` verdes. **Mas atenção ao `bundle:report`:** na **primeira** execução ele falhou com "entrada crítica cresceu 19% (798903 B → 950815 B, limite +10%)". A regressão **não é desta spec** — `PerfilView` é chunk lazy de 48 KB (`assets/PerfilView-*.js`), fora da entrada crítica, e o único importador de produção de `src/lib/profileViewModel.ts` e de `views/perfil/*` é ele mesmo, via `import()` em `src/shells/SharedScreenLayers.tsx:16`. O crescimento vem das outras mudanças **não commitadas** desta árvore (shaders 3D, dither, boot preload) contra um baseline gravado antes delas. E, pior: o gate **se auto-atualiza** — `scripts/bundle-report.mjs:118-167` compara com o relatório anterior e **reescreve** `artifacts/bundle-report.json` em toda execução, passando ou falhando; por isso a segunda execução ficou verde. "verify verde" aqui **não** significa "sem regressão de bundle". Dívida do script, não desta spec: tem de ser resolvida no to-do de performance
- [x] `git diff --stat contracts/` vazio
- [x] Conferido U+FFFD e BOM nos arquivos tocados
- [x] `docs/specs/SPEC-013` §10 atualizado com o resultado real; §8 registra que a entrega ficou sem motion de entrada
- [x] Índice `docs/specs/README.md` (grupo) com a linha `SPEC-M-017` já registrada

## Gate final (Definition of Done)

- [x] `npm run lint` = 0
- [x] `npm run test` = 0 (141 arquivos, 1591 testes)
- [x] `node .github/scripts/check-boundaries.mjs` = 0
- [x] `npm run verify` = 0 (verde) — **com a ressalva do `bundle:report`**: ele falhou na primeira execução (+19% na entrada crítica) e passou na segunda porque o script reescreve o próprio baseline; a regressão é alheia a esta spec (ver F9)
- [x] `git diff --stat contracts/` vazio
- [x] Sem U+FFFD; sem BOM
