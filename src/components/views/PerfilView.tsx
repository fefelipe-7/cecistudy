import React, { useState } from 'react';
import {
  User,
  Award,
  Sparkles,
  HeartHandshake,
  FileText,
  Settings,
  GraduationCap,
  Heart,
  Plus,
  CheckCircle2,
  Clock,
  BookOpen
} from 'lucide-react';
import {
  UserProfile,
  Sticker,
  InternshipLog,
  TccData,
  SubTabPerfil
} from '../../types';

import { StudyStatsWidget } from '../widgets/StudyStatsWidget';
import { MoodCalendarWidget } from '../widgets/MoodCalendarWidget';

interface PerfilViewProps {
  profile: UserProfile;
  stickers: Sticker[];
  internshipLogs: InternshipLog[];
  tcc: TccData;
  initialSubTab?: SubTabPerfil;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onUpdateTcc: (updated: TccData) => void;
  onOpenQuickAdd: () => void;
}

export const PerfilView: React.FC<PerfilViewProps> = ({
  profile,
  stickers,
  internshipLogs,
  tcc,
  initialSubTab = 'jornada',
  onUpdateProfile,
  onUpdateTcc,
  onOpenQuickAdd,
}) => {
  const [subTab, setSubTab] = useState<SubTabPerfil>(initialSubTab);

  // Edit profile form state
  const [name, setName] = useState(profile.name);
  const [semester, setSemester] = useState(profile.semester);
  const [university, setUniversity] = useState(profile.university);
  const [dailyQuote, setDailyQuote] = useState(profile.dailyQuote);
  const [avatarMood, setAvatarMood] = useState(profile.avatarMood);

  const totalInternshipHours = internshipLogs.reduce((acc, l) => acc + l.hours, 0);
  const percentDegree = Math.round((profile.semester / profile.totalSemesters) * 100);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      semester: Number(semester),
      university,
      dailyQuote,
      avatarMood
    });
    alert('✨ Cantinho de estudos atualizado com sucesso! ♡');
  };

  const handleToggleTccChapter = (index: number) => {
    const updatedChapters = [...tcc.chapters];
    updatedChapters[index].completed = !updatedChapters[index].completed;
    onUpdateTcc({
      ...tcc,
      chapters: updatedChapters
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="journal-card p-6 bg-gradient-to-r from-white via-[#FFF9F0] to-[#F4D7DF]/50 border-b-2 border-[#E8AFC0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-[#F4D7DF] border-2 border-[#E8AFC0] flex items-center justify-center font-serif-display font-bold text-3xl text-[#3F3940] shadow-md">
              C
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#3F3940]">
                  Meu Espaço • {profile.name} <span className="text-[#E8AFC0] font-normal">♡</span>
                </h1>
              </div>

              <p className="text-xs text-[#716A70] mt-0.5">
                {profile.targetCareer} • {profile.university}
              </p>

              <span className="inline-block text-[11px] bg-[#E3F1F7] text-[#3F3940] px-2.5 py-0.5 rounded-full font-medium border border-[#BFDDED] mt-2">
                {profile.avatarMood}
              </span>
            </div>
          </div>

          {/* Graduation Progress Pill */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#EFE5D8] text-right sm:self-center shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-[#9A9195]">Progresso da Graduação</p>
            <p className="font-serif-display font-bold text-xl text-[#3F3940]">{percentDegree}% Concluído</p>
            <p className="text-[11px] text-[#716A70]">{profile.semester}º de {profile.totalSemesters} semestres</p>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#EFE5D8] overflow-x-auto scrollbar-none">
          {[
            { id: 'jornada', label: 'Minha Jornada', icon: GraduationCap },
            { id: 'stickers', label: 'Stickers & Conquistas', icon: Sparkles },
            { id: 'estagio', label: 'Diário de Estágio', icon: HeartHandshake },
            { id: 'tcc', label: 'Meu TCC', icon: FileText },
            { id: 'configuracoes', label: 'Personalização', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = subTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as SubTabPerfil)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                  isSel
                    ? 'bg-[#3F3940] text-white shadow-xs'
                    : 'bg-white text-[#716A70] border border-[#EFE5D8] hover:bg-[#F4D7DF]/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTAB 1: JORNADA ACADÊMICA */}
      {subTab === 'jornada' && (
        <div className="space-y-6">
          <StudyStatsWidget />

          <div className="journal-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif-display font-bold text-xl text-[#3F3940]">
                  Linha do Tempo da Minha Graduação em Psicologia
                </h2>
                <p className="text-xs text-[#716A70]">
                  Acompanhando a caminhada desde o primeiro dia até a formação clínica.
                </p>
              </div>
              <span className="text-xs bg-[#F4D7DF] text-[#3F3940] px-3 py-1 rounded-full font-medium">
                60% do Caminho Percorrido 🎓
              </span>
            </div>

            {/* Timeline Steps Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((sem) => {
                const isPast = sem < profile.semester;
                const isCurrent = sem === profile.semester;

                return (
                  <div
                    key={sem}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-[#F4D7DF] border-2 border-[#E8AFC0] shadow-sm font-bold scale-102'
                        : isPast
                        ? 'bg-[#E3F1F7]/60 border-[#BFDDED] text-[#3F3940]'
                        : 'bg-white border-[#EFE5D8] opacity-60'
                    }`}
                  >
                    <p className="text-xs text-[#716A70]">Semestre</p>
                    <p className="font-serif-display text-2xl font-bold my-1">{sem}º</p>
                    <p className="text-[10px] font-medium">
                      {isCurrent ? '🌸 Em Andamento' : isPast ? '✓ Concluído' : 'Aguardando'}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#EFE5D8] text-xs space-y-2">
              <p className="font-semibold text-[#3F3940]">💭 Reflexão de Jornada:</p>
              <p className="text-[#716A70] leading-relaxed">
                "No 6º semestre, a teoria ganha vida na prática do Estágio e na estruturação do TCC. Cada aula de Psicopatologia e TCC é um tijolinho na construção da profissional que estou me tornando."
              </p>
            </div>
          </div>

          <MoodCalendarWidget />
        </div>
      )}

      {/* SUBTAB 2: STICKERS & CONQUISTAS */}
      {subTab === 'stickers' && (
        <div className="journal-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif-display font-bold text-xl text-[#3F3940]">
                Coleção de Stickers & Pequenas Conquistas
              </h2>
              <p className="text-xs text-[#716A70]">
                Celebrando cada passo da faculdade sem pressão, apenas com carinho.
              </p>
            </div>
            <span className="text-xs bg-[#E8AFC0] text-white px-3 py-1 rounded-full font-medium">
              {stickers.filter((s) => s.unlocked).length} Desbloqueados
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {stickers.map((st) => (
              <div
                key={st.id}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  st.unlocked
                    ? 'bg-white border-[#E8AFC0]/50 shadow-2xs hover:scale-105'
                    : 'bg-[#EFE5D8]/30 border-dashed border-[#DCCBB8] opacity-50 grayscale'
                }`}
              >
                <span className="text-4xl block my-1">{st.emoji}</span>
                <h3 className="font-serif-display font-bold text-sm text-[#3F3940] mt-1">
                  {st.name}
                </h3>
                <p className="text-[11px] text-[#716A70] leading-tight mt-1">
                  {st.description}
                </p>

                {st.unlocked ? (
                  <span className="inline-block text-[9px] bg-[#F4D7DF] text-[#3F3940] px-2 py-0.5 rounded-full font-medium mt-3">
                    Conquistado em {st.unlockedAt || 'Agosto'} ✨
                  </span>
                ) : (
                  <span className="inline-block text-[9px] bg-[#EFE5D8] text-[#9A9195] px-2 py-0.5 rounded-full font-medium mt-3">
                    Bloqueado
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: DIÁRIO DE ESTÁGIO */}
      {subTab === 'estagio' && (
        <div className="journal-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif-display font-bold text-xl text-[#3F3940]">
                Diário de Estágio Acadêmico & Supervisão
              </h2>
              <p className="text-xs text-[#716A70]">
                Acompanhamento de horas, diário de campo e reflexões éticas na Clínica Escola.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-[#E3F1F7] px-3.5 py-1.5 rounded-2xl border border-[#BFDDED] text-xs text-right">
                <p className="text-[10px] uppercase font-bold text-[#716A70]">Total de Horas</p>
                <p className="font-bold text-[#3F3940] text-sm">{totalInternshipHours} Horas Registradas</p>
              </div>

              <button
                onClick={onOpenQuickAdd}
                className="bg-[#E8AFC0] hover:bg-[#e09eb1] text-white px-3.5 py-2 rounded-xl text-xs font-medium"
              >
                + Novo Registro
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {internshipLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-[#FFF9F0] border border-[#EFE5D8] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#3F3940] bg-[#F4D7DF] px-2.5 py-0.5 rounded-full">
                    📅 {log.date} • {log.hours} Horas
                  </span>
                  <span className="text-[#716A70]">Estágio Básico Supervisão I</span>
                </div>

                <h3 className="font-serif-display font-bold text-base text-[#3F3940] pt-1">
                  {log.activity}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-[#EFE5D8]">
                    <p className="font-semibold text-[#3F3940] mb-1">Supervisão / Orientações:</p>
                    <p className="text-[#716A70] leading-relaxed">{log.supervisionNotes}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-[#EFE5D8]">
                    <p className="font-semibold text-[#3F3940] mb-1">Reflexão Pessoal / Ética:</p>
                    <p className="text-[#716A70] leading-relaxed">{log.reflections}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: MEU TCC */}
      {subTab === 'tcc' && (
        <div className="journal-card p-6 space-y-5">
          <div className="border-b border-[#EFE5D8] pb-4">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F4D7DF] text-[#3F3940]">
              TCC I • Em Andamento
            </span>
            <h2 className="font-serif-display font-bold text-xl sm:text-2xl text-[#3F3940] mt-1">
              {tcc.title}
            </h2>
            <p className="text-xs text-[#716A70] mt-1">
              Orientadora: <span className="font-semibold text-[#3F3940]">{tcc.advisor}</span> • Área: {tcc.field}
            </p>
          </div>

          {/* Problem statement & Objectives */}
          <div className="bg-[#FFF9F0] p-4 rounded-2xl border border-[#EFE5D8] space-y-3 text-xs">
            <div>
              <p className="font-semibold text-[#3F3940] mb-1">Problema de Pesquisa:</p>
              <p className="text-[#716A70] leading-relaxed">{tcc.problemStatement}</p>
            </div>

            <div>
              <p className="font-semibold text-[#3F3940] mb-1">Objetivos:</p>
              <ul className="list-disc pl-4 space-y-1 text-[#716A70]">
                {tcc.objectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Chapters Checklist */}
          <div>
            <h3 className="font-serif-display font-bold text-base text-[#3F3940] mb-3">
              Cronograma de Capítulos
            </h3>

            <div className="space-y-2">
              {tcc.chapters.map((ch, idx) => (
                <div
                  key={idx}
                  onClick={() => handleToggleTccChapter(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    ch.completed
                      ? 'bg-[#E3F1F7]/50 border-[#BFDDED] text-[#3F3940]'
                      : 'bg-white border-[#EFE5D8] hover:border-[#E8AFC0]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-5 h-5 ${ch.completed ? 'text-[#A8C9B0]' : 'text-[#DCCBB8]'}`} />
                    <span className={`text-xs font-medium ${ch.completed ? 'line-through text-[#9A9195]' : 'text-[#3F3940]'}`}>
                      {ch.title}
                    </span>
                  </div>

                  {ch.dueDate && (
                    <span className="text-[10px] text-[#716A70]">Prazo: {ch.dueDate}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* References ABNT */}
          <div>
            <h3 className="font-serif-display font-bold text-base text-[#3F3940] mb-2">
              Referências Utilizadas (ABNT)
            </h3>
            <div className="space-y-1.5 text-xs text-[#716A70]">
              {tcc.references.map((ref, idx) => (
                <p key={idx} className="bg-white p-2.5 rounded-xl border border-[#EFE5D8] font-mono text-[11px]">
                  {ref}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: PERSONALIZAÇÃO DO CANTINHO */}
      {subTab === 'configuracoes' && (
        <div className="journal-card p-6 space-y-5">
          <h2 className="font-serif-display font-bold text-xl text-[#3F3940]">
            Personalize Seu Cantinho no cecistudy
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-[#716A70] mb-1">Seu Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Semestre Atual</label>
                <input
                  type="number"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#716A70] mb-1">Universidade</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#716A70] mb-1">Status / Mood do Dia</label>
              <input
                type="text"
                value={avatarMood}
                onChange={(e) => setAvatarMood(e.target.value)}
                className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#716A70] mb-1">Frase Motivacional de Entrada</label>
              <textarea
                rows={2}
                value={dailyQuote}
                onChange={(e) => setDailyQuote(e.target.value)}
                className="w-full bg-white border border-[#DCCBB8] rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              className="bg-[#E8AFC0] hover:bg-[#e09eb1] text-white px-5 py-2.5 rounded-xl text-xs font-medium shadow-2xs"
            >
              Salvar Configurações do Cantinho
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
