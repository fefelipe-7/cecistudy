# Correção da Home após navegação

## Problema corrigido

Ao trocar da Home para outra tela e retornar, camadas antigas do `SlideScreen` permaneciam no DOM com `opacity: 0`. Em determinados ciclos de navegação, a nova Home também ficava invisível, apesar de o conteúdo continuar montado.

## Correção aplicada

`src/shells/SlideScreen.tsx` agora usa `safeToRemove()` no fim da animação de saída, liberando corretamente as camadas antigas para o `AnimatePresence`. Além disso, `src/context/AppContext.tsx` gera uma revisão nova para cada alteração da pilha de navegação e inclui a tela de comparação nas chaves de slide, evitando colisões de identidade visual.

## Como executar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/`. Para validar o bug, entre na Home, clique em **Biblioteca** ou **Estudos**, volte para **Home** e aguarde a transição terminar. A Home deve continuar mostrando a saudação, os cards, o ritmo e as ações.

## Verificações executadas

```bash
npm run lint
npm run test
npm run build
```

Resultado: typecheck aprovado, 55 arquivos de teste aprovados e 473 testes aprovados. O build de produção também foi concluído com sucesso.
