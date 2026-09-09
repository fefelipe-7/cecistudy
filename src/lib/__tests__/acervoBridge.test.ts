import { describe, expect, it } from 'vitest';
import {
  ACERVO_AUTHOR_PREFIX,
  ACERVO_CONCEPT_PREFIX,
  filterNewNames,
  isAcervoOptionId,
  templeAuthorToDraft,
  templeConceptToDraft,
} from '../acervoBridge';
import type { TempleAuthor, TempleConceptIndexEntry } from '../../types';

const conceptEntry = (
  overrides: Partial<TempleConceptIndexEntry>
): TempleConceptIndexEntry => ({
  id: 'concept-01-fundamentos-psicologicos-inconsciente',
  name: 'inconsciente',
  domainId: 'domain-01',
  domainName: 'Fundamentos Psicológicos',
  definition: 'conteúdo psíquico fora da consciência.',
  ...overrides,
});

const templeAuthor = (overrides: Partial<TempleAuthor>): TempleAuthor => ({
  id: 'author-sigmund-freud',
  name: 'Sigmund Freud',
  slug: 'sigmund-freud',
  order: 1,
  families: ['Psicanalítica'],
  aliases: [],
  oneLiner: 'pai da psicanálise.',
  born: '1856',
  died: '1939',
  mainWork: 'a interpretação dos sonhos',
  sections: [],
  ...overrides,
});

describe('templeConceptToDraft', () => {
  it('mapeia nome/definição e marca o domínio como tag', () => {
    const draft = templeConceptToDraft(conceptEntry({}));
    expect(draft.name).toBe('inconsciente');
    expect(draft.definition).toBe('conteúdo psíquico fora da consciência.');
    expect(draft.tags).toContain('acervo');
    expect(draft.tags).toContain('fundamentos psicológicos');
    expect(draft.authorIds).toEqual([]);
  });

  it('sem domínio, fica só com a tag acervo', () => {
    const draft = templeConceptToDraft(conceptEntry({ domainName: null }));
    expect(draft.tags).toEqual(['acervo']);
  });
});

describe('templeAuthorToDraft', () => {
  it('usa one-liner como bio e obra principal como majorWorks', () => {
    const draft = templeAuthorToDraft(templeAuthor({}));
    expect(draft.name).toBe('Sigmund Freud');
    expect(draft.bio).toBe('pai da psicanálise.');
    expect(draft.lifespan).toBe('1856 – 1939');
    expect(draft.majorWorks).toEqual(['a interpretação dos sonhos']);
  });

  it('campos ausentes ficam undefined/vazios sem quebrar', () => {
    const draft = templeAuthorToDraft(
      templeAuthor({ oneLiner: null, born: undefined, died: undefined, mainWork: undefined })
    );
    expect(draft.bio).toBe('');
    expect(draft.lifespan).toBeUndefined();
    expect(draft.majorWorks).toEqual([]);
  });
});

describe('filterNewNames', () => {
  it('exclui itens do acervo que já existem no banco pessoal (nome normalizado)', () => {
    const kept = filterNewNames(
      [
        conceptEntry({ id: 'c1', name: 'Inconsciente' }),
        conceptEntry({ id: 'c2', name: 'Transferência' }),
      ],
      [{ name: 'inconsciente' }]
    );
    expect(kept.map((k) => k.id)).toEqual(['c2']);
  });

  it('descarta itens do acervo sem nome', () => {
    const kept = filterNewNames([conceptEntry({ name: '' })], []);
    expect(kept).toEqual([]);
  });
});

describe('pseudo-ids de opção do acervo', () => {
  it('prefixos geram ids reconhecíveis', () => {
    expect(isAcervoOptionId(ACERVO_CONCEPT_PREFIX + 'x')).toBe(true);
    expect(isAcervoOptionId(ACERVO_AUTHOR_PREFIX + 'y')).toBe(true);
    expect(isAcervoOptionId('con-123')).toBe(false);
  });
});
