import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Heart,
  GraduationCap,
  Palette,
  Camera,
  Trash2,
  FolderOpen,
  Images,
  CalendarDays,
  Bell,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { pickProfilePhoto } from '../../lib/photo';
import {
  checkPermission,
  requestPermission,
  AppPermissionKind,
  AppPermissionState,
} from '../../lib/permissions';
import { isNativePlatform } from '../../lib/storage';

const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const PERMISSION_CARDS: {
  kind: AppPermissionKind;
  title: string;
  description: string;
  Icon: typeof FolderOpen;
}[] = [
  { kind: 'files', title: 'arquivos', description: 'guardar e exportar backups do seu cantinho.', Icon: FolderOpen },
  { kind: 'photos', title: 'fotos e mídias', description: 'usar câmera e galeria para sua foto de perfil.', Icon: Images },
  { kind: 'calendar', title: 'agenda', description: 'anotar aulas, provas e estudos na sua agenda.', Icon: CalendarDays },
  { kind: 'notifications', title: 'notificações', description: 'receber o lembrete diário de estudo ♡', Icon: Bell },
];

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [semester, setSemester] = useState(1);
  const [totalSemesters, setTotalSemesters] = useState(8);
  const [university, setUniversity] = useState('');
  const [targetCareer, setTargetCareer] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loadDemo, setLoadDemo] = useState(true);

  const canProceedName = name.trim().length > 0;

  const pickPhoto = async () => {
    try {
      const dataUrl = await pickProfilePhoto();
      if (dataUrl) setPhotoUrl(dataUrl);
    } catch {
      // usuário cancelou ou deu erro — mantém a atual
    }
  };

  const finish = () => {
    completeOnboarding(
      {
        name: name.trim(),
        semester,
        totalSemesters,
        university: university.trim(),
        targetCareer: targetCareer.trim() || 'Psicóloga Clínica',
        avatarMood: '✿ começando uma nova fase',
        dailyQuote: 'compreender o ser humano é a forma mais bonita de cuidado.',
        stickersCollected: 0,
        photoUrl: photoUrl || '',
      },
      loadDemo
    );
  };

  return (
    <div className="min-h-dvh bg-canvas text-ceci-primary flex flex-col">
      <div className="flex-1 max-w-md sm:max-w-xl w-full mx-auto px-5 pt-8 pb-8 flex flex-col">
        {/* topo da marca */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-9 h-9 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong font-display font-bold text-lg">
            C
          </span>
          <span className="font-display font-bold text-lg text-ceci-primary">
            cecistudy <span className="text-ceci-brand-strong">♡</span>
          </span>
        </div>

        {/* indicador de progresso */}
        {step > 0 && (
          <div className="flex items-center gap-1.5 justify-center mb-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  step >= i ? 'bg-ceci-brand w-5' : 'bg-ceci-border-default w-1.5'
                )}
              />
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center">
          {step === 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-[24px] bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-3xl">
                🌷
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                bora montar seu cantinho?
              </h1>
              <p className="text-sm text-ceci-secondary leading-relaxed max-w-xs mx-auto">
                seu organizador de psicologia, do jeitinho que cabe em você — aulas, leituras, provas e a sua jornada até o CRP.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 bg-ceci-primary hover:bg-ceci-primary-hover text-white px-7 py-3.5 rounded-full text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  começar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong">
                  <Heart className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight">quem é você?</h1>
                  <p className="text-xs text-ceci-secondary">como devo te chamar por aqui?</p>
                </div>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="seu nome (ex.: ceci)"
                className="w-full bg-white border border-ceci-border-default rounded-2xl px-4 py-3.5 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-rose-500 shadow-2xs"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1.5 bg-white border border-ceci-border-default text-ceci-secondary px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> voltar
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedName}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer',
                    canProceedName ? 'bg-ceci-brand hover:bg-ceci-brand-strong' : 'bg-ceci-faded cursor-not-allowed'
                  )}
                >
                  continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight">sua jornada</h1>
                  <p className="text-xs text-ceci-secondary">em qual momento da graduação você está?</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-ceci-secondary mb-2">semestre atual</p>
                <div className="flex flex-wrap gap-2">
                  {SEMESTER_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSemester(s)}
                      className={cn(
                        'w-10 h-10 rounded-xl border text-sm font-bold transition-colors cursor-pointer',
                        semester === s
                          ? 'bg-ceci-primary text-white border-ceci-primary shadow-xs'
                          : 'bg-white text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
                      )}
                    >
                      {s}º
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-ceci-secondary mb-2">total de semestres do curso</p>
                <div className="flex flex-wrap gap-2">
                  {SEMESTER_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setTotalSemesters(s)}
                      className={cn(
                        'w-10 h-10 rounded-xl border text-sm font-bold transition-colors cursor-pointer',
                        totalSemesters === s
                          ? 'bg-ceci-academic text-white border-ceci-academic shadow-xs'
                          : 'bg-white text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
                      )}
                    >
                      {s}º
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 bg-white border border-ceci-border-default text-ceci-secondary px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 bg-ceci-brand hover:bg-ceci-brand-strong text-white py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight">seu contexto</h1>
                  <p className="text-xs text-ceci-secondary">onde e pra onde você está caminhando?</p>
                </div>
              </div>

              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="universidade (opcional)"
                className="w-full bg-white border border-ceci-border-default rounded-2xl px-4 py-3.5 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-rose-500 shadow-2xs"
              />

              <input
                type="text"
                value={targetCareer}
                onChange={(e) => setTargetCareer(e.target.value)}
                placeholder="objetivo profissional (opcional)"
                className="w-full bg-white border border-ceci-border-default rounded-2xl px-4 py-3.5 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-rose-500 shadow-2xs"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 bg-white border border-ceci-border-default text-ceci-secondary px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> voltar
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 flex items-center justify-center gap-2 bg-ceci-brand hover:bg-ceci-brand-strong text-white py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong">
                  <Camera className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight">sua foto</h1>
                  <p className="text-xs text-ceci-secondary">um rostinho para o cantinho te reconhecer ♡</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 py-2">
                <div className="w-28 h-28 rounded-[32px] bg-surface-rose border-2 border-ceci-border-brand flex items-center justify-center overflow-hidden shadow-2xs">
                  {photoUrl ? (
                    <img src={photoUrl} alt="sua foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-5xl text-ceci-primary">
                      {name.trim().charAt(0).toUpperCase() || 'C'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={pickPhoto}
                    className="inline-flex items-center gap-1.5 bg-ceci-primary hover:bg-ceci-primary-hover text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> escolher foto
                  </button>
                  {photoUrl && (
                    <button
                      onClick={() => setPhotoUrl('')}
                      className="inline-flex items-center gap-1.5 bg-white border border-ceci-border-default text-ceci-secondary px-5 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> remover
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-ceci-tertiary">pode deixar pra depois, se preferir ♡</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 bg-white border border-ceci-border-default text-ceci-secondary px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> voltar
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 flex items-center justify-center gap-2 bg-ceci-brand hover:bg-ceci-brand-strong text-white py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong">
                  <Palette className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight">como prefere começar?</h1>
                  <p className="text-xs text-ceci-secondary">o cantinho nasce do jeito que você quiser</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setLoadDemo(true)}
                  className={cn(
                    'w-full text-left bg-white rounded-[22px] p-5 border transition-all cursor-pointer',
                    loadDemo ? 'border-ceci-border-brand shadow-xs ring-2 ring-ceci-border-brand' : 'border-ceci-border-default'
                  )}
                >
                  <div className="flex items-center gap-2 font-display font-bold text-sm text-ceci-primary">
                    <Sparkles className="w-4 h-4 text-rose-500" /> começar com exemplos
                  </div>
                  <p className="text-xs text-ceci-secondary mt-1 leading-relaxed">
                    preencho o cantinho com disciplinas, aulas, provas e leituras de exemplo — você explora e troca pelo que for seu.
                  </p>
                </button>

                <button
                  onClick={() => setLoadDemo(false)}
                  className={cn(
                    'w-full text-left bg-white rounded-[22px] p-5 border transition-all cursor-pointer',
                    !loadDemo ? 'border-ceci-border-brand shadow-xs ring-2 ring-ceci-border-brand' : 'border-ceci-border-default'
                  )}
                >
                  <div className="flex items-center gap-2 font-display font-bold text-sm text-ceci-primary">
                    <Heart className="w-4 h-4 text-ceci-brand-strong" /> começar do zero
                  </div>
                  <p className="text-xs text-ceci-secondary mt-1 leading-relaxed">
                    começa vazio, e você constrói tudo no seu ritmo, anotando aula por aula.
                  </p>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(4)}
                  className="flex items-center gap-1.5 bg-white border border-ceci-border-default text-ceci-secondary px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> voltar
                </button>
                <button
                  onClick={() => setStep(6)}
                  className="flex-1 flex items-center justify-center gap-2 bg-ceci-brand hover:bg-ceci-brand-strong text-white py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <PermissionsStep onFinish={finish} onBack={() => setStep(5)} />
          )}
        </div>

        <p className="text-center text-[11px] text-ceci-tertiary mt-6">
          tudo fica guardado aqui no seu dispositivo, com carinho ♡
        </p>
      </div>
    </div>
  );
};

