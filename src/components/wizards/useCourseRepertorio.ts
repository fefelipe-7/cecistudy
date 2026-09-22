/**
 * Hook de repertório da disciplina (SPEC-001): opções dos três seletores
 * (conceitos-chave, autores fundamentais, bibliografia) + resolução de ids.
 *
 * - Conceitos/autores: banco pessoal + acervo ✦ via `useAcervoTheory`
 *   (`resolveIds` adota o item do templo no banco pessoal antes de vincular).
 * - Bibliografia: leituras/materiais pessoais + catálogo estático
 *   (web = facade lazy; nativo = catálogo SQLite), montadas por
 *   `buildBibliographyOptions` no formato do `CatalogMultiSelect`.
 */
import { useEffect, useMemo, useState } from 'react';
import type { CatalogSelectOption } from '../ui/CatalogMultiSelect';
import { useMobileApp } from '@/context/mobileApp';
import { loadNativeLibraryDataset } from '../../lib/catalogLibrary';
import { useAcervoTheory } from './useAcervoTheory';
import { buildBibliographyOptions, type BibliographyOption } from '../../lib/repertorioOptions';
import type { CatalogWorkRef } from '../../lib/courseRepertorio';

const toBookRefs = (works: { id: string; nome: string; autor: string }[]): CatalogWorkRef[] =>
  works.map((w) => ({ id: w.id, title: w.nome, author: w.autor }));

const toArticleRefs = (arts: { id: string; titulo: string; autores: string }[]): CatalogWorkRef[] =>
  arts.map((a) => ({ id: a.id, title: a.titulo, author: a.autores }));

interface RepertorioCatalogRefs {
  books: CatalogWorkRef[];
  interdisciplinary: CatalogWorkRef[];
  articles: CatalogWorkRef[];
}

export const useCourseRepertorio = () => {
  const { readings, materials } = useMobileApp();
  const { conceptOptions, authorOptions, resolveIds } = useAcervoTheory();
  const [catalogWorks, setCatalogWorks] = useState<RepertorioCatalogRefs | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadNativeLibraryDataset()
      .then((dataset) => {
        if (cancelled) return;
        if (dataset) {
          setCatalogWorks({
            books: toBookRefs(dataset.catalogBooks),
            interdisciplinary: toBookRefs(dataset.interdisciplinaryBooks),
            articles: toArticleRefs(dataset.articles),
          });
          return;
        }
        return import('../../data/books').then((facade) => {
          if (!cancelled) {
            setCatalogWorks({
              books: toBookRefs(facade.catalogBooks),
              interdisciplinary: toBookRefs(facade.interdisciplinaryBooks),
              articles: toArticleRefs(facade.articles),
            });
          }
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const bibliographyOptions = useMemo<BibliographyOption[]>(
    () => buildBibliographyOptions({ readings, materials, catalog: catalogWorks }),
    [readings, materials, catalogWorks]
  );

  /** Opções no formato do CatalogMultiSelect (com grupo+badge). */
  const conceptOptionsGrouped = useMemo<CatalogSelectOption[]>(
    () =>
      conceptOptions.map((o) => ({
        value: o.value,
        label: o.label,
        group: o.value.startsWith('acervo-') ? 'acervo' : 'pessoal',
      })),
    [conceptOptions]
  );

  const authorOptionsGrouped = useMemo<CatalogSelectOption[]>(
    () =>
      authorOptions.map((o) => ({
        value: o.value,
        label: o.label,
        group: o.value.startsWith('acervo-') ? 'acervo' : 'pessoal',
      })),
    [authorOptions]
  );

  const bibliographyOptionsGrouped = useMemo<CatalogSelectOption[]>(
    () =>
      bibliographyOptions.map((o) => ({
        value: o.id,
        label: o.label,
        hint: o.hint,
        badge: o.badge,
        group: o.source === 'reading' || o.source === 'material' ? 'pessoal' : 'catalogo',
      })),
    [bibliographyOptions]
  );

  return {
    conceptOptions: conceptOptionsGrouped,
    authorOptions: authorOptionsGrouped,
    bibliographyOptions: bibliographyOptionsGrouped,
    /** Catálogo estático carregado (web facade / nativo .db) p/ o resolver. */
    catalog: catalogWorks,
    /** Resolve seleção mista (ids pessoais + pseudo-ids acervo) → ids reais. */
    resolveIds,
  };
};