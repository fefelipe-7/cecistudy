import { describe, it, expect } from 'vitest';

/**
 * Testes do facade do Templo de Conhecimento (web) — registry de abordagens,
 * chunks lazy de conceitos e sanidade dos autores curados.
 */
import {
  approachRegistryFile,
  conceptChunkLoader,
  conceptDomains,
  conceptIndex,
  curatedAuthorsFile,
  resolveApproach,
  templeTechniques,
  techniqueCategories,
} from '../../data/temple/index';
import { normalize } from './normalizeTestHelper';

describe('approachRegistry (A1)', () => {
  it('resolve aliases das técnicas para abordagens editoriais', () => {
    const resolved = resolveApproach(
      'app-psicanalitica_psicodinamica-psicanalise-freudiana-classica'
    );
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe('psic-01-01');
    expect(resolved?.familyId).toBe('fam-01');
  });

  it('resolve alias taxonômico mapeado por keyword à família', () => {
    const resolved = resolveApproach('app-psicanalise-e-psicodinamica');
    expect(resolved).not.toBeNull();
    expect(resolved?.name).toBe('Psicanálise e Psicodinâmica');
    expect(resolved?.familyId).toBe('fam-01');
  });

  it('mantém áreas metodológicas/contextuais como entradas próprias', () => {
    const resolved = resolveApproach('app-pesquisa-metodologia-e-estatistica');
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe('app-pesquisa-metodologia-e-estatistica');
    expect(resolved?.familyId).toBeNull();
  });

  it('retorna null para id desconhecido e resolve todos os ids do próprio mapa', () => {
    expect(resolveApproach('app-nao-existe')).toBeNull();
    for (const [alias, canonical] of Object.entries(approachRegistryFile.resolve)) {
      const entry = approachRegistryFile.entries.find((e) => e.id === canonical);
      if (!alias.startsWith('cur-')) {
        expect(entry, `alias ${alias} → canônico ${canonical} deve existir`).toBeTruthy();
      }
    }
  });

  it('os 25 ids de abordagem das técnicas viram aliases registrados', () => {
    const techniqueAliases = approachRegistryFile.entries
      .flatMap((e) => e.aliases)
      .filter((a) => a.source === 'techniques');
    expect(techniqueAliases.length).toBeGreaterThanOrEqual(25);
  });
});

describe('conceitos (facades lazy)', () => {
  it('índice tem 225 conceitos em 12 domínios, sem ids repetidos', () => {
    expect(conceptIndex.length).toBe(225);
    expect(conceptDomains.length).toBe(12);
    expect(new Set(conceptIndex.map((c) => c.id)).size).toBe(225);
  });

  it('todo domínio do índice tem chunk loader', () => {
    for (const domain of conceptDomains) {
      expect(conceptChunkLoader(domain.id), `chunk ${domain.id}`).not.toBeNull();
    }
    expect(conceptChunkLoader('domain-inexistente')).toBeNull();
  });

  it('chunk carrega conceitos do domínio correspondente', async () => {
    const loader = conceptChunkLoader(conceptDomains[0].id);
    const chunk = await loader!();
    expect(chunk.default.length).toBeGreaterThan(0);
    for (const concept of chunk.default) {
      expect(concept.domainId).toBe(conceptDomains[0].id);
    }
  });
});

describe('autores curados (fichas editoriais)', () => {
  it('139 autores canônicos com famílias e ordem canônica', () => {
    expect(curatedAuthorsFile.authors.length).toBe(139);
    expect(curatedAuthorsFile.families.length).toBeGreaterThan(5);
    // ordem canônica do acervo
    const orders = curatedAuthorsFile.authors.map((a) => a.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    // todos têm ficha com seções
    for (const a of curatedAuthorsFile.authors.slice(0, 20)) {
      expect(a.sections.length, `seções de ${a.name}`).toBeGreaterThan(0);
    }
    // entidade de consulta: sem contagem de questões no modelo
    for (const a of curatedAuthorsFile.authors) {
      expect('questionCount' in a).toBe(false);
      expect('kind' in a).toBe(false);
    }
  });

  it('Sigmund Freud abre o acervo com ficha completa', () => {
    const freud = curatedAuthorsFile.authors.find((a) => a.name === 'Sigmund Freud');
    expect(freud).toBeTruthy();
    expect(freud!.order).toBe(1);
    expect((freud!.families ?? []).length).toBeGreaterThan(0);
    expect(freud!.oneLiner).toBeTruthy();
    expect(freud!.sections.map((s) => s.title)).toContain('A grande ideia');
    expect(freud!.sections.map((s) => s.title)).toContain('Principais obras');
    expect(freud!.sections.map((s) => s.title)).not.toContain('Referências');
  });
});

describe('técnicas', () => {
  it('136 técnicas em 10 categorias, todas com categoria válida', () => {
    expect(templeTechniques.length).toBe(136);
    expect(techniqueCategories.length).toBe(10);
    const categoryIds = new Set(techniqueCategories.map((c) => c.id));
    for (const t of templeTechniques) {
      expect(categoryIds.has(t.dominioId), `${t.id} com categoria válida`).toBe(true);
    }
  });
});
