import React, { useState, useEffect } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderNavProps {
  profile: UserProfile;
  onOpenSearch: () => void;
  onOpenQuickAdd?: () => void;
  onNavigateToPerfil: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  profile,
  onOpenSearch,
  onNavigateToPerfil,
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const todayDateStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Capitalize first letter of weekday
  const formattedDate = todayDateStr.charAt(0).toUpperCase() + todayDateStr.slice(1);

  return (
    <header
      className={`sticky top-0 z-30 bg-[#FFFCF8]/95 backdrop-blur-md border-b border-[#F1E9E6] px-4 transition-all duration-300 ease-in-out ${
        scrolled ? 'py-1.5 shadow-xs' : 'py-3 sm:py-3.5'
      }`}
    >
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-2.5">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={onNavigateToPerfil}
            className={`rounded-full bg-[#FFE7ED] border-2 border-[#FFB3C4] flex items-center justify-center text-[#40383A] font-serif-display font-bold shadow-2xs cursor-pointer transition-all duration-300 ${
              scrolled ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-lg hover:scale-105'
            }`}
            title="Ver Meu Espaço"
          >
            C
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`font-serif-display text-[#40383A] tracking-tight font-bold transition-all duration-300 ${
                  scrolled ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
                }`}
              >
                cecistudy
              </span>
              <span className="text-[#EA718F] text-xs sm:text-sm animate-pulse">♡</span>
              <span
                className={`bg-[#E4F1F8] text-[#32677F] rounded-full font-medium border border-[#CDE6F2] transition-all duration-300 ${
                  scrolled ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5'
                }`}
              >
                {profile.semester}º sem
              </span>
            </div>
            {!scrolled && (
              <p className="text-xs text-[#6F6568] hidden sm:block transition-all duration-300 mt-0.5">
                {formattedDate} • {profile.university}
              </p>
            )}
          </div>
        </div>

        {/* Center Search Trigger */}
        <button
          onClick={onOpenSearch}
          className={`flex-1 max-w-sm hidden md:flex items-center gap-2 bg-white/90 hover:bg-white text-[#6F6568] px-3.5 rounded-full border border-[#E8DEDB] shadow-2xs transition-all duration-300 ${
            scrolled ? 'py-1 text-[11px] min-h-[32px]' : 'py-2 text-xs min-h-[40px]'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-[#B0A6A8] shrink-0" />
          <span className="truncate">Buscar conceitos, autores (Freud, Beck...), aulas...</span>
          <kbd className="ml-auto text-[10px] bg-[#FAF7F2] px-1.5 py-0.5 rounded text-[#958B8D] border border-[#E8DEDB]">
            ⌘K
          </kbd>
        </button>

        {/* Quick Actions (Plus button removed as requested) */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            className={`md:hidden rounded-full text-[#40383A] bg-white border border-[#E8DEDB] hover:bg-[#FFF4F7] transition-all flex items-center justify-center ${
              scrolled ? 'w-8 h-8' : 'w-10 h-10'
            }`}
            title="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Mood Badge */}
          <button
            onClick={onNavigateToPerfil}
            className={`hidden sm:flex items-center gap-1.5 bg-[#FFF4F7] border border-[#FFD1DC] hover:border-[#F98FA8] text-[#B94763] px-3 rounded-full font-medium shadow-2xs transition-all duration-300 ${
              scrolled ? 'py-1 text-[11px] min-h-[32px]' : 'py-1.5 text-xs min-h-[40px]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EA718F] shrink-0" />
            <span className="truncate max-w-[130px]">{profile.avatarMood}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

