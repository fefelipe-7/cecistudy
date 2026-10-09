import React, { useState } from 'react';
import type { InternshipLog } from '../../types';
import {
  CAMPOS_DE_REFERENCIA,
  CAMPO_REFERENCIA_LABEL,
  CAMPO_REFERENCIA_DESCRICAO,
  camposDeReferencia,
  comDeclinados,
  declinadosDe,
  valorCampoReferencia,
  type CampoPendencia,
} from '../../lib/internshipCases';
import { Modal } from '../ui/Modal';
import { ToggleRow } from '../ui/ToggleRow';
import { Mascote } from '../ui/Mascote';
import { cn } from '../../lib/utils';
import { prefersReducedMotion, BASE_D, EASE } from '../../lib/motion';
import { motion, type Variants } from 'framer-motion';
import { Feather, Tag, Compass, Activity, Heart } from 'lucide-react';

interface CampoConfig {
  key: CampoPendencia;
  label: string;
  description: string;
  placeholder: string;
  apply: (log: InternshipLog, value: string) => InternshipLog;
}

interface CompleteLogModalProps {
  open: boolean;
  log: InternshipLog;
  onClose: () => void;
  /** Grava um registro inteiro via caminho existente (`planSave`). */
  onSave: (log: InternshipLog) => void;
}

type Step = { kind: 'select' } | { kind: 'field'; index: number } | { kind: 'done' };

/** Icone de canto por campo: rosa = leitura pessoal, azul = clínica. */
type CampoIcon = React.ComponentType<{ className?: string }>;
const ICONES: Record<CampoPendencia, CampoIcon> = {
  reflexoes: Feather,
  tema: Tag,
  abordagem: Compass,
  intervencoes: Activity,
  impressoes: Heart,
};

const ACENTO: Record<CampoPendencia, string> = {
  reflexoes: 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand',
  tema: 'bg-surface-blue text-ceci-academic border border-ceci-border-academic',
  abordagem: 'bg-surface-blue text-ceci-academic border border-ceci-border-academic',
  intervencoes: 'bg-surface-blue text-ceci-academic border border-ceci-border-academic',
  impressoes: 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand',
};

/** Transição de entrada entre passos — fade + subida curta, degradada com reduced-motion. */
const STEP_VARIANTS: Variants = {
  initial: () => (prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, y: 8 }),
  animate: () =>
    prefersReducedMotion()
      ? { opacity: 1 }
      : { opacity: 1, y: 0, transition: { duration: BASE_D.step, ease: EASE.enter } },
};

/** Devolve o conteúdo de um campo de referência já normalizado. */
const conteudoDe = (log: InternshipLog, key: CampoPendencia): string =>
  valorCampoReferencia(log, key).trim();

/** Mesmo conjunto de declinados, independente da ordem (D11). */
const mesmoConjunto = (a: CampoPendencia[], b: CampoPendencia[]): boolean => {
  const normaliza = (l: CampoPendencia[]) => [...new Set(l)].sort().join(',');
  return normaliza(a) === normaliza(b);
};

const APLICAR: Record<CampoPendencia, (log: InternshipLog, v: string) => InternshipLog> = {
  reflexoes: (log, v) => ({ ...log, reflections: v }),
  tema: (log, v) => ({ ...log, theme: v }),
  abordagem: (log, v) => ({ ...log, approach: v }),
  intervencoes: (log, v) => ({ ...log, interventionNotes: v }),
  impressoes: (log, v) => ({ ...log, observations: v }),
};

const PLACEHOLDER: Record<CampoPendencia, string> = {
  reflexoes: 'anota do seu jeito…',
  tema: 'ex.: ansiedade, luto, relação familiar…',
  abordagem: 'ex.: TCC, psicanálise…',
  intervencoes: 'técnicas, manejos, encaminhamentos…',
  impressoes: 'como a pessoa chegou, vínculo, evolução…',
};

const CAMPOS: CampoConfig[] = CAMPOS_DE_REFERENCIA.map((key) => ({
  key,
  label: CAMPO_REFERENCIA_LABEL[key],
  description: CAMPO_REFERENCIA_DESCRICAO[key],
  placeholder: PLACEHOLDER[key],
  apply: APLICAR[key],
}));

const BotaoPrimario: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full min-h-[48px] rounded-2xl bg-ceci-brand-strong text-ceci-on-brand text-xs font-bold tracking-wide active:scale-[0.985] transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-default"
  >
    {children}
  </button>
);

const BotaoFantasma: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full min-h-[44px] text-ceci-tertiary py-2 text-xs font-semibold cursor-pointer hover:text-ceci-secondary transition-colors"
  >
    {children}
  </button>
);

