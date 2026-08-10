import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  ArrowLeft,
  Check,
  Coffee,
  Smile,
  Brain,
  Zap,
  BookOpen,
  MessageSquare,
  Flame,
  Sun
} from 'lucide-react';

export interface DailyMoodData {
  emoji: string;
  label: string;
  energyLevel: number; // 1-5
  vibeColor: string;
  reflection: string;
  intention: string;
  updatedAt: string;
}

interface EstadoDeEspiritoViewProps {
  currentMood: DailyMoodData;
  onSaveMood: (newMood: DailyMoodData) => void;
  onBackToHome: () => void;
}

export const MOOD_PRESETS = [
  {
    id: 'focada',
    emoji: '🤓',
    label: 'Focada & Acadêmica',
    description: 'Pronta para imergir nos livros e sintetizar teorias',
    vibeColor: 'bg-[#FFF5F7] border-[#FFD3DD] text-[#B94862]',
    accentBg: 'bg-[#B94862]'
  },
  {
    id: 'calma',
    emoji: '🧘',
    label: 'Calma & Equilibrada',
    description: 'Ritmo suave e leitura sem pressão com foco no essencial',
    vibeColor: 'bg-[#F3F9FC] border-[#CEE7F0] text-[#396D82]',
    accentBg: 'bg-[#396D82]'
  },
  {
    id: 'criativa',
    emoji: '✨',
    label: 'Inspirada & Criativa',
    description: 'Ideias fluindo para mapas mentais, TCC e artigos',
    vibeColor: 'bg-[#FFF8F1] border-[#FFF1E5] text-[#756354]',
    accentBg: 'bg-[#756354]'
  },
  {
    id: 'cafe',
    emoji: '☕',
    label: 'Preciso de um Café',
    description: 'Levemente cansada, avançando um passo de cada vez',
    vibeColor: 'bg-[#F2F8F4] border-[#D1E8D9] text-[#518265]',
    accentBg: 'bg-[#518265]'
  },
  {
    id: 'motivada',
    emoji: '⚡',
    label: 'Super Motivada',
    description: 'Energia máxima para dominar todos os tópicos de hoje',
    vibeColor: 'bg-[#FFFDF0] border-[#FFF8CC] text-[#8C7338]',
    accentBg: 'bg-[#8C7338]'
  },
  {
    id: 'reflexiva',
    emoji: '🧸',
    label: 'Acolhida & Reflexiva',
    description: 'Analisando conceitos de psicologia com escuta interna',
    vibeColor: 'bg-[#FAF8F5] border-[#E9DFDC] text-[#6D6366]',
    accentBg: 'bg-[#6D6366]'
  }
];

