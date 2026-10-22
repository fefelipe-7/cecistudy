# SPEC-021 · Barra contextual inferior: duas barras de vidro, scroll com fade

> Status: **superada parcialmente** (2026-10-19)
> App afetado: mobile
> Origem: spec-referencial-workspace-academico.md §3.2 (recorte do mobile) — **corrigido**: a §4.5 do referencial é "Biblioteca (compartilhada)", não a barra contextual; a spec referencial não descreve a barra (corrigir o referencial é da dona, ADR-005)
> Decisões: D1, D2, D3, D4, D5, D6 — **D5 superada** pela SPEC-022
> Supersede: SPEC-009 (barra contextual inferior anterior), D20 da camada clínica não toca esta spec
> Depende de: SPEC-007 (navegação por pilha de slide)
> Superada por: SPEC-022 (`docs/specs/SPEC-022-barra-contextual-acoes-da-tela-e-comportamento-estavel.md`) — **não implementar o fade (D5), o campo `secondaryActions` (§5) nem o caso de borda "múltiplas ações" (§7) a partir desta**; a reconciliação item a item mora na §12 da SPEC-022
> Data: 2026-10-19

---

## 1. Contexto

A barra contextual inferior atual (`ContextualBottomBar`) tem um desenho de três peças de vidro (botão ⋯ | ação principal | seta voltar), com comportamento de "segurar o botão para reduzir a barra" e um painel de ações que se recolhe. A usuária pediu que isso seja trocado por:

- Duas barras de vidro pura, do mesmo tamanho, centralizadas horizontalmente.
- Barra da esquerda: ação principal (ícone + rótulo), com uma setinha que expande essa barra para cima mostrando mais de uma ação quando a tela tiver mais de uma ação principal candidata.
- Barra da direita: texto "voltar" + seta, que sempre navega de volta (nunca reduz, nunca esconde).
- Nas telas sem ação principal, só existe a barra de "voltar", centralizada, no tamanho normal.
- As barras abrem junto com a tela (fixa), e ao rolar para baixo dão fade out curto até sumir; ao rolar para cima dão fade in curto e reaparecem.
- Nada de pressionamento longo, nada de gesto de segurar.

## 2. Decisões

### D1 · Duas barras de vidro pura, igual tamanho, centralizadas

- **Decisão.** A barra inferior passa a ter exatamente duas peças de `liquid-glass-nav` pura (sem a camada branca de pill), uma para a ação principal e outra para voltar. Ambas têm a mesma largura/altura e ficam centralizadas na base da tela (abaixo do conteúdo, acima da safe area).
- **Justificativa.** A usuária pediu "duas barras, com o liquidglass com a cor do tema, duas barras de igual tamanho, centralizadas". O `liquid-glass-nav` já existe em `src/index.css:489` e é a receita de vidro puro sem filtro SVG.
- **Alternativa rejeitada.** Manter as três peças atuais (⋯ | ação | seta) com larguras diferentes e o botão ⋯ como peça visual. Rejeitado porque a usuária quer exatamente duas peças, com o ⋯ deixando de existir como botão separado.
- **Consequência aceita.** O botão ⋯ some da interface; a ação principal passa a ser a peça da esquerda, e a seta de voltar fica na peça da direita. Telas sem ação principal mostram só a peça do voltar, centralizada.

### D2 · Barra da esquerda: ação principal com ícone + texto + setinha de expansão para cima

- **Decisão.** A peça da esquerda exibe o ícone e o rótulo da ação principal selecionada. Quando a tela tem mais de uma ação principal candidata, uma setinha (chevron para cima) na mesma peça expande a barra para cima, revelando as outras ações principais como itens de escolha. Selecionar outra ação troca o rótulo/ícone visível e fecha a expansão.
- **Justificativa.** A usuária pediu "uma setinha que vai expandir essa barra pra cima, mostrando mais de uma ação quando essa tela tiver mais de uma ação". Isso evita abrir um painel separado e mantém a ação principal sempre visível.
- **Alternativa rejeitada.** Usar o `ContextualActionMenu` existente (painel que desliza verticalmente com rádio + secundárias). Rejeitado porque a usuária quer a expansão "pra cima" dentro da própria barra, não um painel separado acima.
- **Consequência aceita.** O componente `ContextualActionMenu` deixa de ser usado por esta barra; a lógica de seleção de ação principal fica encapsulada na nova peça de vidro. Ações secundárias (ex.: favoritar, editar disciplina) deixam de aparecer nesta barra — se forem necessárias, vão para outro lugar (header ou sheet).

