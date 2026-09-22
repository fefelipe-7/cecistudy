import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Layers,
  Bookmark,
  GraduationCap,
  FileText,
  BookOpen,
} from 'lucide-react';
import {
  CalendarItem,
  ItemType,
  SubCategory,
  LayerType,
  CommitmentLevel,
  ItemStatus,
  Etapa,
} from '../types';
import { parseTimeToMinutes, minutesToTime } from '../utils/dateUtils';

interface ItemModalProps {
  isOpen: boolean;
  initialDate?: string;
  initialTime?: string;
  editItem?: CalendarItem | null;
  onClose: () => void;
  onSave: (item: CalendarItem) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  initialDate = '2025-01-15',
  initialTime = '08:00',
  editItem,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<ItemType>(editItem?.type || 'bloco');
  const [title, setTitle] = useState(editItem?.title || '');
  const [category, setCategory] = useState<SubCategory>(editItem?.category || 'estudo');
  const [layer, setLayer] = useState<LayerType>(editItem?.layer || 'estudos');
  const [commitment, setCommitment] = useState<CommitmentLevel>(
    editItem?.commitment || 'recomendado'
  );
  const [status, setStatus] = useState<ItemStatus>(editItem?.status || 'planejado');
  const [date, setDate] = useState(editItem?.date || initialDate);
  const [startTime, setStartTime] = useState(editItem?.startTime || initialTime);
  const [endTime, setEndTime] = useState(
    editItem?.endTime || minutesToTime(parseTimeToMinutes(initialTime) + 60)
  );
  const [isAllDay, setIsAllDay] = useState(editItem?.isAllDay || false);
  const [notes, setNotes] = useState(editItem?.notes || '');
  const [etapas, setEtapas] = useState<Etapa[]>(editItem?.etapas || []);
  const [newEtapaText, setNewEtapaText] = useState('');
  const [recurrenceFreq, setRecurrenceFreq] = useState<'none' | 'weekly'>('none');

  const handleAddEtapa = () => {
    if (!newEtapaText.trim()) return;
    setEtapas([
      ...etapas,
      { id: `et-${Date.now()}`, title: newEtapaText.trim(), completed: false },
    ]);
    setNewEtapaText('');
  };

