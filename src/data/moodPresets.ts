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
    vibeColor: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong',
    accentBg: 'bg-ceci-brand-strong'
  },
  {
    id: 'calma',
    emoji: '🧘',
    label: 'calma & equilibrada',
    description: 'ritmo suave e leitura sem pressão com foco no essencial',
    vibeColor: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong',
    accentBg: 'bg-ceci-academic-strong'
  },
  {
    id: 'criativa',
    emoji: '✨',
    label: 'inspirada & criativa',
    description: 'ideias fluindo para mapas mentais, tcc e artigos',
    vibeColor: 'bg-surface-subtle border-cream-200 text-beige-700',
    accentBg: 'bg-beige-700'
  },
  {
    id: 'cafe',
    emoji: '☕',
    label: 'preciso de um café',
    description: 'levemente cansada, avançando um passo de cada vez',
    vibeColor: 'bg-surface-mint border-ceci-border-mint text-success-leaf',
    accentBg: 'bg-success-leaf'
  },
  {
    id: 'motivada',
    emoji: '⚡',
    label: 'super motivada',
    description: 'energia máxima para dominar todos os tópicos de hoje',
    vibeColor: 'bg-surface-paper border-surface-sun text-gold',
    accentBg: 'bg-gold'
  },
  {
    id: 'reflexiva',
    emoji: '🧸',
    label: 'acolhida & reflexiva',
    description: 'analisando conceitos de psicologia com escuta interna',
    vibeColor: 'bg-surface-muted border-ceci-border-default text-ceci-secondary',
    accentBg: 'bg-ceci-secondary'
  }
];
