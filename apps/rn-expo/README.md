# cecistudy ♡ — laboratório React Native + Expo

Laboratório visual da migração do cecistudy mobile para **React Native + Expo**.
Onboarding e as cinco telas principais, com aparência fiel e dados realistas.
**Sem regra de negócio, sem persistência, sem escrita** — é um mock que se pode
sentir na mão.

A decisão que rege tudo está em
[`docs/specs/SPEC-015-lab-react-native-expo.md`](../../docs/specs/SPEC-015-lab-react-native-expo.md).
Leia a D1 antes de mexer em token, e a D9 antes de "só rapidinho" ligar o
`packages/domain`.

## Rodar

```bash
cd apps/rn-expo
npm install
npm start          # abre o Metro; leia o QR com Expo Go
```

Atalhos: `npm run android`, `npm run ios`, `npm run web`.

**Pré-visualização sem aparelho:** `npm run web` sobe no navegador (precisa do
`@expo/metro-runtime`, já instalado). É o teste mais barato para iterar
visual — o aparelho via Expo Go continua sendo a referência para haptics,
blur e teclado.

> **Requer um_registry próprio.** Este projeto **não** faz parte do grafo de
> workspaces da raiz (ver D2): ele tem `node_modules` e `package-lock.json`
> próprios. Um `npm install` na raiz **não** o toca — e ele **não** troca o
> React do app que está no ar.

## Verificar

```bash
npm run verify        # tsc --noEmit + gate de drift de token + gate de classes
npm run check:tokens  # só o gate de token: confere a ponte com src/index.css
npm run check:classes # só o gate de classes: toda className usada compila
npm run typecheck
```

O **`check:classes`** existe por causa de uma aula paga nesta fase: classe que
o Tailwind não conhece não é erro de build — é silêncio. `bg-surface-default`
e `border-border-default` não compilavam (a chave `DEFAULT` mapeia para a
classe base) e dois botões renderizavam transparentes. O gate extrai todo
className de `src/**`, compila pelo próprio Tailwind e lista o que não
produz nada.

`npm run verify` **não** faz parte do `npm run verify` da raiz. Isso é
deliberado (D2): o laboratório não pode ser o vetor de uma mudança no app de
produção. Quando a fase virar produto, a decisão de entrar no gate é da Fase 3.

## O que dá para fazer aqui

| Tela | Estado | O que este mock está avaliando |
|---|---|---|
| Onboarding (6 passos) | completo, navegável | progressão com mola, foco de teclado, alternância por passo |
| home | preenchida | ordem da hierarquia, o que compete pelo primeiro olhar |
| faculdade | 3 abas (disciplinas / calendário / estágio) | densidade: é a tela mais cheia do app |
| estudos | preenchida | actions "pra agora" vs. "depois" |
| biblioteca | preenchida | capa de livro como dado; é a tela sem hero |
| perfil | tela cheia, fora da barra | quatro atos: eu sou / estou / construí / cuido |

## Como o código está organizado

```
src/
  App.tsx              raiz: fontes, gate do onboarding, shell
  tokens/
    palette.js         a ponte com src/index.css — JS puro, porque o Tailwind
                       carrega em Node (D1)
    index.ts           a superfície TypeScript da ponte
  components/
    Aurora.tsx         o fundo com luz atrás — círculos concêntricos, sem blur
    HeroCard.tsx       HeroCard + Card + SectionTitle
    Section.tsx        bloco com entrada escalonada
    Tappable.tsx       o único botão: escala + haptic
    Button.tsx         uma ação primária por tela (D11)
    PillGroup.tsx      Pill / PillGroup / Tag
    Feedback.tsx       EmptyState, ProgressBar, StatusChip, MetricTile,
                       WeekRhythm, DashedDivider, AvatarTile
    Mascote.tsx        os 24 mascototes
  lib/
    motion.ts          curvas, molas, e o porte de `prefers-reduced-motion` (D7)
    haptics.ts         haptic marca decisão, não movimento (D8)
  shell/
    AppShell.tsx       uma tela montada por vez (D4)
    HeaderNav.tsx      vidro fixo
    BottomNav.tsx      vidro + pílula que desliza entre as abas (D5)
  mocks/index.ts       um semestre real de Psicologia clínica (D3)
scripts/
  tokens-sync.mjs      o gate da D1
  classes-check.mjs    o gate da D13
  tokens-drift.json    divergências declaradas, com motivo
```

Na raiz do laboratório: `metro.config.js` (**o** arquivo do pipeline de CSS),
`babel.config.js`, `tailwind.config.js`, `global.css`.

## Três regras que não se negociam

1. **Nenhum hex cru em componente.** Cor vem de token. A única exceção é a
   capa do livro e a cor da disciplina — que são **dado**, não tema.
2. **`shadow` sempre acompanhado de `elevation`.** Sem isso o card fica
   perfeito no iOS e invisivelmente plano no Android (D6).
3. **Toda animação respeita o movimento reduzido.** `useReducedMotion()` é
   consultado em `useEnter`, `useSpringValue` e `Tappable` — sem exceção (D7).

## O que este laboratório não é

Não é uma base pronta para virar produto. Não tem `SCHEMA_VERSION`, não tem
migração, não tem teste, e **as frases de voz estão escritas direto no
componente** — o que violaria a regra 4 do `check-boundaries.mjs` se o gate
varresse este diretório. Ele não varre (D2). Isso é dívida temporária e
declarada na SPEC-015 §Contrato: quando a fase virar produto, as frases voltam
para `src/lib/voice.ts`.