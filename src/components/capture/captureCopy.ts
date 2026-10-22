/**
 * Textos da captura de link (SPEC-012 §8.6).
 *
 * `SPEC-M-018 D13/F6`: a **camada 1** (erro, dica de validação, brinde) foi para
 * `src/lib/voice.ts` — `ERRO.linkInvalido`, `VAZIO.linkDica`, e as chaves
 * `CELEBRACAO.link*`. O que fica aqui é **camada 2**: rótulo de campo, rótulo de
 * tipo e placeholder (`SPEC-C-014 D9) — rótulo funcional pode ficar legível
 * no componente.
 *
 * A Share Extension SwiftUI espelhava esta tabela. Não há arquivo Swift dela
 * neste checkout, então não havia o que atualizar aqui — mas o espelho, quando
 * existir, deve espelhar **a voz** (`voice.ts`), não este arquivo.
 */
export const CAPTURE_LABELS = {
  title: 'guardar no cecistudy ♡',
  titleLabel: 'nome da página',
  kindLabel: 'é um…',
  kindArticle: 'artigo',
  kindReading: 'leitura',
  thesisLabel: 'é pro tcc?',
  fieldLabel: 'link',
  placeholder: 'colar o link aqui…',
} as const;
