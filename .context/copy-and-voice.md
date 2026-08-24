# Voz e Tom (Copy)

> Convenções de texto do cecistudy. Toda a UI é em **português do Brasil**. (pt-BR)

## 1. Personalidade

O cecistudy fala **direto com a usuária**, como uma **amiga secretária** que organiza a vida dela:
**acolhedora, fofa, leve e pessoal** — como um "cantinho" de estudos. A voz é a de alguém que
cuida, em **1ª e 2ª pessoa** ("vamos?", "deixa eu te ajudar", "que tal…?", "prontinho ♡"),
nunca de um sistema/IA. Palavras-chave: cuidado, carinho, leveza, afeto. Evita tom formal ou
rígido, mas mantém clareza.

> ⚠️ **A UI não se refere à usuária como "Ceci"** — o app fala com ela (usando o nome do
> perfil nas celebrações, ex.: "parabéns, {nome} 🎉"). Quem representa o cantinho é o
> mascote **cecinho** (`components/ui/Mascote.tsx`): as dicas são dele ("dica do cecinho ✨").
> O nome "Ceci" só aparece em dados de demonstração/seeds.

## 2. Regras de escrita

- **Texto minúsculo** por padrão (commit `165218a` "style: convert UI text to lowercase").
  Ex.: "seu study corner", "meta do dia", "bora estudar?", "anotar aula".
  - Exceções: títulos de seção que já usam `uppercase tracking-wider` via CSS (ex.: "Ementa & Objetivos da Disciplina"), siglas e nomes próprios (TCC, DSM-5, HTP, ABNT, CRP, nomes de autores).
- **Branding:** escrever `cecistudy` minúsculo; com o coração, `cecistudy ♡`.
- **Ações:** preferir "anotar/guardar" a "registrar/cadastrar/salvar"; CTAs convidativos
  ("bora estudar?", "bora focar?", "guardar", "esquecer filtros").
- **Emojis:** usados com moderação, sempre com propósito (decoração de cards, badges).
  Emojis comuns: `♡`, `✨`, `📚`, `🧠`, `☕`, `🌷`, `🎓`.
- **Termos próprios do produto:**
  - "cantinho" = o app/espaço pessoal.
  - "dica do cecinho ✨" = dicas motivacionais dadas pelo mascote (componente recorrente).
  - "study corner", "meta do dia", "plano de ação", "sessões de foco".

## 3. Tom por contexto

| Contexto | Tom |
|---|---|
| Saudações | "bom dia / boa tarde / boa noite ✨" (nome do perfil só em celebrações) |
| Motivação | afetuoso e encorajador ("com leveza e foco!", "bora estudar?") |
| Ações | imperativos gentis ("anotar aula", "guardar registro", "ver diário completo") |
| Confirmações | "guardar e voltar para home", "prontinho ♡", "parabéns, {nome}!" |
| Empty states | acolhedores ("ainda não tem prova anotada", "que tal afrouxar um pouco?") |
| Feedback de erro/aviso | suave, sem alarmismo |

## 4. Exemplos de frases da marca

- "dica do cecinho ✨: começa pelos cartões rápidos…"
- "hoje tem aula para você:"
- "bora estudar?" / "bora focar?"
- "tudo aqui nasce do que você anota: revisão, leitura e foco sempre conectados entre si ♡"
- "guardei suas configurações com carinho ♡"
- "conta como você está se sentindo para eu ajustar seu ritmo de estudos com carinho."

## 5. Checklist de copy

- [ ] Texto em pt-BR.
- [ ] Minúsculo (salvo exceções de CSS `uppercase`/siglas/nomes próprios).
- [ ] Tom acolhedor, sem jargão técnico de IA.
- [ ] Acentuação correta (acentos são bem-vindos mesmo em minúsculo).
- [ ] Usar termos próprios do produto ("cantinho", "dica do cecinho ✨").
- [ ] Não citar a usuária como "Ceci" — falar direto com ela; nome do perfil só em celebrações.
