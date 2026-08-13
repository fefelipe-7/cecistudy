export interface LooseNote {
  id: string;
  title: string;
  content: string;
  category: 'reflexão' | 'estudo' | 'ideia' | 'lembrete';
  date: string;
}

export const INITIAL_NOTES: LooseNote[] = [
  {
    id: 'note-1',
    title: 'Reflexão sobre TCC',
    content: 'Considerações sobre o vínculo terapêutico na clínica comportamental. Importante enfatizar a empatia e escuta ativa no primeiro acolhimento.',
    category: 'reflexão',
    date: 'Hoje, 11:30',
  },
  {
    id: 'note-2',
    title: 'Anotação de estudo sobre Skinner',
    content: 'Diferença conceitual entre reforço negativo (remoção de estresse/aversivo) e punição positiva (apresentação de aversivo).',
    category: 'estudo',
    date: 'Ontem, 16:45',
  },
  {
    id: 'note-3',
    title: 'Ideia para mapa conceitual',
    content: 'Mapear autores da Psicanálise x Gestalt x TCC em uma linha do tempo comparativa.',
    category: 'ideia',
    date: '10 de Ago',
  },
];

export const CATEGORY_BADGE: Record<LooseNote['category'], string> = {
  'reflexão': 'bg-[#FFF5F7] text-[#B94862] border border-[#FFD3DD]',
  'estudo': 'bg-[#F3F9FC] text-[#396D82] border border-[#CEE7F0]',
  'ideia': 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]',
  'lembrete': 'bg-[#FAF8F5] text-[#6D6366] border border-[#E9DFDC]',
};
