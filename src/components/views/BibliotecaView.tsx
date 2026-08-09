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
          <p className="text-[11px] font-semibold tracking-wider text-[#96888C] uppercase">Conhecimento Organizado</p>
          <h1 className="font-serif-display text-2xl sm:text-3xl text-[#3D3336] font-bold mt-0.5 tracking-tight">
            Biblioteca Ceci <span className="text-[#E26D8B] font-normal">♡</span>
          </h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#E6F0F7] border border-[#CEE1EF] flex items-center justify-center text-[#33627E] font-serif-display font-bold text-lg shadow-2xs">
          B
        </div>
      </div>

      {/* Hero Card: Sua estante viva */}
      <div className="journal-card p-6 bg-gradient-to-br from-[#E6F0F7]/80 via-white to-[#FFEAF0]/60 border border-[#CEE1EF] relative overflow-hidden space-y-4">
        <div>
          <span className="text-[11px] font-bold text-[#33627E] uppercase tracking-wider bg-white/90 px-3 py-1 rounded-full border border-[#CEE1EF] shadow-2xs">
            Sua estante viva ♡
          </span>
          <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[#3D3336] mt-2">
            Aprenda com método, salve com afeto ✨
          </h2>
          <p className="text-xs text-[#6B5E62] mt-1.5 leading-relaxed">
            Os conceitos das aulas ganham vida em fichas curtas, autores fundamentais e conexões visuais.
          </p>
        </div>

        {/* Micro Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs bg-white/90 text-[#33627E] px-3.5 py-1 rounded-full font-semibold border border-[#CEE1EF]">
            14 conceitos
          </span>
          <span className="text-xs bg-[#FFEAF0] text-[#CE5373] px-3.5 py-1 rounded-full font-semibold border border-[#FFD4E0]">
            06 autores
          </span>
          <span className="text-xs bg-[#FFF7EC] text-[#9E6B38] px-3.5 py-1 rounded-full font-semibold border border-[#FFF0DB]">
            03 abordagens
          </span>
        </div>

        {/* Stat Boxes Row */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-3 bg-white/90 rounded-2xl border border-[#CEE1EF] text-center shadow-2xs">
            <p className="font-serif-display font-bold text-sm text-[#3D3336]">08 fichas</p>
            <p className="text-[10px] text-[#6B5E62] mt-0.5">resumidas</p>
          </div>
          <div className="p-3 bg-white/90 rounded-2xl border border-[#CEE1EF] text-center shadow-2xs">
            <p className="font-serif-display font-bold text-sm text-[#33627E]">03 mapas</p>
            <p className="text-[10px] text-[#6B5E62] mt-0.5">conceituais</p>
          </div>
          <div className="p-3 bg-white/90 rounded-2xl border border-[#CEE1EF] text-center shadow-2xs">
            <p className="font-serif-display font-bold text-sm text-[#CE5373]">12 citações</p>
            <p className="text-[10px] text-[#6B5E62] mt-0.5">salvas</p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setSubTab('autores')}
          className="w-full bg-[#4B85A6] hover:bg-[#33627E] text-white py-3 rounded-2xl text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 min-h-[44px]"
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
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSel
                  ? 'bg-[#2D2628] text-white shadow-2xs'
                  : 'bg-white text-[#5C5255] border border-[#E8E1D9] hover:bg-[#FAF7F2]'
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
          <Search className="w-4 h-4 text-[#82787A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar autores, conceitos..."
            className="w-full bg-white border border-[#E8DEDB] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#40383A] placeholder-[#82787A] focus:outline-none focus:border-[#EA718F]"
          />
        </div>
      )}

      {/* Card 2: Conexões em Destaque (Exact Image 3) */}
      <div className="rounded-[28px] p-6 bg-white border border-[#E8DEDB] shadow-sm space-y-3">
        <span className="text-xs text-[#82787A] font-semibold tracking-wide uppercase">Pensadores que se cruzam</span>
        
        <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#40383A]">
          Mapa de conceitos & autores
        </h2>
        
        <p className="text-xs text-[#6F6568]">
          Veja como a TCC se conecta com a Psicopatologia e a Neurociência.
        </p>

        <div className="space-y-3 pt-2">
          {/* Flow Item 1: Pink Tint */}
          <div
            onClick={() => {
              setSubTab('autores');
              setSelectedAuthor(authors[0] || null);
            }}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#FFE7ED] border border-[#FFD1DC] hover:border-[#EA718F] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Aaron Beck</h3>
              <p className="text-[11px] text-[#6F6568] mt-0.5">Fundador da TCC · Tríade cognitiva</p>
            </div>
            <span className="text-xs font-semibold text-[#B94763] bg-white px-3 py-1.5 rounded-full border border-[#FFD1DC] shrink-0">
              5 conceitos →
            </span>
          </div>

          {/* Flow Item 2: Blue Tint */}
          <div
            onClick={() => {
              setSubTab('conceitos');
              setSelectedConcept(concepts[0] || null);
            }}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#E4F1F8] border border-[#CDE6F2] hover:border-[#32677F] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Pensamentos Automáticos</h3>
              <p className="text-[11px] text-[#6F6568] mt-0.5">Conceito Chave · Ativação de Crenças</p>
            </div>
            <span className="text-xs font-semibold text-[#32677F] bg-white px-3 py-1.5 rounded-full border border-[#CDE6F2] shrink-0">
              Ver ficha →
            </span>
          </div>

          {/* Flow Item 3: Beige Tint */}
          <div
            onClick={() => setSubTab('conceitos')}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF2E5] border border-[#F2D7C2] hover:border-[#8C522B] cursor-pointer transition-all"
          >
            <div>
              <h3 className="font-semibold text-xs text-[#40383A]">Distorções Cognitivas</h3>
              <p className="text-[11px] text-[#6F6568] mt-0.5">Catastrofização · Filtro Mental</p>
            </div>
            <span className="text-xs font-semibold text-[#8C522B] bg-white px-3 py-1.5 rounded-full border border-[#F2D7C2] shrink-0">
              Ver ficha →
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Seu glossário afetivo (Exact Image 3) */}
      <div className="rounded-[28px] p-6 bg-[#FFE7ED] border border-[#FFD1DC] shadow-sm space-y-3">
        <span className="text-xs text-[#A64B62] font-semibold tracking-wide uppercase">Fichas de Estudo</span>
        
        <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#40383A]">
          Seu glossário afetivo
        </h2>
        
        <p className="text-xs text-[#6F6568]">
          Fichamento simplificado para consultar antes das provas.
        </p>

        {/* 3 Concept White Cards */}
        <div className="space-y-2 pt-1">
          <div className="p-3.5 bg-white rounded-2xl border border-[#FFD1DC] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#40383A]">Desensibilização Sistemática</p>
              <p className="text-[10px] text-[#6F6568]">Comportamental · Wolpe</p>
            </div>
            <span className="text-xs font-semibold text-[#B94763]">Ver →</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-[#FFD1DC] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#40383A]">Inconsciente Estruturado</p>
              <p className="text-[10px] text-[#6F6568]">Psicanálise · Lacan</p>
            </div>
            <span className="text-xs font-semibold text-[#B94763]">Ver →</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-[#FFD1DC] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#40383A]">Aliança Terapêutica</p>
              <p className="text-[10px] text-[#6F6568]">Humanista · Carl Rogers</p>
            </div>
            <span className="text-xs font-semibold text-[#B94763]">Ver →</span>
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
                  className="rounded-[28px] p-5 bg-white border border-[#E8DEDB] space-y-2 hover:border-[#EA718F] cursor-pointer transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif-display font-bold text-base text-[#40383A]">
                        {author.name}
                      </h3>
                      <p className="text-xs text-[#82787A]">{author.lifespan}</p>
                    </div>

                    {approach && (
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FFE7ED] text-[#B94763] border border-[#FFD1DC]">
                        {approach.shortName}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#6F6568] line-clamp-2 leading-relaxed bg-[#FAF5EF] p-3 rounded-2xl">
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
                className="rounded-[28px] p-5 bg-white border border-[#E8DEDB] space-y-2 hover:border-[#EA718F] cursor-pointer transition-all shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif-display font-bold text-base text-[#40383A]">
                    {concept.name}
                  </h3>
                  <Sparkles className="w-4 h-4 text-[#EA718F]" />
                </div>

                <p className="text-xs text-[#6F6568] leading-relaxed bg-[#FAF5EF] p-3 rounded-2xl">
                  {concept.definition}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Author Detail Modal */}
      {selectedAuthor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-[28px] border border-[#E8DEDB] shadow-2xl p-6 text-[#40383A] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DEDB] pb-3">
              <div>
                <span className="text-xs font-bold text-[#EA718F]">{selectedAuthor.lifespan}</span>
                <h3 className="font-serif-display font-bold text-lg">{selectedAuthor.name}</h3>
              </div>
              <button
                onClick={() => setSelectedAuthor(null)}
                className="text-xs bg-[#FAF5EF] border border-[#E8DEDB] p-2 rounded-full"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6F6568] leading-relaxed bg-[#FAF5EF] p-3.5 rounded-2xl">
              {selectedAuthor.bio}
            </p>

            <button
              onClick={() => setSelectedAuthor(null)}
              className="w-full bg-[#EA718F] text-white py-2.5 rounded-2xl text-xs font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
