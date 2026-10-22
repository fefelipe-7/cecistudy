# Barra inferior contextual (Liquid Glass)

> Rodapé de ação das telas **auxiliares** (empilhadas) do cecistudy ♡. Documento de
> contexto, em pt-BR. Código: [`src/components/ui/ContextualBottomBar.tsx`](../../src/components/ui/ContextualBottomBar.tsx).
>
> **Regra que vale:** a spec é a fonte. [`SPEC-021`](../../docs/specs/SPEC-021-barra-contextual-duas-barras-scroll-fade.md)
> (o desenho) e [`SPEC-022`](../../docs/specs/SPEC-022-barra-contextual-acoes-da-tela-e-comportamento-estavel.md)
> (a correção: a ação do rodapé é a ação da tela, e o comportamento da peça).

## O que é

Barra fixa na base das telas auxiliares, com **duas peças** de vidro pura
(`liquid-glass-nav`), do mesmo tamanho, centralizadas:

```
[ ação principal (ícone + rótulo + setinha ↑) ]   [ voltar ← ]
```

- Tela **sem** ação principal: só a peça de "voltar", centralizada.
- A setinha ↑ aparece quando a tela tem **duas ou mais** ações contextuais e
  expande a peça para cima, mostrando as outras.
- A peça de "voltar" **sempre** navega de volta. Não reduz, não esconde.
- Ao rolar para **baixo**, as peças dão fade out e somem; ao rolar para
  **cima**, dão fade in e voltam. Sob `prefers-reduced-motion`, somem e voltam
  sem interpolação.
- **Nada** de pressionamento longo, nada de gesto de segurar.

Aparece só onde **não** existe barra de abas nem rodapé próprio. Quem decide é
`buildContextBarConfig` — a casca não tem `if` de rota.

## O que a barra oferece

**A ação que a própria tela oferece no mesmo contexto** — a mesma função, o
mesmo rótulo. A barra não abre fluxo que a tela não abre, e nunca abre a
entidade errada com o rótulo certo (a tabela por tela está na §5.3 da
SPEC-022).

A primária tem **um dono visível** (SPEC-022 D2):

| Tela | Dono da primária |
|---|---|
| TCC › visão geral | o **herói** ("registrar escrita") — a barra mostra só "voltar" |
| TCC › capítulos / leituras / orientação / escrita | a **barra** |
| Estágio (diário, pacientes, supervisão, caso do paciente) | a **barra** |
| Demais telas (notas, disciplina, revisão de flashcards, streak) | a **barra**, espelhando o botão do conteúdo |

## Comportamento

- **Invisível é inerte**: com o fade em 0, a barra não recebe toque e não é
  anunciada pelo leitor de tela.
- Trocar de tela reabre a barra **visível** (o estado do fade é derivado do
  contexto, sem `useEffect`).
- A entrada e a saída usam o mesmo envelope da barra de abas (`navBar`), então
  as duas peças de vidro nunca ficam sobrepostas na base.
- O **back do sistema** e o "voltar" fecham a **folha aberta** (as sheets do
  TCC) antes de sair da tela.
- Com o **teclado virtual** aberto, a barra sobe junto com o conteúdo
  (`visualViewport`) em vez de cobrir o campo focado.

## Onde cada coisa mora (uma regra, um lugar)

| Assunto | Dono |
|---|---|
| Quais ações existem em cada tela | [`src/lib/contextBarConfig.ts`](../../src/lib/contextBarConfig.ts) (função pura, irmã de `headerConfig.ts`) |
| Quais telas **não** recebem a barra | `BARRA_APARECE` no mesmo arquivo — o **compilador** cobra a cobertura de `kind` |
| Exposto no estado | `contextBarConfig` em `src/context/navigationEngine.ts` (memoizado como o header) |
| Desenho e gestos | [`src/components/ui/ContextualBottomBar.tsx`](../../src/components/ui/ContextualBottomBar.tsx) |
| O que a barra abre (folhas do TCC) | `tccSheet` no contexto do app (`src/context/navigationEngine.ts`) |
| Geometria (altura, gap, folga) | tokens `--contextual-bar-*` em `src/index.css` |
| Tempos | `BASE_D` em [`src/lib/motion/tokens.ts`](../../src/lib/motion/tokens.ts) |
| Material | `.liquid-glass-nav` / `.liquid-glass-pill` de `src/index.css` |

## Decisões

- **Liquid Glass reaproveitado, não reimplementado.** A cápsula usa
  `liquid-glass-nav` — o mesmo blur, borda e sombra-interna do header e da
  bottom-nav. Nenhum `backdrop-filter` novo.
- **Uma regra, um lugar.** A configuração é uma função pura; a casca só
  consome. A classificação de quais telas recebem a barra é um
  `Record<NavScreen['kind'], boolean>` — o compilador falha quando um `kind`
  novo não é classificado.
- **Botão dentro de botão não.** A peça da esquerda é um contêiner com dois
  botões irmãos (a ação e a setinha): HTML válido e setinha alcançável por
  teclado.
- **Movimento reduzido** zera a interpolação.

## Limites conhecidos

- Sem reprofilamento em dispositivo físico: tempos e curvas são os tokens
  iniciais, validados por teste funcional, não por medição de frame time.
- A folha do TCC mora no contexto do app: fechar a tela fecha a folha, e o
  back do sistema fecha a folha antes de sair (SPEC-022 D13).
- O **"voltar" que fecha uma folha** só vale para as folhas que moram no
  contexto (as do TCC); as sheets puramente locais (wizards, formulários) têm
  o próprio rodapé.
