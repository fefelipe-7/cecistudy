import React, { useState, useMemo } from 'react';
import { Search, X, BookOpen, Brain, Sparkles, User, GraduationCap, ChevronRight } from 'lucide-react';
import { Modal } from './ui/Modal';
import {
  Course,
  ClassNote,
  PsychologyAuthor,
  PsychologyConcept,
  PsychologyApproach,
  ReadingItem,
  NavTab
} from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  classes: ClassNote[];
  authors: PsychologyAuthor[];
  concepts: PsychologyConcept[];
  approaches: PsychologyApproach[];
  readings: ReadingItem[];
  onNavigate: (tab: NavTab, subTab?: string, targetId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  courses,
  classes,
  authors,
  concepts,
  approaches,
  readings,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: {
      id: string;
      title: string;
      subtitle: string;
      type: 'concept' | 'author' | 'course' | 'class' | 'reading' | 'approach';
      badge: string;
      tab: NavTab;
      subTab: string;
    }[] = [];

    // Search Concepts
    concepts.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q))) {
        results.push({
          id: c.id,
          title: c.name,
          subtitle: c.definition.slice(0, 70) + '...',
          type: 'concept',
          badge: 'conceito',
          tab: 'biblioteca',
          subTab: 'conceitos'
        });
      }
    });

    // Search Authors
    authors.forEach((a) => {
      if (a.name.toLowerCase().includes(q) || a.bio.toLowerCase().includes(q) || a.keyConcepts.some(kc => kc.toLowerCase().includes(q))) {
        results.push({
          id: a.id,
          title: a.name,
          subtitle: a.bio.slice(0, 70) + '...',
          type: 'author',
          badge: 'autor',
          tab: 'biblioteca',
          subTab: 'autores'
        });
      }
    });

    // Search Courses
    courses.forEach((co) => {
      if (co.name.toLowerCase().includes(q) || co.professor.toLowerCase().includes(q) || (co.description && co.description.toLowerCase().includes(q))) {
        results.push({
          id: co.id,
          title: co.name,
          subtitle: `prof.ª ${co.professor} • ${co.semester}`,
          type: 'course',
          badge: 'disciplina',
          tab: 'faculdade',
          subTab: 'disciplinas'
        });
      }
    });

    // Search Class Notes
    classes.forEach((cl) => {
      if (cl.title.toLowerCase().includes(q) || cl.summary.toLowerCase().includes(q) || (cl.fullNotes && cl.fullNotes.toLowerCase().includes(q))) {
        results.push({
          id: cl.id,
          title: cl.title,
          subtitle: `aula ${cl.number} • ${cl.summary.slice(0, 60)}...`,
          type: 'class',
          badge: 'aula',
          tab: 'faculdade',
          subTab: 'aulas'
        });
      }
    });

    // Search Readings
    readings.forEach((r) => {
      if (r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)) {
        results.push({
          id: r.id,
          title: r.title,
          subtitle: `por ${r.author} • ${r.status === 'concluido' ? 'concluído' : 'em leitura'}`,
          type: 'reading',
          badge: 'leitura',
          tab: 'estudos',
          subTab: 'leituras'
        });
      }
    });

    // Search Approaches
    approaches.forEach((app) => {
      if (app.name.toLowerCase().includes(q) || app.shortName.toLowerCase().includes(q) || app.description.toLowerCase().includes(q)) {
        results.push({
          id: app.id,
          title: app.name,
          subtitle: app.description.slice(0, 70) + '...',
          type: 'approach',
          badge: 'abordagem',
          tab: 'biblioteca',
          subTab: 'abordagens'
        });
      }
    });

    return results;
  }, [query, concepts, authors, courses, classes, readings, approaches]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      position="top"
      className="w-full max-w-2xl bg-canvas rounded-3xl border border-ceci-border-default shadow-2xl overflow-hidden text-ceci-primary"
    >
        
        {/* Search Bar Input */}
        <div className="p-4 border-b border-ceci-border-subtle flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-ceci-brand-soft" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="digite para buscar (ex: ansiedade, beck, freud, tcc, psicopatologia...)"
            className="w-full bg-transparent text-sm sm:text-base focus:outline-none placeholder:text-ceci-faded text-ceci-primary"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="touch-target p-1 rounded-full hover:bg-surface-muted text-ceci-faded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs bg-beige-100 hover:bg-beige-200 text-ceci-primary px-3 py-1.5 rounded-xl font-medium transition-colors min-h-[36px]"
          >
            fechar
          </button>
        </div>

        {/* Quick Tag Suggestions if search is empty */}
        {!query && (
          <div className="p-5 text-center sm:text-left">
            <p className="text-xs font-semibold lowercase tracking-wider text-ceci-tertiary mb-3">
              sugestões rápidas no cecistudy ♡
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {['ansiedade', 'aaron beck', 'freud', 'tcc', 'depressão', 'htp', 'acolhimento', 'vygotsky'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1.5 rounded-full bg-white border border-ceci-border-default text-xs text-ceci-primary hover:bg-surface-rose hover:border-ceci-border-brand transition-colors cursor-pointer"
                >
                  ✨ {tag}
                </button>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-ceci-border-subtle text-center text-xs text-ceci-secondary">
              busca tudo que você anota: conceitos, autores, leituras, aulas e disciplinas ♡
            </div>
          </div>
        )}

        {/* Results List */}
        {query && (
          <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-ceci-border-subtle">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-ceci-secondary">
                <p className="font-display text-base text-ceci-primary mb-1">nenhum resultado encontrado para "{query}"</p>
                <p className="text-xs">tente pesquisar por autores (ex: beck), transtornos ou técnicas.</p>
              </div>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.tab, item.subTab, item.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-surface-rose/50 cursor-pointer tap-interactive group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-rose group-hover:bg-ceci-border-brand flex items-center justify-center text-ceci-primary transition-colors">
                      {item.type === 'concept' && <Sparkles className="w-4 h-4 text-ceci-primary" />}
                      {item.type === 'author' && <User className="w-4 h-4 text-ceci-primary" />}
                      {item.type === 'course' && <GraduationCap className="w-4 h-4 text-ceci-primary" />}
                      {item.type === 'class' && <Brain className="w-4 h-4 text-ceci-primary" />}
                      {item.type === 'reading' && <BookOpen className="w-4 h-4 text-ceci-primary" />}
                      {item.type === 'approach' && <Sparkles className="w-4 h-4 text-ceci-primary" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ceci-primary group-hover:text-ceci-brand-strong transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-blue text-ceci-academic-strong font-medium border border-ceci-border-academic">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-ceci-secondary line-clamp-1">{item.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ceci-tertiary group-hover:text-ceci-primary group-hover:translate-x-0.5 tap-interactive" />
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
  );
};
