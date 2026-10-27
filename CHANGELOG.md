# Changelog

O que mudou em cada versão, contado em português e para gente. Sem hash de
commit, sem jargão de máquina.

Até a 1.0.98 o projeto não mantinha changelog: o histórico ficava só nos
releases do GitHub. Deste ponto em diante o `release-please` cuida da versão e
do tag, e este arquivo é escrito à mão — por isso ele está no `skip-changelog`
do `release-please-config.json` e nenhuma automação reescreve o texto abaixo.

## 1.1.1 — 2026-10-27 (em desenvolvimento)

Movimento em todo o app: o card vira a tela (container transform) ao abrir
disciplina, família, abordagem, Templo, grupo de quiz, caso de estágio, capítulo
do TCC, artigo/livro e evento do calendário — com camada de clone que não exige
a origem montada. Toda lista se revela ao ser lida, a Home abre com uma
coreografia curta na primeira montagem, overlays entram na pilha (Esc/back fecha
só o topo), o QuizExplanation vira bottom sheet, menus viram popover, o toast
fica acima do modal, o háptico toca ao concluir, o BootSplash sai com fade e o
perfil de movimento reduzido mata as transições CSS. Build e bundle sem
regressão.

### Container transform (card → tela)

- Camada de clone `MorphSource`/`MorphTarget`/`MorphLayer` em `src/lib/motion/`,
  substituindo o `SharedElement` que exigia a origem montada.
- Dez pares de card → detalhe usam o mesmo helper dos dois lados: nota, disciplina,
  família, abordagem, Templo (×4), quiz, caso de estágio, capítulo do TCC,
  artigo/livro e calendário. A linha do calendário abre nove destinos; só o hero
  da disciplina tem alvo (`morphIdForEntry`).
- Morph de 320 ms; push sem alvo usa o retângulo da tela; origem ausente vira
  crossfade; clique em elemento interativo interno cancela o morph.

### Listas e Home

- `Reveal` com `index` em todas as listas (até 6 itens com stagger, capado).
- Home: hero e lista de atenção entram uma só vez, na primeira montagem da aba
  (estado, não `useRef`); nas voltas nada acima da dobra anima.

### Overlays e pilha

- `overlayStack` ganha `kind` ('modal' | 'popover' | 'fullscreen'); `inert` e
  trava de scroll só para `modal`.
- `Esc` fecha o topo de qualquer superfície (handler global); `handleSystemBack`
  fecha o menu antes de sair da tela.
- `QuizExplanationOverlay` vira `Modal position="bottom"`.
- `CourseCreateMenu`, `HeaderActionMenu` e `floating-action-menu` viram popover
  na pilha, sem `Esc` próprio.

### Micro, reduzido e háptico

- `[data-motion='reduced']` mata transições de `press-card`, `card-lift` e
  `tap-interactive` quando o perfil está reduzido.
- `BASE_D.micro` migrou para `profile.d.micro` (10 leituras); `press-btn` órfão
  removido.
- `hapticTap` no `CompletionToggle` (todos os toggles de concluir).
- `BootSplash` sai com fade na duração do token `BASE_D.overlay`.

### Qualidade

- `verify:fast` verde: 171 arquivos, 1763 testes, boundaries OK, voz OK,
  contrato OK (SCHEMA_VERSION=22).
- `build:web` + `bundle:report` sem regressão (§10).
- Zero U+FFFD nos arquivos tocados.

## 1.0.99 — 2026-10-24

A maior parte desta versão não aparece na tela. O app ganhou notificações de
verdade e lembretes que se ajustam; por baixo, o projeto passou a ter branches,
CI por camada e publicação automática — que é o que permite publicar de novo
sem susto.

### Notificações

- Existe uma central de notificações com categorias: aula, prova, tarefa, TCC,
  estágio e resumo. Cada categoria liga e desliga nas preferências do perfil, e
  o que está desligado não vira notificação.
- Tocar na notificação abre a tela certa em vez de só abrir o app: o TCC abre na
  aba certa, o calendário abre no dia do compromisso, o estágio abre o diário, e
  o resto cai na aba correspondente. Notificação com destino desconhecido
  simplesmente não navega — não quebra.
- O TCC ganhou lembretes configuráveis por chips: quantos dias antes de um
  marco, quantos minutos antes de uma orientação. Não existe campo livre, então
  não existe valor inválido; a lista vazia é uma escolha válida e desliga aquele
  aviso.
- A decisão de "o que lembrar e quando" saiu da tela e virou regra pura em
  `packages/domain`, com teste próprio. O lembrete antigo do TCC continua
  funcionando, e o estado salvo por ele é lido sem migração.

### Calendário e TCC

- Adicionar tarefa, prova ou orientação a partir de um dia do calendário agora
  nasce naquele dia, em vez de sempre "hoje".
- Os wizards de tarefa/prova e de TCC passaram a levar a data escolhida adiante,
  e a tela de TCC para de duplicar o estado que o wizard já guarda.

### Testes que provam algo

- Entrou um padrão escrito de classificação e corte (`docs/estandares-testes.md`):
  todo teste declara a classe e o que protege que outro gate não protege.
  Teste que só garante que a tela desenha, duplicata de gate e stub de compat
  saem.
- Os scripts separam as camadas: `test:domain` no ciclo de edição, `test:ui` e
  `test:apps` no PR, `test:ci` dentro do `verify:fast`. Rodar tudo a cada
  edição era o que deixava a máquina lenta e a suíte instável.

### Repositório e publicação

- O repositório tem três branches com papel claro: `dev` recebe trabalho novo,
  `staging` roda o gate completo antes, `main` é a de release. As três têm regra
  que recusa push direto; promoção é por pull request, e a origem do PR é
  validada por workflow.
- O CI roda por camada e publica um único status (`ci-ok`), que é o check
  obrigatório — refatorar job não muda o nome que protege a branch.
- A versão, o `CHANGELOG.md` e o tag saem do `release-please`; o `release.yml`
  monta APK, IPA e o pacote de atualização OTA a partir do release publicado, e
  recusa tag fora do padrão `vX.Y.Z` para não gerar bundle com versão inválida.
- Licença PolyForm Noncommercial, README, guia de contribuição, política de
  segurança, CODEOWNERS, Dependabot e as verificações de segurança do GitHub
  ativos (secret scanning, push protection, CodeQL).
- Formatação padronizada com Biome, com os fixtures de contrato e os dados do
  templo fora do formatador — eles precisam ficar byte a byte como estão.

### Correções

- O timer de 150 ms do efeito de varredura do interruptor continuava vivo depois
  do componente sair da tela e chamava `setState` num ambiente já destruído.
  Agora o timer é cancelado ao desmontar.
