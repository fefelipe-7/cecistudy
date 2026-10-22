/**
 * Section — o bloco de assunto com entrada escalonada.
 *
 * Existe em vez de `SectionTitle` porque o `index` do cascata e responsabilidade
 * do **pai** (a ordem da tela), nao do titulo. Sem isso, cada tela reescreve o
 * container e o stagger some na segunda refatoracao.
 *
 * `index` alimenta `useEnter`, que respeita o modo de movimento reduzido do
 * sistema: com movimento reduzido, o conteudo aparece sem transladar, porque
 * informacao nao pode depender de animacao para ser lida.
 */
import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { SectionTitle } from './HeroCard';
import { useEnter } from '../lib/motion';

interface SectionProps {
  children: React.ReactNode;
  /** Rotulo em micro-caps. Ausente = secao sem divisoria (hero, dica). */
  label?: string;
  /** Posicao no cascata da tela. */
  index: number;
  accent?: 'brand' | 'academic' | 'neutral';
  /** Acao a direita do titulo ("ver todas", "filtros"). */
  action?: React.ReactNode;
  /** Espaco entre o titulo e o conteudo. */
  gap?: number;
}

export function Section({ children, label, index, accent = 'brand', action, gap = 12 }: SectionProps) {
  const entering = useEnter(index);
  return (
    <Animated.View style={entering}>
      {label ? <SectionTitle accent={accent} action={action}>{label}</SectionTitle> : null}
      <View style={label ? { marginTop: gap } : undefined}>{children}</View>
    </Animated.View>
  );
}

export default Section;