# Plano: redesign da tela de perfil — identidade, jornada e configurações (SPEC-013)

> Spec-fonte: [`../docs/specs/SPEC-013-perfil-identidade-jornada-e-configuracoes.md`](../docs/specs/SPEC-013-perfil-identidade-jornada-e-configuracoes.md)
> Cópia de grupo: [`../../docs/specs/mobile/SPEC-M-017-perfil-identidade-jornada-e-configuracoes.md`](../../docs/specs/mobile/SPEC-M-017-perfil-identidade-jornada-e-configuracoes.md)
> Tasks: [`./todo-perfil-redesign.md`](./todo-perfil-redesign.md)
> **Escopo: só o mobile (React/TS).** Nenhum crate Rust tocado, `SCHEMA_VERSION` fica como está em
> `packages/data/src/schema.ts`, `contracts/` intocado, nenhum golden regerado.

## Objetivo em uma frase

Transformar a tela de perfil de uma pilha de 11 cartões com progresso repetido e
edição de identidade no fim da página em uma narrativa de quatro movimentos
(identidade → semestre → o que foi construído → cuidado do espaço), com uma
única derivação memoizada e uma única assinatura visual — o trilho da formação.

## Causa de raiz em uma frase

A composição atual segue a ordem de chegada dos componentes
(`src/components/views/PerfilView.tsx:342-415`), não a pergunta de quem abre a
aba, e por isso o progresso aparece **três vezes** (`ProfileHeader.tsx:64-76`,
`JourneyTermCard.tsx:150-155`, `JourneyTimeline.tsx:66-69`), o CTA de virada
**duas vezes** (`JourneyTermCard.tsx:204-213`, `JourneyTimeline.tsx:115-163`) e a
edição de nome/universidade/frase mora no fim (`PersonalizationSection.tsx:107-144`).

## Ordem das fases e por quê nesta ordem

| fase | o quê | por que aqui | tamanho |
|---|---|---|---|
| **F0** | Governança e blindagem | registra a spec e congela o comportamento a preservar antes de tocar UI | **S** |
| **F1** | View model (`profileViewModel`) | toda UI nova depende dele; é puro e testável sem render | **M** |
| **F2** | Identidade + edição (`ProfileHero`, `ProfileEditSheet`) | o topo da narrativa; independente do resto | **L** |
| **F3** | Jornada agora + trilho (`JourneyNow`, `JourneyRail`) | concentra o semestre e o progresso; depende de F1 | **L** |
| **F4** | Ritmo (`ProgressPulse`) + saída do funil | substitui o grid de 11 tiles e remove o gráfico | **M** |
| **F5** | Memória + conquistas (`JourneyHistory`, `AchievementsPreview`) | remove o CTA duplicado e absorve a ofensiva | **M** |
| **F6** | Preferências em rows (`ProfilePreferences`, `PreferenceRow`) | agrupa o que hoje é cartão; reaproveita `ThemePickerCard` | **M** |
| **F7** | Dados e manutenção (`ProfileDataMaintenance`, `DangerZone`) | reaproveita `DataSection`; isola reset | **M** |
| **F8** | Responsivo, temas, motion e a11y | exige F2–F7 prontos para compor o grid 7/5 | **L** |
| **F9** | Testes visuais e fechamento | screenshots e reconciliação de docs | **M** |

**F2, F3, F4 são independentes entre si** (cada um tem o seu bloco e o seu teste).
**F5 depende de F3** (compartilha o período por id). **F8 nunca se mistura com
F2–F7**: é a única fase que muda layout por breakpoint.

## Decisões que atravessam as fases

| id | decisão | onde nasce | spec |
|---|---|---|---|
| D1 | Ordem narrativa: identidade → agora → construído → cuidado | F2–F7 (composição) | SPEC-013 D1 |
| D2 | View model puro e memoizado em `src/lib/profileViewModel.ts` | F1 | SPEC-013 D2 |
| D3 | Grid de 11 métricas → `ProgressPulse` de 4 | F4 | SPEC-013 D3 |
| D4 | Trilho contínuo como assinatura visual | F3 | SPEC-013 D4 |
| D5 | Edição de identidade em sheet | F2 | SPEC-013 D5 |
| D6 | Preferências e manutenção em rows | F6, F7 | SPEC-013 D6 |
| D7 | Funil dither sai do perfil | F4 | SPEC-013 D7 |
| D8 | Ofensiva vira item de conquistas | F5 | SPEC-013 D8 |
| D9 | Sem domínio/schema/persistência novos | F1 (mantém-se em todas) | SPEC-013 D9 |
| D10 | Duas colunas a partir de 900 px | F8 | SPEC-013 D10 |
| D11 | Acessibilidade na definição de pronto | F2–F8 | SPEC-013 D11 |
| D12 | `PerfilView` mantém `mode` e os handlers | F0 (mantém-se em todas) | SPEC-013 D12 |

