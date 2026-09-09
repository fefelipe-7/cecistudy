import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Check,
  Play,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Pause,
  RotateCcw,
  Sparkles,
  Edit3,
  Bookmark,
  BookOpen,
  GraduationCap,
  Users,
  Target,
  FileText,
} from 'lucide-react';
import { CalendarItem, LayerConfig, Etapa } from '../types';
import {
  formatDatePtBR,
  formatDurationWithBlocks,
  parseTimeToMinutes,
} from '../utils/dateUtils';

interface EventDetailModalProps {
  item: CalendarItem | null;
  layers: LayerConfig[];
  onClose: () => void;
  onUpdateItem: (updatedItem: CalendarItem) => void;
  onDeleteItem: (itemId: string) => void;
  onStartTimer: (item: CalendarItem) => void;
  onOpenReschedule: (item: CalendarItem) => void;
  onOpenEditModal: (item: CalendarItem) => void;
  activeTimerItemId?: string | null;
  activeTimerSeconds?: number;
  onStopTimer?: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  item,
  layers,
  onClose,
  onUpdateItem,
  onDeleteItem,
  onStartTimer,
  onOpenReschedule,
  onOpenEditModal,
  activeTimerItemId,
  activeTimerSeconds = 0,
  onStopTimer,
}) => {
  const [newEtapaTitle, setNewEtapaTitle] = useState('');
  const [isAddingEtapa, setIsAddingEtapa] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    if (item) {
      setNotesText(item.notes || '');
      setIsEditingNotes(false);
      setIsAddingEtapa(false);
      setNewEtapaTitle('');
    }
  }, [item?.id]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const currentLayer = layers.find((l) => l.id === item.layer) || layers[0];
  const completedEtapas = item.etapas?.filter((e) => e.completed).length || 0;
  const totalEtapas = item.etapas?.length || 0;
  const progressPercent = totalEtapas > 0 ? (completedEtapas / totalEtapas) * 100 : 0;
  const isTimerRunning = activeTimerItemId === item.id;

  const durationMins = item.isAllDay
    ? 0
    : Math.max(parseTimeToMinutes(item.endTime) - parseTimeToMinutes(item.startTime), 30);

  // Toggle etapa checkbox
  const handleToggleEtapa = (etapaId: string) => {
    const updatedEtapas = item.etapas.map((et) =>
      et.id === etapaId ? { ...et, completed: !et.completed } : et
    );
    onUpdateItem({
      ...item,
      etapas: updatedEtapas,
    });
  };

  // Add new etapa
  const handleAddEtapa = () => {
    if (!newEtapaTitle.trim()) return;
    const newEtapa: Etapa = {
      id: `et-${Date.now()}`,
      title: newEtapaTitle.trim(),
      completed: false,
    };
    onUpdateItem({
      ...item,
      etapas: [...(item.etapas || []), newEtapa],
    });
    setNewEtapaTitle('');
    setIsAddingEtapa(false);
  };

  // Save notes
  const handleSaveNotes = () => {
    onUpdateItem({
      ...item,
      notes: notesText,
    });
    setIsEditingNotes(false);
  };

  // Change status
  const handleToggleStatus = (status: CalendarItem['status']) => {
    onUpdateItem({
      ...item,
      status,
    });
  };

  const getStatusBadge = (status: CalendarItem['status']) => {
    switch (status) {
      case 'concluido':
        return {
          label: 'Concluído',
          bg: 'bg-[#F2FAF5] text-[#356647] border-[#C2E8D0]',
        };
      case 'em_andamento':
        return {
          label: 'Em Andamento',
          bg: 'bg-[#FFF5F7] text-[#D85F79] border-[#FFD3DD]',
        };
      case 'planejado':
        return {
          label: 'Planejado',
          bg: 'bg-[#FAF8F5] text-[#6D6366] border-[#E9DFDC]',
        };
      case 'adiado':
        return {
          label: 'Adiado',
          bg: 'bg-[#FFF9ED] text-[#96702B] border-[#FCE4A8]',
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          bg: 'bg-[#FFF5F4] text-[#A8514B] border-[#FACCC8]',
        };
      default:
        return {
          label: 'Planejado',
          bg: 'bg-[#FAF8F5] text-[#6D6366] border-[#E9DFDC]',
        };
    }
  };

  const formatTimerDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const statusInfo = getStatusBadge(item.status);

  return (
    <div
      id="event-detail-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Central Modal Container */}
      <div
        id="event-detail-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E9DFDC] rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#F2EBE8] bg-[#FFFCF8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs"
              style={{
                backgroundColor: currentLayer.badgeBg,
                color: currentLayer.badgeText,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: currentLayer.color }}
              />
              {currentLayer.name}
            </span>

            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenEditModal(item)}
              className="p-1.5 text-[#918689] hover:text-[#40383A] hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer"
              title="Editar detalhes completos"
            >
              <Edit3 size={15} />
            </button>
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir esta atividade?')) {
                  onDeleteItem(item.id);
                  onClose();
                }
              }}
              className="p-1.5 text-[#ADA3A5] hover:text-[#D85F79] hover:bg-[#FFF5F7] rounded-xl transition-colors cursor-pointer"
              title="Excluir atividade"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#918689] hover:text-[#40383A] hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer ml-1"
              title="Fechar (ESC)"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-1">
          {/* Title & Warning */}
          <div>
            <h2 className="text-xl font-bold font-display text-[#40383A] leading-snug">
              {item.title}
            </h2>
            {item.hasWarning && (
              <div className="mt-2.5 p-3 rounded-2xl bg-[#FFF5F7] border border-[#FFD3DD] flex items-start gap-2 text-xs text-[#71303F]">
                <AlertCircle size={15} className="text-[#D85F79] shrink-0 mt-0.5" />
                <div className="font-medium leading-relaxed">{item.warningText}</div>
              </div>
            )}
          </div>

          {/* Time & Date Banner */}
          <div className="p-3.5 bg-[#FAF8F5] border border-[#E9DFDC] rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E9DFDC] flex items-center justify-center text-[#D85F79] shadow-2xs">
                <CalendarIcon size={15} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#40383A]">
                  {formatDatePtBR(item.date)}
                </div>
                <div className="text-[11px] font-mono text-[#918689]">
                  {item.isAllDay
                    ? 'Dia inteiro (Prazo final)'
                    : `${item.startTime} — ${item.endTime} (${formatDurationWithBlocks(durationMins)})`}
                </div>
              </div>
            </div>

            {/* Quick Status Toggle */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-[#E9DFDC]">
              <button
                onClick={() =>
                  handleToggleStatus(item.status === 'concluido' ? 'planejado' : 'concluido')
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  item.status === 'concluido'
                    ? 'bg-[#F2FAF5] text-[#356647] border border-[#C2E8D0]'
                    : 'text-[#6D6366] hover:bg-[#FAF8F5]'
                }`}
              >
                <CheckCircle2 size={13} className={item.status === 'concluido' ? 'text-[#5A9F76]' : ''} />
                <span>{item.status === 'concluido' ? 'Concluído' : 'Marcar Concluído'}</span>
              </button>
            </div>
          </div>

          {/* Etapas / Subtarefas Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#40383A] uppercase tracking-wider">
                  Etapas do Estudo
                </span>
                {totalEtapas > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#FAF8F5] border border-[#E9DFDC] text-[#6D6366]">
                    {completedEtapas}/{totalEtapas}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsAddingEtapa(true)}
                className="text-xs font-bold text-[#D85F79] hover:text-[#B94862] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Adicionar Etapa</span>
              </button>
            </div>

            {/* Progress Bar */}
            {totalEtapas > 0 && (
              <div className="w-full h-1.5 bg-[#F2EBE8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5A9F76] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Etapas List */}
            <div className="flex flex-col gap-1.5 mt-1">
              {item.etapas && item.etapas.length > 0 ? (
                item.etapas.map((etapa) => (
                  <div
                    key={etapa.id}
                    onClick={() => handleToggleEtapa(etapa.id)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-[#E9DFDC] hover:bg-[#FAF8F5] transition-colors cursor-pointer group shadow-2xs"
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                        etapa.completed
                          ? 'bg-[#5A9F76] border-[#5A9F76] text-white'
                          : 'border-[#ADA3A5] bg-white group-hover:border-[#D85F79]'
                      }`}
                    >
                      {etapa.completed && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        etapa.completed
                          ? 'line-through text-[#ADA3A5]'
                          : 'text-[#40383A]'
                      }`}
                    >
                      {etapa.title}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#ADA3A5] italic py-1">
                  Nenhuma etapa cadastrada ainda.
                </div>
              )}

              {/* Add Etapa Input */}
              {isAddingEtapa && (
                <div className="flex items-center gap-1.5 mt-1 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Nome da etapa ou página..."
                    value={newEtapaTitle}
                    onChange={(e) => setNewEtapaTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEtapa()}
                    autoFocus
                    className="flex-1 px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E9DFDC] rounded-xl text-[#40383A] focus:outline-hidden focus:border-[#D85F79]"
                  />
                  <button
                    onClick={handleAddEtapa}
                    className="px-3 py-1.5 bg-[#40383A] text-white rounded-xl text-xs font-bold hover:bg-[#252021] transition-colors cursor-pointer"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsAddingEtapa(false)}
                    className="px-2 py-1.5 text-xs text-[#918689] hover:text-[#40383A] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#40383A] uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} className="text-[#918689]" />
                Anotações Acadêmicas
              </span>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs font-bold text-[#918689] hover:text-[#40383A] transition-colors cursor-pointer"
                >
                  Editar
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Instruções da matéria, referências de leitura, links..."
                  rows={4}
                  className="w-full p-3 text-xs bg-[#FAF8F5] border border-[#E9DFDC] rounded-2xl text-[#40383A] focus:outline-hidden focus:border-[#D85F79] resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsEditingNotes(false)}
                    className="px-3 py-1 text-xs text-[#918689] hover:text-[#40383A] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1 bg-[#40383A] text-white rounded-xl text-xs font-bold hover:bg-[#252021] transition-colors cursor-pointer"
                  >
                    Salvar Notas
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#FAF8F5] border border-[#E9DFDC] rounded-2xl text-xs text-[#6D6366] leading-relaxed whitespace-pre-wrap min-h-[60px]">
                {item.notes ? (
                  item.notes
                ) : (
                  <span className="text-[#ADA3A5] italic">
                    Sem anotações cadastradas. Clique em editar para adicionar referências ou observações da mentoria.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-[#F2EBE8] bg-[#FFFCF8] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Reagendar com Ceci AI */}
          <button
            onClick={() => onOpenReschedule(item)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FFFDF0] hover:bg-[#FFF8E9] text-[#BD913C] border border-[#FCE4A8] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Sparkles size={13} />
            <span>Reagendar com Ceci AI</span>
          </button>

          {/* Start / Stop Focus Timer Button */}
          <div className="flex items-center gap-2">
            {isTimerRunning ? (
              <button
                onClick={onStopTimer}
                className="flex items-center gap-2 px-4 py-2 bg-[#D85F79] hover:bg-[#B94862] text-white rounded-xl text-xs font-bold transition-all shadow-xs animate-pulse cursor-pointer"
              >
                <Pause size={14} />
                <span>Pausar Foco ({formatTimerDuration(activeTimerSeconds)})</span>
              </button>
            ) : (
              <button
                onClick={() => onStartTimer(item)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#5A9F76] hover:bg-[#46825E] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Play size={13} fill="currentColor" />
                <span>Iniciar Sessão Pomodoro</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
