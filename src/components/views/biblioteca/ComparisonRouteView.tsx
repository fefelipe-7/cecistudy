import React, { useEffect, useState } from 'react';
import type { TempleComparison } from '../../../types';
import { getTempleComparison } from '../../../lib/templeData';
import { ComparisonsScreen } from '../../library/temple/ComparisonsScreen';
import { ComparisonDetailScreen } from '../../library/temple/ComparisonDetailScreen';
import { TempleEmptyState, TempleLoading } from '../../library/temple/TempleShared';
import { useNavValue } from '@/context/shellNavContexts';

/**
 * Rota `#/biblioteca/templo/<slug>`: lista de comparações (sem slug) ou o
 * detalhe da comparação focada. Extraído p/ módulo próprio (B.4) para ser
 * lazy-loadado — comparações só carregam quando alguém abre a seção.
 */
export const ComparisonRouteView: React.FC<{ comparisonSlug?: string }> = ({ comparisonSlug }) => {
  const { openComparison, closeComparison } = useNavValue();
  const [focusedComparison, setFocusedComparison] = useState<TempleComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!comparisonSlug) {
      setFocusedComparison(null);
      setLoading(false);
      setError(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(false);
    void getTempleComparison(comparisonSlug)
      .then((comparison) => {
        if (!alive) return;
        setFocusedComparison(comparison);
        setError(!comparison);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setFocusedComparison(null);
        setError(true);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [comparisonSlug]);

  if (!comparisonSlug) return <ComparisonsScreen onOpen={openComparison} />;
  if (loading) return <TempleLoading label="carregando comparação…" />;
  if (error || !focusedComparison) return <TempleEmptyState message="comparação não encontrada ♡" />;
  return <ComparisonDetailScreen comparison={focusedComparison} onBack={closeComparison} />;
};