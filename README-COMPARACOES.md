# cecistudy — Comparações

Esta versão inclui a seção **Comparações** do Templo de Conhecimento, com lista, busca, filtros, deep-link para detalhes, artigo-modelo visual e integração com os loaders web e SQLite.

## Executar localmente

Requisitos: Node.js 22 ou superior e npm.

```bash
npm install
npm run content:check
npm run content:build
npm run db:verify
npm run dev
```

Depois, abra `http://localhost:3000/#/biblioteca/templo/comparacoes`.

Na primeira abertura, conclua o onboarding local. Para abrir diretamente o artigo-modelo, use:

```text
http://localhost:3000/#/biblioteca/templo/comparacoes/psicanalise-terapia-cognitiva-beck
```

## Verificações

```bash
npm run lint
npm run test
npm run build
```

O pacote não inclui `node_modules`, `dist`, caches ou logs temporários. As dependências são instaladas pelo `npm install` a partir do `package-lock.json`.
