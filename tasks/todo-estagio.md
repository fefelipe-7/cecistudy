## Fase 5 — Atualizar `InternshipWizard.tsx`
- [x] **5.1** Remover passo `cycleStep` e states `phase`/`prepChecklist`
- [x] **5.2** Remover fallback de reflexão fake
- [x] **5.3** Adicionar passo de vínculo `discussedLogIds` com seleção de atendimentos clínicos
- [x] **5.4** Atualizar `buildLog()` com campos novos (`discussedLogIds`, `beforeNotes`, `afterNotes`, `selfAssessment`, `nextSteps` array) e remover fase/prepChecklist
- [x] **5.5** Atualizar passo de revisão com linha "atendimentos discutidos"
- [x] **5.6** Efeito colateral ao salvar supervisão/intervisão: sincronizar `supervisionLogId` nos logs discutidos
- [x] **5.7** Atualizar `InternshipDraft` e persistência do draft
- [x] **5.8** Pré-preenchimento do `patient` ao abrir do detalhe de um paciente (via draft)
  Verify: `npm run lint` ✓ `npm run test` ✓

## Fase 6 — Atualizar `InternshipDiaryView.tsx`
- [x] **6.1** Remover barra decorativa do ciclo e filtro por fase
- [x] **6.2** Adicionar bloco de pendências (reflexões em aberto + supervisões pendentes) usando `deriveCases`
- [x] **6.3** Atualizar cards de resumo (mantidos) e lista mostra todos os logs sem filtro de fase
  Verify: `npm run lint` ✓ `npm run test` ✓

## Fase 7 — Aba "por paciente"
- [x] **7.1** Criar `InternshipCaseCard.tsx`
- [x] **7.2** Criar `InternshipCaseDetail.tsx` (modal bottom sheet)
- [x] **7.3** Integrar na `InternshipDiaryView` (nova sub-aba "pacientes")
  Verify: `npm run lint` ✓ `npm run test` ✓

## Fase 8 — Atualizar `PerfilView.tsx` e `FaculdadeView.tsx`
- [x] **8.1** Substituir `internshipLogsLegacy` por `internshipLogs` (já feito nas fases anteriores)
- [x] **8.2** Usar `deriveCases` para aba "por paciente" (feito na Fase 7)
- [x] **8.3** Atualizar cards de resumo com métricas derivadas: adicionado tile "pacientes atendidos" no PerfilView com contagem de casos derivados
  Verify: `npm run lint` ✓ `npm run test` ✓

## Fase 9 — Polimento e verificação final
- [x] **9.1** Garantir que todas as telas funcionam com o novo modelo — `npm run lint` ✓ `npm run test` ✓
- [x] **9.2** Revisar acessibilidade e copy — verificação visual nos componentes novos (cards, modal, tiles) sem regressões
- [x] **9.3** Limpar comentários de migração e tipos obsoletos — `SupervisionNotebook` mantido apenas para compatibilidade de backup (documentado), alias `InternshipLogLegacy` removido
  Verify: `npm run lint` ✓ `npm run test` ✓