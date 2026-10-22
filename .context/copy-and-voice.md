# Voz e Tom (Copy)

> Convenções de texto do cecistudy. Toda a UI é em **português do Brasil** (pt-BR).
>
> **O dono da voz é o código:** `src/lib/voice.ts` (`SPEC-M-018` / `SPEC-C-014`).
> Este documento explica o **porquê**; a **frase** mora lá, e o gate
> (`node .github/scripts/check-boundaries.mjs`, regra 4) reprova frase de voz
> escrita inline em componente. Se os dois discordarem, o código está certo e
> este texto é que está velho.

## 1. Personalidade

Quem fala é o **cecinho** — morador do cantinho, amiga secretária que organiza a
vida dela: **acolhedora, fofa, leve e pessoal**. A voz é de alguém que cuida, em
**1ª pessoa do cecinho e 2ª pessoa com ela** ("não consegui montar isso", "vamos
relaxar?", "prontinho ♡"), **nunca** de um sistema/IA. Palavras-chave: cuidado,
carinho, leveza, afeto. Evita tom formal ou rígido, mas mantém clareza.

> ⚠️ **A UI não se refere à usuária como "Ceci"** — o app fala com ela, por
> "você", e pelo nome **só quando ela autorizou** no perfil (`nomeAutorizado`,
> `SPEC-C-014` D8). Quem representa o cantinho é o mascote **cecinho**
> (`components/ui/Mascote.tsx`): o rótulo é dele ("dica do cecinho ✨").

### Os dois nomes do personagem (`SPEC-C-014` D3)

| Nome | Uso | Onde pode |
|---|---|---|
| **cecinho** | registro — rótulos, empty state, celebração | em qualquer chave de voz |
| **ceço** | intimidade — assinatura de afeto próximo | **só** nas chaves de `CHAVES_COM_APELIDO` (`voice.ts`): despedida de sessão de foco, celebração de marco, primeiro contato |

O `ceço` **nunca** aparece em erro, validação, notificação de rotina ou rótulo — e
nunca no meio da frase como auto-referência ("ceço cuidou de você"); só como
assinatura no fim ("…, ceço ♡").

## 2. Regras de escrita

- **Texto minúsculo** por padrão. Ex.: "seu study corner", "meta do dia",
  "bora estudar?", "anotar aula".
  - Exceções: títulos de seção que já usam `uppercase tracking-wider` via CSS,
    siglas e nomes próprios (TCC, DSM-5, HTP, ABNT, CRP, nomes de autores).
- **Branding:** escrever `cecistudy` minúsculo; com o coração, `cecistudy ♡`.
  **"cantinho" é metáfora, não nome** — o produto se chama `cecistudy ♡`
  (`SPEC-C-014` D4).
- **Ações:** preferir "anotar/guardar" a "registrar/cadastrar/salvar"; CTAs
  convidativos ("bora estudar?", "bora focar?", "guardar", "esquecer filtros").
- **Emojis:** com moderação, sempre com propósito. Comuns: `♡`, `✨`, `📚`,
  `🧠`, `☕`, `🌷`, `🎓`.
- **Termos próprios do produto:** "cantinho" (o espaço onde o cecinho mora),
  "dica do cecinho ✨", "study corner", "meta do dia", "plano de ação",
  "sessões de foco".

## 3. Tom por contexto

| Contexto | Tom | Chave |
|---|---|---|
| Saudações | "bom dia / boa tarde / boa noite" | `saudacao()` |
| Motivação | afetuoso e encorajador ("bora estudar?") | `dica()` |
| Ações | imperativos gentis ("guardar registro") | camada 2 — pode ficar no componente |
| Confirmações | "prontinho ♡", "parabéns, {nome}!" — só com autorização | `CELEBRACAO.*` |
| Empty states | acolhedores ("que tal afrouxar um pouco?") | `VAZIO.*` |
| **Erro** | **duas frases:** o que houve em 1ª pessoa, depois o que ela pode fazer. Detalhe técnico sob expansão | `ERRO.*` |
| Notificações | a voz do cecinho, com o nome resolvido no agendamento | `NOTIFICACAO.*` |

## 4. Erro, sempre duas frases (`SPEC-C-014` D5)

1. **o que aconteceu** — em 1ª pessoa do cecinho, sem jargão e sem culpa
   ("não consegui abrir esse backup");
2. **o que ela pode fazer agora** — verbo de ação ("confere a senha e tenta de novo").

O `Error.message`, código HTTP e stack **não** são voz: ficam na expansão. Erro
sem a segunda frase trava a usuária; erro sem a primeira é jargão.

## 5. Onde a frase mora

| Camada | O quê | Onde |
|---|---|---|
| **1 — voz do cecinho** | erro, vazio, dica, confirmação, celebração, notificação, onboarding | `src/lib/voice.ts` — **gate** |
| **2 — rótulo funcional** | botão, campo, `aria-label`, título de passo, placeholder | no componente, legível |
| **3 — conteúdo de catálogo** | biblioteca, stickers, níveis | `src/data/` |

Só a camada 1 é verificada por gate. Escrever frase de camada 1 inline em
componente reprova o `npm run verify`.

## 6. Checklist de copy

- [ ] Texto em pt-BR, minúsculo (salvo CSS `uppercase`/siglas/nomes próprios).
- [ ] É voz de camada 1? Então mora em `voice.ts`, com **consumidor** — chave
      sem consumidor reprova o teste.
- [ ] Tom acolhedor, sem jargão de diagnóstico (token, código HTTP, sha).
- [ ] Acentuação correta (acentos são bem-vindos mesmo em minúsculo).
- [ ] Termos próprios no lugar ("cantinho", "dica do cecinho ✨").
- [ ] Não chamar a usuária de "Ceci"; nome do perfil **só com autorização**.
- [ ] `ceço` só nas chaves de `CHAVES_COM_APELIDO`, e só como assinatura.
- [ ] Erro tem as duas frases, nesta ordem.

## 7. Como auditar

```bash
node .github/scripts/check-boundaries.mjs --voz   # 0 frases de voz inline
npm run test -- src/lib/__tests__/voice.test.ts  # invariantes da voz
npm run test:voz                                  # o fixture da regra
```

O número de frases inline **só pode cair**. Se o gate reclamar de allowlist
estourada, é dívida crescendo — não gate errado.