### D3 · Barra da direita: "voltar" + seta, sempre navega

- **Decisão.** A peça da direita exibe o texto "voltar" acompanhado de uma seta (ChevronLeft). Toque curto sempre chama `onBack()` (navegação real de volta na pilha). Nunca reduz, nunca esconde, nunca fecha expansão.
- **Justificativa.** A usuária pediu "uma barra de voltar com o nome 'voltar e o sinal de uma seta, que vai fazer voltar na navegação". O curto sempre navega remove a ambiguidade da versão anterior (primeiro toque reduz, segundo navega).
- **Alternativa rejeitada.** Manter o comportamento de dois toques (primeiro reduz a barra, segundo navega). Rejeitado porque cria incerteza: a usuária não sabe se o toque vai navegar ou apenas recolher.
- **Consequência aceita.** Não há mais estado expandido/compacto controlado pelo toque de voltar. A barra sempre aparece do mesmo jeito quando a tela é aberta.

### D4 · Telas sem ação principal mostram só a barra de voltar, centralizada

- **Decisão.** Quando a configuração da tela não tem ação principal (ex.: `#/estudos/historico`, `#/biblioteca/{item do templo}`), só a barra de "voltar" é renderizada, centralizada horizontalmente, no mesmo tamanho das duas barras.
- **Justificativa.** A usuária pediu "nas telas onde não existem ação principais, deve ter somente essa barra de 'voltar' para voltar na navegação, normalmente em tamanho, no centro".
- **Alternativa rejeitada.** Esconder completamente a barra nessas telas. Rejeitado porque o voltar continua sendo necessário para sair da tela auxiliar.
- **Consequência aceita.** A largura total ocupada na base da tela é a de uma única barra, centralizada.

### D5 · Fade out no scroll para baixo, fade in no scroll para cima

- **Decisão.** As barras são fixas na base da tela quando a tela é aberta. Ao rolar o conteúdo para baixo, elas dão fade out curto (opacidade 1 → 0) até sumir da tela. Ao rolar para cima, dão fade in curto (0 → 1) e reaparecem. O fade é curto (duração do token `contextBar` ou similar, sem interpolação sob movimento reduzido).
- **Justificativa.** A usuária pediu que as barras "abrem junto com a tela sempre fixa, e após a rolagem, devem ter um fade out curto até que sumam da tela. elas deem aparecer novamente quando for rolado para cima novamente, com um fade in curto".
- **Alternativa rejeitada.** Fixar as barras sempre visíveis (position sticky sem fade). Rejeitado porque a usuária quer que sumam no scroll para baixo.
- **Consequência aceita.** Precisa de um listener de scroll no conteúdo da tela (ou um IntersectionObserver/hook de scroll) que controle a opacidade das barras. Sob `prefers-reduced-motion`, o fade é substituído por aparição/sumição instantânea (sem interpolação).

### D6 · Nada de pressionamento longo, nada de gesto de segurar

- **Decisão.** O `usePressGesture` (limiar 500 ms, máquina de estados de pressionamento longo) é removido do fluxo desta barra. O toque na ação principal executa a ação imediatamente; o toque em voltar navega imediatamente; o toque na setinha expande/fecha imediatamente. Não há longo-press, não há supressão de click, não há haptic de longo-press.
- **Justificativa.** A usuária pediu explicitamente "não vai ter mais aquela coisa de segurar os botões, nem nada".
- **Alternativa rejeitada.** Manter `usePressGesture` apenas para o botão de voltar (long press = algo, curto = voltar). Rejeitado porque a usuária removeu qualquer noção de segurar.
- **Consequência aceita.** A invariante "um gesto físico produz no máximo um resultado" deixe de ser necessária nesta barra; o `usePressGesture` pode continuar existindo para outros usos, mas não é importado aqui.

## 3. Escopo

| Item | Tipo |
|---|---|
| Duas peças de vidro pura (`liquid-glass-nav`) na base da tela, igual tamanho, centralizadas | UI |
| Barra esquerda: ícone + rótulo da ação principal + setinha de expansão para cima | UI |
| Expansão para cima mostra as outras ações principais candidatas | UI |
| Barra direita: texto "voltar" + seta, toque sempre navega | UI |
| Telas sem ação principal: só a barra de voltar, centralizada | UI |
| Fade out no scroll para baixo, fade in no scroll para cima (curto) | UI + comportamento |
| Remoção de `usePressGesture` e de qualquer lógica de pressionamento longo desta barra | código |
| Mapeamento de ação principal por rota (lista fechada) | código (config) |
| Testes de componente para as duas barras, expansão, fade, rotas | teste |
| Gate de fronteiras (`check-boundaries.mjs`) continua passando | gate |