  const handleRemoveEtapa = (id: string) => {
    setEtapas(etapas.filter((e) => e.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startMins = parseTimeToMinutes(startTime);
    const endMins = parseTimeToMinutes(endTime);
    const plannedDuration = Math.max(endMins - startMins, 30);

    const categoryLabels: Record<SubCategory, string> = {
      aula: 'Aula',
      prova: 'Prova',
      apresentacao: 'Apresentação',
      reuniao: 'Reunião',
      estudo: 'Estudo',
      revisao: 'Revisão',
      bloco_tcc: 'Bloco TCC',
      leitura: 'Leitura',
      entrega: 'Entrega',
      externo: 'Externo',
      outro: 'Geral',
    };

    const newItem: CalendarItem = {
      id: editItem?.id || `item-${Date.now()}`,
      title: title.trim(),
      type,
      category,
      categoryLabel: categoryLabels[category] || 'Atividade',
      layer,
      commitment,
      status,
      date,
      startTime,
      endTime,
      isAllDay,
      plannedDurationMinutes: plannedDuration,
      etapas,
      links: editItem?.links || [
        {
          id: `lnk-${Date.now()}`,
          type: layer === 'tcc' ? 'tcc' : layer === 'faculdade' ? 'faculdade' : 'estudos',
          title:
            layer === 'tcc'
              ? 'TCC • Documento de Trabalho'
              : layer === 'faculdade'
              ? 'Faculdade • Módulo Acadêmico'
              : 'Estudos • Fila de Revisão',
        },
      ],
      notes: notes.trim(),
      hasWarning: category === 'prova',
      warningText: category === 'prova' ? 'Avaliação acadêmica obrigatória' : undefined,
      recurrence:
        recurrenceFreq === 'weekly'
          ? { frequency: 'weekly', daysOfWeek: [1, 3], startDate: date }
          : undefined,
      googleCalendarSync: {
        synced: true,
        lastSyncedAt: new Date().toISOString(),
        source: 'cecistudy',
      },
    };

    onSave(newItem);
    onClose();
  };

  return (
    <div
      id="item-modal-overlay"
      className="fixed inset-0 z-50 bg-[#40383A]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E9DFDC] overflow-hidden my-8 select-none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E9DFDC] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold font-display text-[#40383A]">
              {editItem ? 'Editar Atividade' : 'Novo Item no Calendário'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#918689] hover:text-[#40383A] hover:bg-[#F2EBE8] rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {/* Item Type Switcher */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[#40383A] uppercase tracking-wider text-[10px]">
              Tipo de Entidade
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('evento');
                  setCategory('aula');
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                  type === 'evento'
                    ? 'bg-[#F3F9FC] border-[#4A879F] text-[#284955] ring-2 ring-[#83BCD0]/30'
                    : 'border-[#E9DFDC] hover:bg-[#FAF8F5] text-[#6D6366]'
                }`}
              >
                📅 Evento
                <span className="block text-[10px] font-normal text-[#918689] mt-0.5">
                  Aula, Prova, Reunião
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('bloco');
                  setCategory('estudo');
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                  type === 'bloco'
                    ? 'bg-[#FFF5F7] border-[#D85F79] text-[#71303F] ring-2 ring-[#FFB8C7]/30'
                    : 'border-[#E9DFDC] hover:bg-[#FAF8F5] text-[#6D6366]'
                }`}
              >
                ⏱ Bloco Foco
                <span className="block text-[10px] font-normal text-[#918689] mt-0.5">
                  Reserva de tempo
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('responsabilidade');
                  setCategory('entrega');
                  setIsAllDay(true);
                }}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                  type === 'responsabilidade'
                    ? 'bg-[#F2FAF5] border-[#5A9F76] text-[#2A513A] ring-2 ring-[#A8D8B9]/30'
                    : 'border-[#E9DFDC] hover:bg-[#FAF8F5] text-[#6D6366]'
                }`}
              >
                📝 Entrega / Prazo
                <span className="block text-[10px] font-normal text-[#918689] mt-0.5">
                  Trabalho, Entrega
                </span>
              </button>
            </div>
          </div>

          {/* Title input */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-[#40383A] text-xs">
              Título da Atividade *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Escrita TCC — Cap. 2, Aula de Cálculo, Revisão..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 text-sm border border-[#E9DFDC] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#FFD3DD] focus:border-[#D85F79] text-[#40383A]"
            />
          </div>

          {/* Layer & Category Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#40383A] text-xs">Camada</label>
              <select
                value={layer}
                onChange={(e) => setLayer(e.target.value as LayerType)}
                className="px-3 py-2 border border-[#E9DFDC] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#FFD3DD] bg-white text-[#40383A]"
              >
                <option value="faculdade">🟦 Faculdade</option>
                <option value="tcc">🟪 TCC</option>
                <option value="estudos">🟩 Estudos</option>
                <option value="marketing">🟨 Marketing / Projetos</option>
                <option value="google_calendar">🟧 Google Calendar</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#40383A] text-xs">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SubCategory)}
                className="px-3 py-2 border border-[#E9DFDC] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#FFD3DD] bg-white text-[#40383A]"
              >
                <option value="aula">Aula</option>
                <option value="prova">Prova</option>
                <option value="bloco_tcc">Bloco TCC</option>
                <option value="estudo">Estudo / Foco</option>
                <option value="revisao">Revisão / Flashcards</option>
                <option value="reuniao">Reunião / Orientação</option>
                <option value="entrega">Entrega de Trabalho</option>
                <option value="externo">Compromisso Externo</option>
              </select>
            </div>
          </div>

          {/* Date, Time & All Day */}
          <div className="flex flex-col gap-2.5 p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E9DFDC]">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#40383A] text-xs">
                Data & Horário
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[#6D6366] font-medium text-xs">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="rounded text-[#D85F79] focus:ring-[#FFD3DD]"
                />
                <span>Dia inteiro / Prazo</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-2.5 py-1.5 border border-[#E9DFDC] rounded-xl bg-white text-[#40383A] text-xs"
              />
              {!isAllDay && (
                <>
                  <input
                    type="time"
                    step="1800"
                    value={startTime}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setStartTime(newStart);
                      const currentDur = Math.max(parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime), 30);
                      setEndTime(minutesToTime(parseTimeToMinutes(newStart) + currentDur));
                    }}
                    className="px-2.5 py-1.5 border border-[#E9DFDC] rounded-xl bg-white text-[#40383A] text-xs font-mono"
                  />
                  <input
                    type="time"
                    step="1800"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="px-2.5 py-1.5 border border-[#E9DFDC] rounded-xl bg-white text-[#40383A] text-xs font-mono"
                  />
                </>
              )}
            </div>

            {/* Quick 30-Minute Preset Duration Buttons */}
            {!isAllDay && (
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#918689]">
                  Faixas de Tempo (30 em 30 min):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: '30m (1 bloco)', mins: 30 },
                    { label: '1h (2 blocos)', mins: 60 },
                    { label: '1h30 (3 blocos)', mins: 90 },
                    { label: '2h (4 blocos)', mins: 120 },
                    { label: '3h (6 blocos)', mins: 180 },
                  ].map((dur) => {
                    const currentDurationMins = Math.max(parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime), 0);
                    const isSelected = currentDurationMins === dur.mins;
                    return (
                      <button
                        key={dur.mins}
                        type="button"
                        onClick={() => {
                          const startMins = parseTimeToMinutes(startTime);
                          setEndTime(minutesToTime(startMins + dur.mins));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D85F79] text-white shadow-2xs font-bold'
                            : 'bg-white hover:bg-[#FFF5F7] text-[#6D6366] border border-[#E9DFDC]'
                        }`}
                      >
                        {dur.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Nível de Compromisso */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[#40383A] uppercase tracking-wider text-[10px]">
              Nível de Compromisso
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {(['obrigatorio', 'importante', 'recomendado', 'opcional'] as CommitmentLevel[]).map(
                (lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCommitment(lvl)}
                    className={`py-1.5 px-1 rounded-xl border font-semibold capitalize transition-all cursor-pointer ${
                      commitment === lvl
                        ? 'bg-[#D85F79] text-white border-[#D85F79] shadow-xs'
                        : 'border-[#E9DFDC] hover:bg-[#FAF8F5] text-[#6D6366]'
                    }`}
                  >
                    {lvl}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Etapas / Subtasks */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-[#40383A] text-xs">
              Etapas / Subtarefas
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Adicionar etapa..."
                value={newEtapaText}
                onChange={(e) => setNewEtapaText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEtapa();
                  }
                }}
                className="flex-1 px-3 py-1.5 border border-[#E9DFDC] rounded-xl bg-white text-[#40383A]"
              />
              <button
                type="button"
                onClick={handleAddEtapa}
                className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2EBE8] border border-[#E9DFDC] font-semibold text-[#40383A] rounded-xl cursor-pointer"
              >
                + Adicionar
              </button>
            </div>

            {etapas.length > 0 && (
              <div className="flex flex-col gap-1 mt-1 max-h-28 overflow-y-auto">
                {etapas.map((et) => (
                  <div
                    key={et.id}
                    className="flex items-center justify-between px-2.5 py-1 bg-[#FAF8F5] rounded-lg border border-[#E9DFDC]"
                  >
                    <span className="text-[#40383A]">{et.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEtapa(et.id)}
                      className="text-[#918689] hover:text-[#D97A72]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-[#40383A] text-xs">Observações</label>
            <textarea
              placeholder="Anotações, instruções ou referências..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="px-3 py-1.5 border border-[#E9DFDC] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#FFD3DD] text-[#40383A]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E9DFDC] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E9DFDC] hover:bg-[#FAF8F5] text-[#6D6366] rounded-xl font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#D85F79] hover:bg-[#B94862] text-white rounded-xl font-semibold shadow-xs cursor-pointer"
            >
              {editItem ? 'Salvar Alterações' : 'Criar Atividade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
