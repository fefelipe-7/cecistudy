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
    <div className="space-y-6 pb-1 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="rounded-[24px] p-6 bg-gradient-to-r from-white via-[#FAF8F5] to-[#FFF5F7]/80 border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-[#FFF5F7] border-2 border-[#FFD3DD] flex items-center justify-center font-display font-bold text-3xl text-[#40383A] shadow-2xs">
              C
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#40383A]">
                  meu espaço • {profile.name} <span className="text-[#E97891] font-normal">♡</span>
                </h1>
              </div>

              <p className="text-xs text-[#6D6366] mt-0.5">
                {profile.targetCareer} • {profile.university}
              </p>

              <span className="inline-block text-[11px] bg-[#F3F9FC] text-[#396D82] px-2.5 py-0.5 rounded-full font-medium border border-[#CEE7F0] mt-2">
                {profile.avatarMood}
              </span>
            </div>
          </div>

          {/* Graduation Progress Pill */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#E9DFDC] text-right sm:self-center shadow-2xs">
            <p className="text-[10px] lowercase font-bold text-[#918689]">progresso da graduação</p>
            <p className="font-display font-bold text-xl text-[#40383A]">{percentDegree}% concluído</p>
            <p className="text-[11px] text-[#6D6366]">{profile.semester}º de {profile.totalSemesters} semestres</p>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#F2EBE8] overflow-x-auto scrollbar-none">
          {[
            { id: 'jornada', label: 'minha jornada', icon: GraduationCap },
            { id: 'stickers', label: 'stickers & conquistas', icon: Sparkles },
            { id: 'estagio', label: 'diário de estágio', icon: HeartHandshake },
            { id: 'tcc', label: 'meu tcc', icon: FileText },
            { id: 'configuracoes', label: 'personalização', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = subTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as SubTabPerfil)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSel
                    ? 'bg-[#40383A] text-white shadow-2xs'
                    : 'bg-white text-[#6D6366] border border-[#E9DFDC] hover:bg-[#FFF5F7]/50 hover:border-[#FFD3DD]'
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

          <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-xl text-[#40383A]">
                  linha do tempo da minha graduação em psicologia
                </h2>
                <p className="text-xs text-[#6D6366]">
                  acompanhando a caminhada desde o primeiro dia até a formação clínica.
                </p>
              </div>
              <span className="text-xs bg-[#FFF5F7] text-[#B94862] border border-[#FFD3DD] px-3 py-1 rounded-full font-medium">
                60% do caminho percorrido 🎓
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
                        ? 'bg-[#FFF5F7] border-2 border-[#FFD3DD] text-[#B94862] shadow-2xs font-bold scale-102'
                        : isPast
                        ? 'bg-[#F3F9FC]/80 border-[#CEE7F0] text-[#396D82]'
                        : 'bg-white border-[#E9DFDC] opacity-60 text-[#6D6366]'
                    }`}
                  >
                    <p className="text-xs opacity-80">semestre</p>
                    <p className="font-display text-2xl font-bold my-1">{sem}º</p>
                    <p className="text-[10px] font-medium">
                      {isCurrent ? '🌸 em andamento' : isPast ? '✓ concluído' : 'aguardando'}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E9DFDC] text-xs space-y-2">
              <p className="font-semibold text-[#40383A]">💭 reflexão de jornada:</p>
              <p className="text-[#6D6366] leading-relaxed">
                "no 6º semestre, a teoria ganha vida na prática do estágio e na estruturação do tcc. cada aula de psicopatologia e tcc é um tijolinho na construção da profissional que estou me tornando."
              </p>
            </div>
          </div>

          <MoodCalendarWidget />
        </div>
      )}

      {/* SUBTAB 2: STICKERS & CONQUISTAS */}
      {subTab === 'stickers' && (
        <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-xl text-[#40383A]">
                coleção de stickers & pequenas conquistas
              </h2>
              <p className="text-xs text-[#6D6366]">
                celebrando cada passo da faculdade sem pressão, apenas com carinho.
              </p>
            </div>
            <span className="text-xs bg-[#E97891] text-white px-3 py-1 rounded-full font-medium shadow-2xs">
              {stickers.filter((s) => s.unlocked).length} desbloqueados
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {stickers.map((st) => (
              <div
                key={st.id}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  st.unlocked
                    ? 'bg-white border-[#FFD3DD] shadow-2xs hover:scale-105'
                    : 'bg-[#FAF8F5] border-dashed border-[#E9DFDC] opacity-50 grayscale'
                }`}
              >
                <span className="text-4xl block my-1">{st.emoji}</span>
                <h3 className="font-display font-bold text-sm text-[#40383A] mt-1">
                  {st.name}
                </h3>
                <p className="text-[11px] text-[#6D6366] leading-tight mt-1">
                  {st.description}
                </p>

                {st.unlocked ? (
                  <span className="inline-block text-[9px] bg-[#FFF5F7] text-[#B94862] border border-[#FFD3DD] px-2 py-0.5 rounded-full font-medium mt-3">
                    conquistado em {st.unlockedAt || 'agosto'} ✨
                  </span>
                ) : (
                  <span className="inline-block text-[9px] bg-[#FAF8F5] text-[#918689] px-2 py-0.5 rounded-full font-medium mt-3">
                    bloqueado
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: DIÁRIO DE ESTÁGIO */}
      {subTab === 'estagio' && (
        <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-xl text-[#40383A]">
                diário de estágio acadêmico & supervisão
              </h2>
              <p className="text-xs text-[#6D6366]">
                acompanhamento de horas, diário de campo e reflexões éticas na clínica escola.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-[#F3F9FC] px-3.5 py-1.5 rounded-2xl border border-[#CEE7F0] text-xs text-right">
                <p className="text-[10px] lowercase font-bold text-[#6D6366]">total de horas</p>
                <p className="font-bold text-[#396D82] text-sm">{totalInternshipHours} horas registradas</p>
              </div>

              <button
                onClick={onOpenQuickAdd}
                className="bg-[#E97891] hover:bg-[#D85F79] text-white px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer shadow-2xs"
              >
                + novo registro
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {internshipLogs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E9DFDC] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#B94862] bg-[#FFF5F7] border border-[#FFD3DD] px-2.5 py-0.5 rounded-full">
                    📅 {log.date} • {log.hours} horas
                  </span>
                  <span className="text-[#6D6366]">Estágio Básico Supervisão I</span>
                </div>

                <h3 className="font-display font-bold text-base text-[#40383A] pt-1">
                  {log.activity}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-[#E9DFDC]">
                    <p className="font-semibold text-[#40383A] mb-1">supervisão / orientações:</p>
                    <p className="text-[#6D6366] leading-relaxed">{log.supervisionNotes}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-[#E9DFDC]">
                    <p className="font-semibold text-[#40383A] mb-1">reflexão pessoal / ética:</p>
                    <p className="text-[#6D6366] leading-relaxed">{log.reflections}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: MEU TCC */}
      {subTab === 'tcc' && (
        <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-5">
          <div className="border-b border-[#F2EBE8] pb-4">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FFF5F7] text-[#B94862] border border-[#FFD3DD]">
              tcc i • em andamento
            </span>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#40383A] mt-2">
              {tcc.title}
            </h2>
            <p className="text-xs text-[#6D6366] mt-1">
              orientadora: <span className="font-semibold text-[#40383A]">{tcc.advisor}</span> • área: {tcc.field}
            </p>
          </div>

          {/* Problem statement & Objectives */}
          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E9DFDC] space-y-3 text-xs">
            <div>
              <p className="font-semibold text-[#40383A] mb-1">problema de pesquisa:</p>
              <p className="text-[#6D6366] leading-relaxed">{tcc.problemStatement}</p>
            </div>

            <div>
              <p className="font-semibold text-[#40383A] mb-1">objetivos:</p>
              <ul className="list-disc pl-4 space-y-1 text-[#6D6366]">
                {tcc.objectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Chapters Checklist */}
          <div>
            <h3 className="font-display font-bold text-base text-[#40383A] mb-3">
              cronograma de capítulos
            </h3>

            <div className="space-y-2">
              {tcc.chapters.map((ch, idx) => (
                <div
                  key={idx}
                  onClick={() => handleToggleTccChapter(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    ch.completed
                      ? 'bg-[#F3F9FC]/60 border-[#CEE7F0] text-[#396D82]'
                      : 'bg-white border-[#E9DFDC] hover:border-[#FFD3DD]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-5 h-5 ${ch.completed ? 'text-[#518265]' : 'text-[#BEB4B6]'}`} />
                    <span className={`text-xs font-medium ${ch.completed ? 'line-through text-[#918689]' : 'text-[#40383A]'}`}>
                      {ch.title}
                    </span>
                  </div>

                  {ch.dueDate && (
                    <span className="text-[10px] text-[#6D6366]">prazo: {ch.dueDate}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* References ABNT */}
          <div>
            <h3 className="font-display font-bold text-base text-[#40383A] mb-2">
              referências utilizadas (abnt)
            </h3>
            <div className="space-y-1.5 text-xs text-[#6D6366]">
              {tcc.references.map((ref, idx) => (
                <p key={idx} className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E9DFDC] font-mono text-[11px] text-[#40383A]">
                  {ref}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: PERSONALIZAÇÃO DO CANTINHO */}
      {subTab === 'configuracoes' && (
        <div className="rounded-[24px] p-6 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] space-y-5">
          <h2 className="font-display font-bold text-xl text-[#40383A]">
            personalize seu cantinho no cecistudy
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-[#6D6366] mb-1">seu nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E9DFDC] focus:outline-none focus:border-[#E97891] rounded-xl px-3.5 py-2 text-sm text-[#40383A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6D6366] mb-1">semestre atual</label>
                <input
                  type="number"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full bg-[#FAF8F5] border border-[#E9DFDC] focus:outline-none focus:border-[#E97891] rounded-xl px-3.5 py-2 text-sm text-[#40383A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6D6366] mb-1">universidade</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E9DFDC] focus:outline-none focus:border-[#E97891] rounded-xl px-3.5 py-2 text-sm text-[#40383A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6D6366] mb-1">status / mood do dia</label>
              <input
                type="text"
                value={avatarMood}
                onChange={(e) => setAvatarMood(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E9DFDC] focus:outline-none focus:border-[#E97891] rounded-xl px-3.5 py-2 text-sm text-[#40383A]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6D6366] mb-1">frase motivacional de entrada</label>
              <textarea
                rows={2}
                value={dailyQuote}
                onChange={(e) => setDailyQuote(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E9DFDC] focus:outline-none focus:border-[#E97891] rounded-xl px-3.5 py-2 text-xs text-[#40383A]"
              />
            </div>

            <button
              type="submit"
              className="bg-[#E97891] hover:bg-[#D85F79] text-white px-5 py-2.5 rounded-xl text-xs font-medium shadow-2xs cursor-pointer"
            >
              salvar configurações do cantinho
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