## 4. Fora de escopo

| Não entra | Motivo |
|---|---|
| Ações secundárias (favoritar, editar disciplina, etc.) nesta barra | A usuária pediu só ação principal + voltar. Secundárias, se precisarem, vão para outro lugar (header ou sheet). |
| Botão ⋯ como peça visual separada | Substituído pela ação principal na peça da esquerda. |
| Estado expandido/compacto controlado pelo toque de voltar | O voltar sempre navega; não há mais redução de barra por toque. |
| `ContextualActionMenu` usado por esta barra | Substituído pela expansão para cima dentro da própria peça da ação principal. |
| Long press / pressionamento longo / gesto de segurar | Removido pela decisão D6. |
| Qualquer mudança no `BottomNav` das abas primárias | Esta barra só existe em telas auxiliares empilhadas, não nas abas. |
| Telas com `FixedBottomBar` próprio (classNote, quiz-*, estudo/leituras) | Já têm rodapé próprio; esta barra não entra. |
| Overlays (compose, wizard, noteDetail, noteTransform) | Não entram na pilha de slide; não recebem esta barra. |
| Desktop (`cecistudy-desktop`) | Outro app, outro contrato de dados, regra de domínio em Rust. |

## 5. Contrato

- **Assinatura / formato:** `buildContextBarConfig(input): ContextBarConfig | null` continua sendo a função pura que decide se a barra aparece e qual ação principal mostrar. A nova interface de configuração passa a ter:
  - `primaryActions: ContextBarAction[]` — candidatas à ação principal (1ª = selecionada por padrão).
  - `secondaryActions` é ignorado por esta barra (pode continuar no tipo para compatibilidade, mas não é renderizado).
  - `contextKey: string` — identidade do contexto; troca de tela reinicia a seleção.
- **Invariante:** quando `config.primaryActions.length === 0`, só a barra de voltar é renderizada; quando `> 0`, as duas barras são renderizadas.
- **Quem consome:** `MobileAppShell` (`src/shells/MobileAppShell.tsx:356`), que passa `nav.contextBarConfig` e `onBack`.

## 6. Invariantes

| # | Invariante | Onde é garantida | Teste |
|---|---|---|---|
| I1 | A barra não aparece em tela primária (`kind === 'tab'`), wizard, compose, overlays, nem em tela com `FixedBottomBar` próprio | `src/lib/contextBarConfig.ts:101-108` | `src/lib/__tests__/contextBarConfig.test.ts` |
| I2 | Quando há ação principal, exatamente duas barras de vidro são renderizadas; quando não há, exatamente uma (voltar) | `src/components/ui/ContextualBottomBar.tsx` | `src/components/ui/__tests__/ContextualBottomBar.test.tsx` |
| I3 | O toque na barra de voltar sempre chama `onBack()` (nunca reduz/esconde) | `src/components/ui/ContextualBottomBar.tsx` | `src/components/ui/__tests__/ContextualBottomBar.test.tsx` |
| I4 | O toque na ação principal executa a ação imediatamente (sem longo-press) | `src/components/ui/ContextualBottomBar.tsx` | `src/components/ui/__tests__/ContextualBottomBar.test.tsx` |
| I5 | Sob `prefers-reduced-motion`, o fade é instantâneo (sem interpolação) | `src/components/ui/ContextualBottomBar.tsx` | `src/components/ui/__tests__/ContextualBottomBar.test.tsx` |

## 7. Casos de borda

| Entrada | Comportamento |
|---|---|
| Tela sem ação principal (ex.: `#/estudos/historico`) | Só a barra de voltar, centralizada, aparece. |
| Tela com uma só ação principal (ex.: `#/biblioteca/notas` → "nova nota") | Duas barras: ação principal + voltar. A setinha de expansão não aparece (não há mais ações). |
| Tela com múltiplas ações principais (ex.: `#/faculdade/c3` → "anotar aula", "nova prova") | Duas barras; a esquerda mostra a selecionada; a setinha expande para cima mostrando as outras. |
| Scroll para baixo rápido | Fade out curto; as barras somem. |
| Scroll para cima depois de sumir | Fade in curto; as barras reaparecem. |
| `prefers-reduced-motion` ativo | Aparecem/sumem instantaneamente, sem interpolação. |
| Troca de contexto (nova tela) | A seleção da ação principal reinicia para a 1ª candidata; as barras abrem do jeito padrão (visíveis). |
| `config === null` (tela primária) | Nada é renderizado. |

