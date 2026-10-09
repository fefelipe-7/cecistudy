import { describe, expect, it } from 'vitest';
import {
  extractDoi,
  isProvisionalTitle,
  mapCrossrefWork,
  mergeEnrichment,
  normalizeDoi,
  parseCitationMeta,
  type EnrichmentFields,
} from '../parseCitationMeta';
import type { ReadingItem } from '../../types';

const hundred = (family: string, given: string) => ({ family, given });

const highwireHtml = `
<html><head>
  <meta name="citation_title" content="Luto e escuta clínica: &amp; prática">
  <meta name="citation_author" content="Worden, J. William">
  <meta name="citation_author" content="Parkes, Colin Murray">
  <meta name="citation_journal_title" content="Revista Brasileira de Terapias">
  <meta name="citation_publication_date" content="2023/04/15">
  <meta name="citation_volume" content="42">
  <meta name="citation_issue" content="3">
  <meta name="citation_firstpage" content="72">
  <meta name="citation_lastpage" content="89">
  <meta name="citation_doi" content="10.1590/2023.xxxx">
</head></html>`;

describe('normalizeDoi / extractDoi (SPEC-012 §7.3)', () => {
  it('normaliza prefixos de URL/doi: e minúsculas', () => {
    expect(normalizeDoi('https://doi.org/10.1590/2023.XXXX')).toBe('10.1590/2023.xxxx');
    expect(normalizeDoi('http://dx.doi.org/10.1000/abc')).toBe('10.1000/abc');
    expect(normalizeDoi('doi: 10.1000/test')).toBe('10.1000/test');
  });

  it('DOI inválido devolve null — nada consulta', () => {
    expect(normalizeDoi('https://doi.org/not-a-doi')).toBeNull();
    expect(normalizeDoi('not a doi')).toBeNull();
    expect(extractDoi('sem doi nenhum aqui')).toBeNull();
  });

  it('extrai DOI de URL doi.org e de texto livre', () => {
    expect(extractDoi('https://doi.org/10.1590/2023.xxxx')).toBe('10.1590/2023.xxxx');
    expect(extractDoi('confira em https://doi.org/10.1590/2023.xxxx ok')).toBe(
      '10.1590/2023.xxxx',
    );
    expect(extractDoi('doi:10.1000/j.abc.2022.01')).toBe('10.1000/j.abc.2022.01');
  });
});

describe('parseCitationMeta (SPEC-012 §7.3 item 1-3)', () => {
  it('Highwire: título, autores separados, periódico, ano, vol/nº/págs, DOI', () => {
    const fields = parseCitationMeta(highwireHtml, 'https://revista.example/artigo');
    expect(fields.title).toBe('Luto e escuta clínica: & prática');
    expect(fields.authors).toEqual([hundred('Worden', 'J. William'), hundred('Parkes', 'Colin Murray')]);
    expect(fields.container).toBe('Revista Brasileira de Terapias');
    expect(fields.year).toBe('2023');
    expect(fields.volume).toBe('42');
    expect(fields.issue).toBe('3');
    expect(fields.pages).toBe('72-89');
    expect(fields.doi).toBe('10.1590/2023.xxxx');
  });

  it('autor sem vírgula não é adivinhado — deixa para conferir (§7.3)', () => {
    const html = '<meta name="citation_title" content="Título"><meta name="citation_author" content="Ana Maria Silva">';
    const fields = parseCitationMeta(html, 'https://x.example/a');
    expect(fields.title).toBe('Título');
    expect(fields.authors ?? []).toHaveLength(0);
  });

  it('JSON-LD ScholarlyArticle: título, autor, ano, periódico, páginas', () => {
    const html = `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Escuta clínica no luto do idoso",
  "author": [
    {"@type": "Person", "familyName": "Ferreira", "givenName": "Marina"},
    {"@type": "Person", "name": "Silva, João"}
  ],
  "datePublished": "2021-09-14",
  "isPartOf": {
    "@type": "Periodical",
    "name": "Psicologia em Estudo",
    "volumeNumber": "19",
    "issueNumber": "2",
    "publisher": {"@type": "Organization", "name": "SciELO"}
  },
  "pagination": "e0881",
  "identifier": "10.1590/1518-0523.1914"
}
</script>`;
    const fields = parseCitationMeta(html, 'https://doi.org/10.1590/1518-0523.1914');
    expect(fields.title).toBe('Escuta clínica no luto do idoso');
    expect(fields.authors).toEqual([hundred('Ferreira', 'Marina'), hundred('Silva', 'João')]);
    expect(fields.year).toBe('2021');
    expect(fields.container).toBe('Psicologia em Estudo');
    expect(fields.volume).toBe('19');
    expect(fields.issue).toBe('2');
    expect(fields.publisher).toBe('SciELO');
    expect(fields.pages).toBe('e0881');
    expect(fields.doi).toBe('10.1590/1518-0523.1914');
  });

  it('JSON-LD dentro de @graph é encontrado', () => {
    const html = `
<script type="application/ld+json">
{"@context": "https://schema.org", "@graph": [
  {"@type": "WebPage", "name": "Índice"},
  {"@type": "ScholarlyArticle", "headline": "Orientação", "author": [{"@type": "Person", "familyName": "Sousa", "givenName": "Ana"}], "datePublished": "2020-02-02"}
]}
</script>`;
    const fields = parseCitationMeta(html, 'https://x.example/g');
    expect(fields.title).toBe('Orientação');
    expect(fields.authors).toEqual([hundred('Sousa', 'Ana')]);
  });

  it('só og:title/title: título, autor fica vazio', () => {
    const fields = parseCitationMeta(
      '<html><head><meta property="og:title" content="Site sem metadados"></head></html>',
      'https://x.example/pag',
    );
    expect(fields.title).toBe('Site sem metadados');
    expect(fields.authors ?? []).toHaveLength(0);
  });
});

