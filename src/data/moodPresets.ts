export interface MoodPreset {
  id: string;
  emoji: string;
  label: string;
  description: string;
  vibeColor: string;
  accentBg: string;
}

export const MOOD_PRESETS: MoodPreset[] = [
  {
    id: 'focada',
    emoji: '🤓',
    label: 'focada & acadêmica',
    description: 'pronta para imergir nos livros e sintetizar teorias',
    vibeColor: 'bg-[#FFF5F7] border-[#FFD3DD] text-[#B94862]',
    accentBg: 'bg-[#B94862]'
  },
  {
    id: 'calma',
    emoji: '🧘',
    label: 'calma & equilibrada',
    description: 'ritmo suave e leitura sem pressão com foco no essencial',
    vibeColor: 'bg-[#F3F9FC] border-[#CEE7F0] text-[#396D82]',
    accentBg: 'bg-[#396D82]'
  },
  {
    id: 'criativa',
    emoji: '✨',
    label: 'inspirada & criativa',
    description: 'ideias fluindo para mapas mentais, tcc e artigos',
    vibeColor: 'bg-[#FFF8F1] border-[#FFF1E5] text-[#756354]',
    accentBg: 'bg-[#756354]'
  },
  {
    id: 'cafe',
    emoji: '☕',
    label: 'preciso de um café',
    description: 'levemente cansada, avançando um passo de cada vez',
    vibeColor: 'bg-[#F2F8F4] border-[#D1E8D9] text-[#518265]',
    accentBg: 'bg-[#518265]'
  },
  {
    id: 'motivada',
    emoji: '⚡',
    label: 'super motivada',
    description: 'energia máxima para dominar todos os tópicos de hoje',
    vibeColor: 'bg-[#FFFDF0] border-[#FFF8CC] text-[#8C7338]',
    accentBg: 'bg-[#8C7338]'
  },
  {
    id: 'reflexiva',
    emoji: '🧸',
    label: 'acolhida & reflexiva',
    description: 'analisando conceitos de psicologia com escuta interna',
    vibeColor: 'bg-[#FAF8F5] border-[#E9DFDC] text-[#6D6366]',
    accentBg: 'bg-[#6D6366]'
  }
];