const PermissionsStep: React.FC<{ onFinish: () => void; onBack: () => void }> = ({ onFinish, onBack }) => {
  const [states, setStates] = useState<Record<AppPermissionKind, AppPermissionState | 'loading'>>({
    files: 'loading',
    photos: 'loading',
    calendar: 'loading',
    notifications: 'loading',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const entries = await Promise.all(
        PERMISSION_CARDS.map(async (card) => [card.kind, await checkPermission(card.kind)] as const)
      );
      if (!active) return;
      setStates(Object.fromEntries(entries) as Record<AppPermissionKind, AppPermissionState | 'loading'>);
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggle = async (kind: AppPermissionKind) => {
    if (!isNativePlatform) return;
    setStates((prev) => ({ ...prev, [kind]: 'loading' }));
    const next = await requestPermission(kind);
    setStates((prev) => ({ ...prev, [kind]: next }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong">
          <Bell className="w-5 h-5" />
        </span>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">permissões do cantinho</h1>
          <p className="text-xs text-ceci-secondary">ativando, o app pede acesso na hora ♡</p>
        </div>
      </div>

      {!isNativePlatform && (
        <p className="text-[11px] text-ceci-tertiary bg-surface-muted border border-ceci-border-default rounded-xl px-3.5 py-2.5 leading-relaxed">
          disponível no aplicativo nativo (android/ios) — por aqui nada é necessário.
        </p>
      )}

      <div className="space-y-3">
        {PERMISSION_CARDS.map(({ kind, title, description, Icon }) => {
          const state = states[kind];
          const supported = isNativePlatform;
          const granted = state === 'granted';
          const loading = state === 'loading';
          return (
            <div
              key={kind}
              className={cn(
                'rounded-2xl p-4 border flex items-center gap-3',
                granted
                  ? 'bg-surface-rose border-ceci-border-brand'
                  : 'bg-white border-ceci-border-default'
              )}
            >
              <span className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', granted ? 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand' : 'bg-surface-muted text-ceci-secondary border border-ceci-border-default')}>
                <Icon className="w-4.5 h-4.5" />
              </span>

              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-sm text-ceci-primary">{title}</h3>
                <p className="text-[11px] text-ceci-secondary leading-tight mt-0.5">{description}</p>
                {state === 'denied' && (
                  <p className="text-[10px] text-red-700 mt-1 flex items-center gap-1">
                    <X className="w-3 h-3" /> não concedido — dá pra ativar depois nas configurações.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => toggle(kind)}
                disabled={!supported || loading}
                aria-pressed={granted}
                aria-label={`permissão de ${title}`}
                className={cn(
                  'relative w-12 h-7 rounded-full tap-interactive cursor-pointer shrink-0 touch-target',
                  granted ? 'bg-rose-500' : 'bg-ceci-border-strong',
                  (!supported || loading) ? 'opacity-50 cursor-not-allowed' : ''
                )}
              >
                {loading ? (
                  <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center text-[10px] text-ceci-secondary">
                    …
                  </span>
                ) : (
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center transition-transform',
                      granted && 'translate-x-5'
                    )}
                  >
                    {granted && <Check className="w-3 h-3 text-rose-500" />}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-white border border-ceci-border-default text-ceci-secondary px-5 py-3 rounded-full text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> voltar
        </button>
        <button
          onClick={onFinish}
          className="flex-1 flex items-center justify-center gap-2 bg-ceci-primary hover:bg-ceci-primary-hover text-white py-3 rounded-full text-xs font-semibold transition-colors cursor-pointer"
        >
          montar meu cantinho <Heart className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
