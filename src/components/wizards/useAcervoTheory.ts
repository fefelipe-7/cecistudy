import { useEffect, useMemo, useRef, useState } from 'react';
import { useMobileApp } from '@/context/mobileApp';
import { getTempleAuthors, getTempleConceptIndex } from '../../lib/templeData';
import {
  ACERVO_AUTHOR_PREFIX,
  ACERVO_CONCEPT_PREFIX,
  filterNewNames,
  templeAuthorToDraft,
  templeConceptToDraft,
} from '../../lib/acervoBridge';
import type { TempleAuthor, TempleConceptIndexEntry } from '../../types';

/**
 * Opções de conceitos/autores para os seletores dos wizards: banco pessoal
 * primeiro + grupo "do acervo ✦" (pseudo-ids). Ao selecionar um item do
 * acervo, ele é adotado no banco pessoal e o pseudo-id vira o id real.
 */
export const useAcervoTheory = () => {
  const { concepts, authors, adoptAcervoConcept, adoptAcervoAuthor } = useMobileApp();
  const [conceptIndex, setConceptIndex] = useState<TempleConceptIndexEntry[]>([]);
  const [templeAuthors, setTempleAuthors] = useState<TempleAuthor[]>([]);
  const resolvedRef = useRef(new Map<string, string>());

  useEffect(() => {
    let cancelled = false;
    void getTempleConceptIndex()
      .then((idx) => {
        if (!cancelled) setConceptIndex(idx);
      })
      .catch(() => {});
    void getTempleAuthors()
      .then((list) => {
        if (!cancelled) setTempleAuthors(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const conceptOptions = useMemo(
    () => [
      ...concepts.map((c) => ({ value: c.id, label: c.name })),
      ...filterNewNames(conceptIndex, concepts).map((c) => ({
        value: ACERVO_CONCEPT_PREFIX + c.id,
        label: `✦ ${c.name}`,
      })),
    ],
    [concepts, conceptIndex]
  );

  const authorOptions = useMemo(
    () => [
      ...authors.map((a) => ({ value: a.id, label: a.name })),
      ...filterNewNames(templeAuthors, authors).map((a) => ({
        value: ACERVO_AUTHOR_PREFIX + a.id,
        label: `✦ ${a.name}`,
      })),
    ],
    [authors, templeAuthors]
  );

  /** Resolve seleção mista (ids pessoais + pseudo-ids do acervo) → ids reais. */
  const resolveIds = (ids: string[]): string[] =>
    ids.map((id) => {
      if (!id.startsWith('acervo-')) return id;
      const cached = resolvedRef.current.get(id);
      if (cached) return cached;

      let realId = id;
      if (id.startsWith(ACERVO_CONCEPT_PREFIX)) {
        const entry = conceptIndex.find((c) => ACERVO_CONCEPT_PREFIX + c.id === id);
        if (entry) realId = adoptAcervoConcept(templeConceptToDraft(entry));
      } else if (id.startsWith(ACERVO_AUTHOR_PREFIX)) {
        const author = templeAuthors.find((a) => ACERVO_AUTHOR_PREFIX + a.id === id);
        if (author) realId = adoptAcervoAuthor(templeAuthorToDraft(author));
      }
      resolvedRef.current.set(id, realId);
      return realId;
    });

  return { conceptOptions, authorOptions, resolveIds };
};