export const EstadoDeEspiritoView: React.FC<EstadoDeEspiritoViewProps> = ({
  currentMood,
  onSaveMood,
  onBackToHome
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState(currentMood.emoji || '🤓');
  const [energyLevel, setEnergyLevel] = useState(currentMood.energyLevel || 4);
  const [reflection, setReflection] = useState(currentMood.reflection || '');
  const [intention, setIntention] = useState(currentMood.intention || 'Estudo leve e produtivo');

  const selectedPreset = MOOD_PRESETS.find((m) => m.emoji === selectedEmoji) || MOOD_PRESETS[0];

  const handleSave = () => {
    onSaveMood({
      emoji: selectedPreset.emoji,
      label: selectedPreset.label,
      energyLevel,
      vibeColor: selectedPreset.vibeColor,
      reflection,
      intention,
      updatedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
    onBackToHome();
  };

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Header with Back Button */}
      <div className="flex items-center justify-between pt-2 px-1">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-xs font-semibold text-[#6D6366] hover:text-[#40383A] bg-white px-3 py-2 rounded-xl border border-[#E9DFDC] shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Hoje</span>
        </button>

        <span className="text-[11px] font-bold text-[#B94862] uppercase tracking-wider bg-[#FFF5F7] px-3 py-1 rounded-full border border-[#FFD3DD]">
          Estado de Espírito ♡
        </span>
      </div>

      {/* Hero Banner */}
      <div className="rounded-[24px] p-6 bg-gradient-to-br from-[#FFF5F7] via-white to-[#FFF8F1] border border-[#FFD3DD] text-center relative overflow-hidden space-y-4 shadow-[0_2px_8px_rgba(64,56,58,0.05)]">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-white border-2 border-[#FFD3DD] flex items-center justify-center text-4xl shadow-2xs transition-transform hover:scale-105">
          {selectedPreset.emoji}
        </div>

        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#40383A]">
            Como você está se sentindo hoje?
          </h1>
          <p className="text-xs sm:text-sm text-[#6D6366] mt-1 max-w-sm mx-auto leading-relaxed">
            Registre seu estado de espírito do dia para adaptar seu ritmo de estudos de forma acolhedora.
          </p>
        </div>
      </div>

      {/* Mood Selector Grid */}
      <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2EBE8] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E97891]" />
            <h2 className="font-display text-lg font-bold text-[#40383A]">
              Escolha seu Mood do Dia
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-[#918689] uppercase">
            6 opções
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {MOOD_PRESETS.map((preset) => {
            const isSelected = selectedEmoji === preset.emoji;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedEmoji(preset.emoji)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative cursor-pointer ${
                  isSelected
                    ? `${preset.vibeColor} ring-2 ring-[#E97891]/30 shadow-2xs scale-[1.02]`
                    : 'bg-[#FAF8F5] border-[#E9DFDC] hover:border-[#FFD3DD] hover:bg-white'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#B94862] text-white flex items-center justify-center text-[10px] shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                
                <div className="text-2xl mb-2">{preset.emoji}</div>
                <div>
                  <p className="font-display font-bold text-sm text-[#40383A]">
                    {preset.label}
                  </p>
                  <p className="text-[10px] text-[#6D6366] mt-0.5 line-clamp-2 leading-tight">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy Level & Intention */}
      <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#40383A] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#B94862]" /> Nível de Energia de Hoje
            </span>
            <span className="text-xs font-bold text-[#B94862] bg-[#FFF5F7] px-2.5 py-0.5 rounded-full border border-[#FFD3DD]">
              {energyLevel} / 5
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setEnergyLevel(level)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  level <= energyLevel
                    ? 'bg-[#FFF5F7] border-[#FFD3DD] text-[#B94862] shadow-2xs'
                    : 'bg-[#FAF8F5] border-[#E9DFDC] text-[#BEB4B6] hover:border-[#FFD3DD]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${level <= energyLevel ? 'fill-[#B94862]' : ''}`} />
                <span>{level}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Intention Chips */}
        <div className="pt-2 border-t border-[#F2EBE8]">
          <span className="text-xs font-bold text-[#40383A] flex items-center gap-1.5 mb-2.5">
            <Sun className="w-4 h-4 text-[#756354]" /> Intenção para a Sessão
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              'Estudo leve e produtivo',
              'Foco total em exames',
              'Avançar no TCC',
              'Leitura sem pressa',
              'Organizar cronograma'
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => setIntention(tag)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                  intention === tag
                    ? 'bg-[#40383A] text-white border-[#40383A]'
                    : 'bg-[#FAF8F5] text-[#6D6366] border-[#E9DFDC] hover:border-[#FFD3DD]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Reflection Note */}
        <div className="pt-2 border-t border-[#F2EBE8]">
          <label className="text-xs font-bold text-[#40383A] flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-4 h-4 text-[#396D82]" /> Nota de Reflexão do Dia
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Como você está hoje? Escreva uma linha sobre seu dia, sentimentos ou foco..."
            rows={2}
            className="w-full text-xs p-3 rounded-xl border border-[#E9DFDC] bg-[#FAF8F5] focus:outline-none focus:border-[#E97891] text-[#40383A] placeholder-[#BEB4B6]"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-[#E97891] hover:bg-[#D85F79] text-white py-3.5 rounded-2xl font-bold text-sm shadow-2xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
      >
        <Check className="w-5 h-5 stroke-[2.5]" />
        <span>Salvar e Voltar para Home</span>
      </button>

    </div>
  );
};