## 8. Critérios de aceite

- [ ] `npm run lint` sai com 0
- [ ] `npm run test` sai com 0 (incluindo os testes atualizados de `ContextualBottomBar`)
- [ ] `node .github/scripts/check-boundaries.mjs` sai com 0
- [ ] Renderizar a barra com `config` contendo 2 ações principais mostra exatamente 2 peças de vidro (teste de componente)
- [ ] Renderizar com `primaryActions: []` mostra exatamente 1 peça de vidro (voltar) (teste de componente)
- [ ] Clicar na peça de voltar chama `onBack()` exatamente 1 vez (teste de componente)
- [ ] Clicar na ação principal executa `onSelect` exatamente 1 vez (teste de componente)
- [ ] Sob `prefers-reduced-motion`, não há animação de fade (teste de componente com `MotionProfileProvider override=true`)

## 9. Medição

| Métrica | Como medir | Antes | Depois | Gate |
|---|---|---|---|---|
| Testes da barra contextual passando | `npm run test -- src/components/ui/__tests__/ContextualBottomBar.test.tsx` | 18 testes (layout antigo) | N testes (duas barras, fade, rotas) | `npm run test` |
| Linhas de código do componente | `wc -l src/components/ui/ContextualBottomBar.tsx` | ~300 | menor (sem `usePressGesture`, sem `ContextualActionMenu`, sem sliding glass) | — |

## 10. Riscos

| Risco | Probabilidade | Impacto | Plano B |
|---|---|---|---|
| O hook de scroll/fade conflitar com o scroll nativo do iOS/Android webview | média | alta | Usar `IntersectionObserver` sobre um sentinela no conteúdo, ou scroll apenas via CSS `scroll-driven animation` quando suportado, com fallback JS. |
| A expansão para cima colidir com o teclado virtual (mobile nativo) | baixa | média | A expansão acontece acima da barra; se o teclado estiver aberto, a barra sobe com o viewport (comportamento nativo do webview). |
| Esquecer de remover `usePressGesture` e deixar código morto | baixa | baixa | O `check-boundaries.mjs` e o lint pegam importações não usadas; remover a importação na implementação. |

## 11. Rastreabilidade

| Decisão | Onde no código | Teste | Gate |
|---|---|---|---|
| D1 | `src/components/ui/ContextualBottomBar.tsx` + `src/index.css:489` | `ContextualBottomBar.test.tsx` | `npm run lint` + `npm run test` |
| D2 | `src/components/ui/ContextualBottomBar.tsx` (peça da esquerda + expansão) | `ContextualBottomBar.test.tsx` | `npm run test` |
| D3 | `src/components/ui/ContextualBottomBar.tsx` (peça da direita + `onBack`) | `ContextualBottomBar.test.tsx` | `npm run test` |
| D4 | `src/lib/contextBarConfig.ts` (`primaryActions: []` → só voltar) | `contextBarConfig.test.ts` | `npm run test` |
| D5 | `src/components/ui/ContextualBottomBar.tsx` (hook de scroll/fade) | `ContextualBottomBar.test.tsx` (reduced motion) | `npm run test` |
| D6 | Remoção de `usePressGesture` do componente | — | `npm run lint` (sem import não usado) |

**Espelho no outro app:** não se aplica — esta regra é só do mobile (barra inferior contextual). O desktop não tem esta barra (regra de domínio do desktop fica em Rust; UI de rodapé é outra decisão).

## 12. Reconciliação

| Item da SPEC-009 (barra contextual anterior) | Estado | Onde |
|---|---|---|
| Três peças (⋯ | ação | seta) | descartado | D1 |
| Botão ⋯ como peça visual sem ação | descartado | D1 |
| Toque de voltar reduz a barra (primeiro toque) | descartado | D3 |
| Estado expandido/compacto | descartado | D3 |
| `ContextualActionMenu` como painel de ações | absorvido por expansão para cima da peça da esquerda | D2 |
| `usePressGesture` / longo-press / supressão de click | descartado | D6 |
| Fade out/in no scroll | novo | D5 |
| Duas barras igual tamanho centralizadas | novo | D1 |

A spec antiga (`ContextualBottomBar` com três peças e longo-press) aponta para esta e não deve ser implementada a partir dela.