## Mapa módulo → arquivo → teste → gate

| Módulo | Arquivos | Teste | Gate |
|---|---|---|---|
| view model | `src/lib/profileViewModel.ts` | `src/lib/__tests__/profileViewModel.test.ts` | `npm run test` |
| casca/composição | `src/components/views/PerfilView.tsx`, `perfil/ProfilePage.tsx` | teste de rota (`mode`) | `npm run test` |
| identidade | `perfil/ProfileHero.tsx`, `perfil/ProfileAvatar.tsx`, `perfil/ProfileEditSheet.tsx` | `perfil/__tests__/ProfileHero.test.tsx` | `npm run test` |
| jornada | `perfil/JourneyNow.tsx`, `perfil/JourneyRail.tsx` | `perfil/__tests__/JourneyRail.test.tsx` | `npm run test` |
| ritmo | `perfil/ProgressPulse.tsx`, `perfil/PulseMetric.tsx` | `perfil/__tests__/ProgressPulse.test.tsx` | `npm run test` |
| memória | `perfil/JourneyHistory.tsx` | teste de composição | `npm run test` |
| conquistas | `perfil/AchievementsPreview.tsx` | teste de composição | `npm run test` |
| preferências | `perfil/ProfilePreferences.tsx`, `perfil/PreferenceRow.tsx` | `perfil/__tests__/PreferenceRow.test.tsx` | `npm run test` |
| dados | `perfil/ProfileDataMaintenance.tsx` | teste de interação | `npm run test` |

## Componentes atuais: destino

| Atual | Destino |
|---|---|
| `ProfileHeader` | substituído por `ProfileHero` + `ProfileAvatar` |
| `JourneySummary` | substituído por `ProgressPulse` |
| `PersonalizationSection` | dividido em `ProfileHero` (edição) + `ProfilePreferences` |
| `DataSection` | reestruturado em `ProfileDataMaintenance` + `DangerZone` (modais reaproveitados) |
| `JourneyTermCard` | reestruturado em `JourneyNow` |
| `JourneyTimeline` | reestruturado em `JourneyHistory` |
| `StickersSection` | reestruturado em `AchievementsPreview` |
| `ThemePickerCard` | reaproveitado dentro de sheet |
| `DitherFunnelChart` | removido da tela |
| `StudyStatsWidget` | removido como bloco; vira item em `AchievementsPreview` |

## Verificação (rodar depois de cada fase, não só no fim)

```bash
npm run lint                                # tsc --noEmit
npm run test                                # vitest (gate do mobile)
node .github/scripts/check-boundaries.mjs   # packages/* não toca react/capacitor
npm run build                               # vite build
npm run verify                              # gate único (typecheck + test:ci + boundary + builds)
```

`git diff --stat contracts/` tem que estar **vazio** ao final de cada fase — prova
de que nenhum golden foi tocado. Depois de escrever arquivos, conferir U+FFFD e
BOM (skill `utf8-e-encoding`).

## Riscos

- **F2–F7 são churn de UI**: cada uma mexe em um bloco isolado; gate verde entre
  elas, e o perfil antigo disponível por flag local durante o desenvolvimento.
- **Repetição de progresso/CTA** é regressão fácil de reintroduzir: I2/I3 da spec
  viram teste, não só revisão.
- **View model virando domínio**: qualquer cálculo novo precisa reusar
  `termScope`/`profileMeta`/`levels`; nada de filtro temporal ("recentes").
- **Branch de plataforma**: `isMobile`/`Capacitor.isNativePlatform` no componente
  quebra `check-boundaries.mjs:131-140`; o `native` do VM mora em `src/lib`.
- **Sheets com teclado/safe area**: validar em breakpoint real (375 e 390).