/**
 * Fluxo "completar registro" (SPEC-011): modal sequencial com três passos —
 * escolha persistida de campos (D11), um campo por vez, confirmação. Um modal
 * só; o conteúdo troca (D5). "desisti da ideia" pula o campo sem gravar nada
 * (D5/I3). Desligar um switch grava o texto automático do "não vou responder"
 * via `comDeclinados` (D12) — só quando a usuária confirma com "continuar".
 *
 * Visual segue a identidade do Estágio (SPEC-010): faixa-hero em gradiente,
 * serifa acadêmica no nome do campo e mascote só nos momentos de celebração —
 * o corpo do fluxo fica limpo (docs/modais-wizards.md P3).
 */
export const CompleteLogModal: React.FC<CompleteLogModalProps> = ({
  open,
  log,
  onClose,
  onSave,
}) => {
  const [step, setStep] = useState<Step>({ kind: 'select' });
  const [declinados, setDeclinados] = useState<CampoPendencia[]>([]);
  const [draft, setDraft] = useState<InternshipLog>(log);
  const [fila, setFila] = useState<CampoConfig[]>([]);
  const [texto, setTexto] = useState('');
  const [salvos, setSalvos] = useState<CampoPendencia[]>([]);

  const reset = () => {
    setStep({ kind: 'select' });
    setDeclinados([]);
    setDraft(log);
    setFila([]);
    setTexto('');
    setSalvos([]);
  };

  const close = () => {
    reset();
    onClose();
  };

  const abrir = () => {
    // Escolha persistida (D11): só o que a usuária já declinou fica desligado.
    setDeclinados(declinadosDe(log));
    setDraft(log);
    setFila([]);
    setTexto('');
    setSalvos([]);
    setStep({ kind: 'select' });
  };

  // Ao abrir, semeia o estado uma vez.
  React.useEffect(() => {
    if (open) abrir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (key: CampoPendencia) =>
    setDeclinados((d) => (d.includes(key) ? d.filter((k) => k !== key) : [...d, key]));

  const continuar = () => {
    const alvo = comDeclinados(draft, declinados);
    const limpos = declinadosDe(alvo);
    const mudouDec = !mesmoConjunto(declinadosDe(log), limpos);
    if (mudouDec) {
      onSave(alvo);
      setDraft(alvo);
      setSalvos((s) => [...new Set([...s, ...limpos])]);
    }

    // Campos que ainda precisam ser respondidos nesta sessão: ligados e vazios.
    const pendentes = CAMPOS.filter(
      (c) =>
        camposDeReferencia(alvo.type).includes(c.key) &&
        !limpos.includes(c.key) &&
        conteudoDe(alvo, c.key) === ''
    );
    setFila(pendentes);
    if (pendentes.length) setStep({ kind: 'field', index: 0 });
    else setStep({ kind: 'done' });
  };

  const avancar = (index: number) => {
    const prox = index + 1;
    setTexto('');
    if (prox < fila.length) setStep({ kind: 'field', index: prox });
    else setStep({ kind: 'done' });
  };

  const salvarCampo = (index: number) => {
    const campo = fila[index];
    if (texto.trim()) {
      const next = campo.apply(draft, texto.trim());
      setDraft(next);
      onSave(next);
      setSalvos((s) => [...s, campo.key]);
    }
    avancar(index);
  };

  const pularCampo = (index: number) => avancar(index);

  const ativos = CAMPOS.filter((c) => camposDeReferencia(log.type).includes(c.key));
  const selecionados = ativos.length - declinados.filter((d) => ativos.some((a) => a.key === d)).length;

  const titulo =
    step.kind === 'select'
      ? 'o que mais tem pra anotar?'
      : step.kind === 'field'
        ? fila[step.index]?.label
        : 'tudo anotado ♡';

  const stepKey = step.kind === 'field' ? `field-${step.index}` : step.kind;

  return (
    <Modal
      open={open}
      onClose={close}
      labelledBy="complete-log-title"
      className="w-full max-w-sm bg-surface-default rounded-[28px] border border-ceci-border-default shadow-2xl p-0 text-ceci-primary"
    >
      <div className="overflow-hidden rounded-[28px]">
        <motion.div
          key={stepKey}
          variants={STEP_VARIANTS}
          initial="initial"
          animate="animate"
        >
            {step.kind === 'select' && (
              <>
                <header className="relative overflow-hidden px-5 pt-5 pb-4 bg-gradient-to-br from-surface-rose via-surface-default to-surface-blue border-b border-ceci-border-subtle">
                  <span
                    aria-hidden
                    className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-ceci-border-brand/70 blur-2xl pointer-events-none"
                  />
                  <p className="relative text-[11px] font-semibold text-ceci-brand-strong tracking-wide">
                    completar registro ♡
                  </p>
                  <h3
                    id="complete-log-title"
                    className="relative font-display font-bold text-xl text-ceci-primary leading-tight mt-1"
                  >
                    {titulo}
                  </h3>
                  <p className="relative text-xs text-ceci-secondary leading-relaxed mt-1.5 max-w-[88%]">
                    marca os campos que você vai responder — os desligados ficam anotados como
                    não respondidos (sem texto seu) e podem voltar quando quiser.
                  </p>
                  <Mascote
                    expression="field-prepare"
                    className="w-16 h-16 absolute -bottom-1 -right-2 opacity-95 pointer-events-none"
                    decorative
                  />
                </header>

                <div className="p-4 space-y-3">
                  {ativos.map((c) => {
                    const checado = !declinados.includes(c.key);
                    const Icone = ICONES[c.key];
                    return (
                      <div
                        key={c.key}
                        className={cn(
                          'rounded-2xl border px-3.5 py-3 transition-colors duration-150',
                          checado
                            ? 'border-ceci-border-brand bg-surface-rose/50'
                            : 'border-ceci-border-default bg-surface-default'
                        )}
                      >
                        <ToggleRow
                          label={c.label}
                          description={c.description}
                          icon={<Icone className="w-5 h-5" aria-hidden />}
                          iconClassName={ACENTO[c.key]}
                          checked={checado}
                          onChange={() => toggle(c.key)}
                        />
                      </div>
                    );
                  })}

                  <div className="space-y-2 pt-1">
                    <BotaoPrimario onClick={continuar}>continuar</BotaoPrimario>
                    <BotaoFantasma onClick={close}>agora não</BotaoFantasma>
                  </div>
                </div>
              </>
            )}

            {step.kind === 'field' && fila[step.index] && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="shrink-0 inline-flex items-center min-h-[44px] px-3 rounded-full text-[11px] font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand">
                    campo {step.index + 1} de {fila.length}
                  </span>
                  <div className="flex-1 flex items-center gap-1" aria-hidden>
                    {fila.map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          'h-1.5 flex-1 rounded-full transition-colors duration-150',
                          i < step.index
                            ? 'bg-ceci-brand/60'
                            : i === step.index
                              ? 'bg-ceci-brand-strong'
                              : 'bg-ceci-border-default'
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="pb-1">
                  <h3
                    id="complete-log-title"
                    className="font-serif-academic text-3xl text-ceci-primary leading-tight tracking-tight"
                  >
                    {fila[step.index].label}
                  </h3>
                  <p className="text-xs text-ceci-secondary leading-relaxed mt-1.5">
                    {fila[step.index].description}
                  </p>
                </div>

                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={fila[step.index].placeholder}
                  rows={5}
                  autoFocus
                  className="w-full rounded-2xl border border-ceci-border-default bg-surface-input p-3.5 text-sm text-ceci-primary placeholder:text-ceci-muted resize-none transition-shadow focus:outline-none focus:ring-2 focus:ring-ceci-brand focus:border-ceci-brand"
                />

                <div className="space-y-2 pt-1">
                  <BotaoPrimario onClick={() => salvarCampo(step.index)}>
                    salvar e seguir
                  </BotaoPrimario>
                  <BotaoFantasma onClick={() => pularCampo(step.index)}>
                    desisti da ideia
                  </BotaoFantasma>
                </div>
              </div>
            )}

            {step.kind === 'done' && (
              <div className="text-center px-6 py-8 space-y-4">
                <div className="relative mx-auto w-24 h-24 rounded-full bg-surface-rose border border-ceci-border-brand flex items-center justify-center">
                  <Mascote expression="celebrate-small" className="w-16 h-16" decorative />
                </div>
                <div className="space-y-1.5">
                  <h3
                    id="complete-log-title"
                    className="font-display font-bold text-xl text-ceci-primary leading-tight"
                  >
                    {titulo}
                  </h3>
                  <p className="text-sm text-ceci-primary font-semibold">
                    {salvos.length > 0
                      ? `registro atualizado com ${salvos.length === 1 ? '1 campo' : `${salvos.length} campos`} ♡`
                      : 'nada mudou por aqui — tudo certo ♡'}
                  </p>
                  <p className="text-xs text-ceci-secondary leading-relaxed">
                    {salvos.length > 0
                      ? 'obrigada por completar o registro — a supervisão agradece depois ♡'
                      : 'quando quiser, é só abrir de novo pelo card.'}
                  </p>
                </div>
                <div className="pt-1">
                  <BotaoPrimario onClick={close}>concluir</BotaoPrimario>
                </div>
              </div>
            )}
          </motion.div>
      </div>
    </Modal>
  );
};