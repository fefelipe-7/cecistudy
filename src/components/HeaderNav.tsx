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
      className={`sticky top-0 z-30 bg-[#FFFCF8]/90 backdrop-blur-md border-b border-[#F2EBE8] px-4 transition-all duration-300 ease-in-out ${
        scrolled ? 'py-1.5 shadow-xs' : 'py-3 sm:py-3.5'
      }`}
    >
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-2.5">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={onNavigateToPerfil}
            className={`rounded-full bg-[#FFF5F7] border-2 border-[#FFD3DD] flex items-center justify-center text-[#40383A] font-display font-bold shadow-2xs cursor-pointer transition-all duration-300 ${
              scrolled ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-lg hover:scale-105'
            }`}
            title="Ver Meu Espaço"
          >
            C
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`font-display text-[#40383A] tracking-tight font-bold transition-all duration-300 ${
                  scrolled ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
                }`}
              >
                cecistudy
              </span>
              <span className="text-[#D85F79] text-xs sm:text-sm animate-pulse">♡</span>
              <span
                className={`bg-[#F3F9FC] text-[#396D82] rounded-full font-medium border border-[#CEE7F0] transition-all duration-300 ${
                  scrolled ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5'
                }`}
              >
                {profile.semester}º sem
              </span>
            </div>
            {!scrolled && (
              <p className="text-xs text-[#6D6366] hidden sm:block transition-all duration-300 mt-0.5">
                {formattedDate} • {profile.university}
              </p>
            )}
          </div>
        </div>

        {/* Center Search Trigger */}
        <button
          onClick={onOpenSearch}
          className={`flex-1 max-w-sm hidden md:flex items-center gap-2 bg-white/90 hover:bg-white text-[#6D6366] px-3.5 rounded-full border border-[#E9DFDC] shadow-2xs transition-all duration-300 cursor-pointer ${
            scrolled ? 'py-1 text-[11px] min-h-[32px]' : 'py-2 text-xs min-h-[40px]'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-[#918689] shrink-0" />
          <span className="truncate">Buscar conceitos, autores (Freud, Beck...), aulas...</span>
          <kbd className="ml-auto text-[10px] bg-[#FAF8F5] px-1.5 py-0.5 rounded text-[#918689] border border-[#E9DFDC]">
            ⌘K
          </kbd>
        </button>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            className={`md:hidden rounded-full text-[#40383A] bg-white border border-[#E9DFDC] hover:bg-[#FFF5F7] transition-all flex items-center justify-center cursor-pointer ${
              scrolled ? 'w-8 h-8' : 'w-10 h-10'
            }`}
            title="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Mood Badge */}
          <button
            onClick={onNavigateToPerfil}
            className={`hidden sm:flex items-center gap-1.5 bg-[#FFF5F7] border border-[#FFD3DD] hover:border-[#FFB8C7] text-[#B94862] px-3 rounded-full font-medium shadow-2xs transition-all duration-300 cursor-pointer ${
              scrolled ? 'py-1 text-[11px] min-h-[32px]' : 'py-1.5 text-xs min-h-[40px]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E97891] shrink-0" />
            <span className="truncate max-w-[130px]">{profile.avatarMood}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