describe('mapCrossrefWork (SPEC-012 §7.3 item 0)', () => {
  const nl = (N: number) => Array.from({ length: N }, (_, i) => ({ family: `Sobrenome${i}`, given: `Nome${i}` }));

  it('artigo com 1, 3 e 5 autores — todos separados', () => {
    for (const n of [1, 3, 5]) {
      const fields = mapCrossrefWork({
        message: {
          title: ['Título do artigo'],
          author: nl(n),
          ['container-title']: ['Periódico X'],
          volume: '10',
          page: '1-14',
          ['published-print']: { ['date-parts']: [[2019, 7, 1]] },
          DOI: '10.1000/abc.2019.01',
        },
      });
      expect(fields.authors).toHaveLength(n);
      expect(fields.authors?.[n - 1]).toEqual(hundred(`Sobrenome${n - 1}`, `Nome${n - 1}`));
      expect(fields.title).toBe('Título do artigo');
      expect(fields.pages).toBe('1-14');
      expect(fields.year).toBe('2019');
      expect(fields.doi).toBe('10.1000/abc.2019.01');
    }
  });

  it('sem páginas e sem periódico: campos simplesmente faltam', () => {
    const fields = mapCrossrefWork({
      message: {
        title: ['Só o título'],
        author: [nl(1)[0]],
      },
    });
    expect(fields.title).toBe('Só o título');
    expect(fields.container).toBeUndefined();
    expect(fields.pages).toBeUndefined();
    expect(fields.year).toBeUndefined();
  });

  it('payload não-Crossref não lança (vira vazio)', () => {
    expect(mapCrossrefWork(null)).toEqual({});
    expect(mapCrossrefWork({ foo: 1 })).toEqual({});
    expect(mapCrossrefWork({ message: null })).toEqual({});
  });
});

describe('mergeEnrichment (SPEC-012 §7.3 — só campo vazio)', () => {
  const base = (): Pick<ReadingItem, 'title' | 'url' | 'authors' | 'year' | 'container'> & Partial<ReadingItem> =>
    ({
      title: 'site.com.br',
      url: 'https://site.com.br/artigo',
      author: 'autor não informado',
      authors: [],
    });

  it('título provisório (host) é sobrescrito; o resto preenche só o vazio', () => {
    expect(isProvisionalTitle(base())).toBe(true);
    const reading = base();
    const fields: EnrichmentFields = {
      title: 'Título real da página',
      authors: [hundred('Ferreira', 'Marina')],
      year: '2022',
      container: 'Psicologia em Estudo',
    };
    const patch = mergeEnrichment(reading, fields);
    expect(patch.title).toBe('Título real da página');
    expect(patch.authors).toEqual([hundred('Ferreira', 'Marina')]);
    expect(patch.year).toBe('2022');
    expect(patch.enrichStatus).toBe('ok');
  });

  it('nunca sobrescreve o que a usuária digitou', () => {
    const reading = base();
    reading.title = 'Meu título digitado';
    reading.year = '2018';
    reading.authors = [hundred('Digitado', 'Fulano')];
    const patch = mergeEnrichment(reading, {
      title: 'Título da página',
      year: '2024',
      authors: [hundred('Ferreira', 'Marina')],
      container: 'Outro Periódico',
    });
    expect(patch.title).toBeUndefined();
    expect(patch.year).toBeUndefined();
    expect(patch.authors).toBeUndefined();
    expect(patch.container).toBe('Outro Periódico');
  });
});