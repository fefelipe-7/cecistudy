import React, { useState } from 'react';
import {
  Library,
  User,
  Sparkles,
  BookOpen,
  Network,
  Search,
  Plus,
  ExternalLink,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import {
  PsychologyAuthor,
  PsychologyConcept,
  PsychologyApproach,
  MaterialItem,
  Course,
  SubTabBiblioteca
} from '../../types';

interface BibliotecaViewProps {
  authors: PsychologyAuthor[];
  concepts: PsychologyConcept[];
  approaches: PsychologyApproach[];
  materials: MaterialItem[];
  courses: Course[];
  initialSubTab?: SubTabBiblioteca;
  initialSelectedId?: string;
  onOpenQuickAdd: () => void;
}

export const BibliotecaView: React.FC<BibliotecaViewProps> = ({
  authors,
  concepts,
  approaches,
  materials,
  courses,
  initialSubTab = 'autores',
  initialSelectedId,
  onOpenQuickAdd,
}) => {
  const [subTab, setSubTab] = useState<SubTabBiblioteca>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<PsychologyAuthor | null>(
    authors.find((a) => a.id === initialSelectedId) || null
  );
  const [selectedConcept, setSelectedConcept] = useState<PsychologyConcept | null>(
    concepts.find((c) => c.id === initialSelectedId) || null
  );

  const [activeNodeId, setActiveNodeId] = useState<string>('con-1');

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-16 animate-in fade-in duration-300">
      
      {/* Top Header Label & Title */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-[#918689] uppercase">Conhecimento Organizado</p>
          <h1 className="font-display text-2xl sm:text-3xl text-[#40383A] font-bold mt-0.5 tracking-tight">
            Biblioteca Ceci <span className="text-[#D85F79] font-normal">♡</span>
          </h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#F3F9FC] border border-[#CEE7F0] flex items-center justify-center text-[#396D82] font-display font-bold text-lg shadow-2xs">
          B
        </div>
      </div>

      {/* Hero Card: Sua estante viva */}
      <div className="rounded-[24px] p-6 bg-gradient-to-br from-[#F3F9FC]/90 via-white to-[#FFF5F7]/80 border border-[#CEE7F0] relative overflow-hidden space-y-4 shadow-[0_2px_8px_rgba(64,56,58,0.05)]">
        <div>
          <span className="text-[11px] font-bold text-[#396D82] uppercase tracking-wider bg-white/90 px-3 py-1 rounded-full border border-[#CEE7F0] shadow-2xs">
            Sua estante viva ♡
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#40383A] mt-2">
            Aprenda com método, salve com afeto ✨
          </h2>
          <p className="text-xs text-[#6D6366] mt-1.5 leading-relaxed">
            Os conceitos das aulas ganham vida em fichas curtas, autores fundamentais e conexões visuais.
          </p>
        </div>

        {/* Micro Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs bg-white/90 text-[#396D82] px-3.5 py-1 rounded-full font-semibold border border-[#CEE7F0]">
            14 conceitos
          </span>
          <span className="text-xs bg-[#FFF5F7] text-[#B94862] px-3.5 py-1 rounded-full font-semibold border border-[#FFD3DD]">
            06 autores
          </span>
          <span className="text-xs bg-[#FFF8F1] text-[#756354] px-3.5 py-1 rounded-full font-semibold border border-[#FFF1E5]">
            03 abordagens
          </span>
        </div>

        {/* Stat Boxes Row */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-3 bg-white/90 rounded-2xl border border-[#CEE7F0] text-center shadow-2xs">
            <p className="font-display font-bold text-sm text-[#40383A]">08 fichas</p>
            <p className="text-[10px] text-[#6D6366] mt-0.5">resumidas</p>
          </div>
          <div className="p-3 bg-white/90 rounded-2xl border border-[#CEE7F0] text-center shadow-2xs">
            <p className="font-display font-bold text-sm text-[#396D82]">03 mapas</p>
            <p className="text-[10px] text-[#6D6366] mt-0.5">conceituais</p>
          </div>
          <div className="p-3 bg-white/90 rounded-2xl border border-[#CEE7F0] text-center shadow-2xs">
            <p className="font-display font-bold text-sm text-[#B94862]">12 citações</p>
            <p className="text-[10px] text-[#6D6366] mt-0.5">salvas</p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setSubTab('autores')}
          className="w-full bg-[#396D82] hover:bg-[#2A5262] text-white py-3 rounded-2xl text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>Explorar acervo completo</span>
        </button>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'autores', label: 'Autores', icon: User },
          { id: 'conceitos', label: 'Conceitos', icon: Sparkles },
          { id: 'abordagens', label: 'Abordagens', icon: Bookmark },
          { id: 'mapa', label: 'Mapa de Conexões', icon: Network },
          { id: 'materiais', label: 'Materiais & PDFs', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = subTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as SubTabBiblioteca)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSel
                  ? 'bg-[#40383A] text-white shadow-xs'
                  : 'bg-white text-[#6D6366] border border-[#E9DFDC] hover:bg-[#FAF8F5]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>


      {/* Filter / Search Bar */}
      {subTab !== 'mapa' && (
        <div className="relative">
          <Search className="w-4 h-4 text-[#918689] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar autores, conceitos..."
            className="w-full bg-white border border-[#E9DFDC] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#40383A] placeholder-[#BEB4B6] focus:outline-none focus:border-[#E97891]"
          />
        </div>
      )}

      {/* Card 2: Conexões em Destaque */}
      <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-3">
        <span className="text-xs text-[#918689] font-semibold tracking-wide uppercase">Pensadores que se cruzam</span>
        
        <h2 className="font-display text-lg sm:text-xl font-bold text-[#40383A]">
          Mapa de conceitos & autores
        </h2>
        
        <p className="text-xs text-[#6D6366]">
          Veja como a TCC se conecta com a Psicopatologia e a Neurociência.
        </p>

        <div className="space-y-3 pt-2">
          {/* Flow Item 1: Rose Tint */}
          <div
            onClick={() => {
              setSubTab('autores');
              setSelectedAuthor(authors[0] || null);
            }}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF5F7] border border-[#FFD3DD] hover:border-[#FFB8C7] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Aaron Beck</h3>
              <p className="text-[11px] text-[#6D6366] mt-0.5">Fundador da TCC · Tríade cognitiva</p>
            </div>
            <span className="text-xs font-semibold text-[#B94862] bg-white px-3 py-1.5 rounded-full border border-[#FFD3DD] shrink-0">
              5 conceitos →
            </span>
          </div>

          {/* Flow Item 2: Blue Tint */}
          <div
            onClick={() => {
              setSubTab('conceitos');
              setSelectedConcept(concepts[0] || null);
            }}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#F3F9FC] border border-[#CEE7F0] hover:border-[#A4D4E3] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Pensamentos Automáticos</h3>
              <p className="text-[11px] text-[#6D6366] mt-0.5">Conceito Chave · Ativação de Crenças</p>
            </div>
            <span className="text-xs font-semibold text-[#396D82] bg-white px-3 py-1.5 rounded-full border border-[#CEE7F0] shrink-0">
              Ver ficha →
            </span>
          </div>

          {/* Flow Item 3: Beige Tint */}
          <div
            onClick={() => setSubTab('conceitos')}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF8F1] border border-[#FFF1E5] hover:border-[#FFE2CC] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Distorções Cognitivas</h3>
              <p className="text-[11px] text-[#6D6366] mt-0.5">Catastrofização · Filtro Mental</p>
            </div>
            <span className="text-xs font-semibold text-[#756354] bg-white px-3 py-1.5 rounded-full border border-[#FFF1E5] shrink-0">
              Ver ficha →
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Seu glossário afetivo */}
      <div className="rounded-[24px] p-6 bg-[#FFF5F7] border border-[#FFD3DD] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-3">
        <span className="text-xs text-[#B94862] font-semibold tracking-wide uppercase">Fichas de Estudo</span>
        
        <h2 className="font-display text-lg sm:text-xl font-bold text-[#40383A]">
          Seu glossário afetivo
        </h2>
        
        <p className="text-xs text-[#6D6366]">
          Fichamento simplificado para consultar antes das provas.
        </p>

        {/* 3 Concept White Cards */}
        <div className="space-y-2 pt-1">
          <div className="p-3.5 bg-white rounded-2xl border border-[#FFD3DD] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#40383A]">Desensibilização Sistemática</p>
              <p className="text-[10px] text-[#6D6366]">Comportamental · Wolpe</p>
            </div>
            <span className="text-xs font-semibold text-[#B94862]">Ver →</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-[#FFD3DD] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#40383A]">Inconsciente Estruturado</p>
              <p className="text-[10px] text-[#6D6366]">Psicanálise · Lacan</p>
            </div>
            <span className="text-xs font-semibold text-[#B94862]">Ver →</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-[#FFD3DD] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#40383A]">Aliança Terapêutica</p>
              <p className="text-[10px] text-[#6D6366]">Humanista · Carl Rogers</p>
            </div>
            <span className="text-xs font-semibold text-[#B94862]">Ver →</span>
          </div>
        </div>
      </div>

      {/* SUBTAB CONTENT LISTS */}
      {subTab === 'autores' && (
        <div className="space-y-3">
          {authors
            .filter((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.bio.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((author) => {
              const approach = approaches.find((app) => app.id === author.approachId);

              return (
                <div
                  key={author.id}
                  onClick={() => setSelectedAuthor(author)}
                  className="rounded-[24px] p-5 bg-white border border-[#E9DFDC] space-y-2 hover:border-[#FFD3DD] cursor-pointer transition-all shadow-[0_2px_8px_rgba(64,56,58,0.05)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-base text-[#40383A]">
                        {author.name}
                      </h3>
                      <p className="text-xs text-[#918689]">{author.lifespan}</p>
                    </div>

                    {approach && (
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF5F7] text-[#B94862] border border-[#FFD3DD]">
                        {approach.shortName}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#6D6366] line-clamp-2 leading-relaxed bg-[#FAF8F5] p-3 rounded-2xl border border-[#F2EBE8]">
                    {author.bio}
                  </p>
                </div>
              );
            })}
        </div>
      )}

      {subTab === 'conceitos' && (
        <div className="space-y-3">
          {concepts
            .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.definition.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((concept) => (
              <div
                key={concept.id}
                onClick={() => setSelectedConcept(concept)}
                className="rounded-[24px] p-5 bg-white border border-[#E9DFDC] space-y-2 hover:border-[#FFD3DD] cursor-pointer transition-all shadow-[0_2px_8px_rgba(64,56,58,0.05)]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#40383A]">
                    {concept.name}
                  </h3>
                  <Sparkles className="w-4 h-4 text-[#E97891]" />
                </div>

                <p className="text-xs text-[#6D6366] leading-relaxed bg-[#FAF8F5] p-3 rounded-2xl border border-[#F2EBE8]">
                  {concept.definition}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Author Detail Modal */}
      {selectedAuthor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-[24px] border border-[#E9DFDC] shadow-2xl p-6 text-[#40383A] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2EBE8] pb-3">
              <div>
                <span className="text-xs font-bold text-[#E97891]">{selectedAuthor.lifespan}</span>
                <h3 className="font-display font-bold text-lg">{selectedAuthor.name}</h3>
              </div>
              <button
                onClick={() => setSelectedAuthor(null)}
                className="text-xs bg-[#FAF8F5] border border-[#E9DFDC] p-2 rounded-full cursor-pointer text-[#40383A]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6D6366] leading-relaxed bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#F2EBE8]">
              {selectedAuthor.bio}
            </p>

            <button
              onClick={() => setSelectedAuthor(null)}
              className="w-full bg-[#E97891] hover:bg-[#D85F79] text-white py-2.5 rounded-2xl text-xs font-semibold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
