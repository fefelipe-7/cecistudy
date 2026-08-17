/**
 * Seeds de notas avulsas de exemplo (carregadas apenas via "começar com dados de exemplo").
 * As datas são ISO completas (o display converte para texto amigável).
 */
import type { LooseNote } from '../types';

export const INITIAL_NOTES: LooseNote[] = [
  {
    id: 'note-1',
    title: 'reflexão sobre o tcc',
    content: 'considerações sobre o vínculo terapêutico na clínica comportamental. importante enfatizar a empatia e escuta ativa no primeiro acolhimento.',
    category: 'reflexão',
    date: '2026-08-13T11:30:00-03:00',
  },
  {
    id: 'note-2',
    title: 'anotação de estudo sobre skinner',
    content: 'diferença conceitual entre reforço negativo (remoção de estresse/aversivo) e punição positiva (apresentação de aversivo).',
    category: 'estudo',
    date: '2026-08-12T16:45:00-03:00',
  },
  {
    id: 'note-3',
    title: 'ideia para mapa conceitual',
    content: 'mapear autores da psicanálise x gestalt x tcc em uma linha do tempo comparativa.',
    category: 'ideia',
    date: '2026-08-10T09:00:00-03:00',
  },
];