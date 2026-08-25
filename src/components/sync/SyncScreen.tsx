import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Keyboard,
  Loader2,
  MonitorSmartphone,
  QrCode,
  RefreshCw,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatPairCode,
  generatePairCode,
  isValidPairCode,
  normalizePairCode,
  parseQrPayload,
  qrPayloadFor,
} from '../../lib/sync/pairing';
import { scanQrPayload } from '../../lib/sync/scanQr';
import {
  resolveSyncTransport,
  SyncPreview,
  SyncRole,
} from '../../lib/sync/transport-bridge';

/**
 * Sincronização entre dispositivos (Fase Sync S3).
 *
 * UI completa do fluxo de pareamento P2P. A conexão em si depende do
 * transporte (Fase S2, pausada) — enquanto `resolveSyncTransport()` devolve
 * `null`, a tela mostra o aviso carinhoso no momento de conectar. Quando a S2
 * entrar, nenhum ajuste aqui é necessário. Ver `docs/device-sync-plano.md`.
 */
type Phase =
  | 'choose'
  | 'host'
  | 'join'
  | 'connecting'
  | 'preview'
  | 'applying'
  | 'done'
  | 'unavailable'
  | 'error';

const CONNECT_TIMEOUT_MS = 60_000;

/** Card base reutilizado entre os passos. */
const StepCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm ${className}`}>
    {children}
  </div>
);

export const SyncScreen: React.FC = () => {
  const { closeSyncScreen, showToast } = useApp();
  const [phase, setPhase] = useState<Phase>('choose');
  const [role, setRole] = useState<SyncRole>('host');
  const [code, setCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      resolveSyncTransport()?.close();
    },
    []
  );

  /** QR do host gerado sob demanda (chunk separado). */
  useEffect(() => {
    if (phase !== 'host' || !code) return;
    let cancelled = false;
    import('qrcode')
      .then((mod) => mod.default.toDataURL(qrPayloadFor(code), { margin: 1, width: 480 }))
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [phase, code]);

  const backToChoose = useCallback(() => {
    resolveSyncTransport()?.close();
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setPhase('choose');
    setQrDataUrl(null);
    setInputCode('');
    setPreview(null);
    setErrorMsg('');
  }, []);

  const startHost = useCallback(() => {
    setRole('host');
    setCode(generatePairCode());
    setPhase('host');
  }, []);

  const startJoin = useCallback(() => {
    setRole('join');
    setPhase('join');
    setInputCode('');
  }, []);

  const handleConnect = useCallback(
    async (pairCode: string) => {
      const transport = resolveSyncTransport();
      if (!transport) {
        // Fase S2 pendente: transporte ainda não implementado.
        setPhase('unavailable');
        return;
      }
      setRole('join');
      setPhase('connecting');
      setErrorMsg('');
      try {
        await transport.connect(pairCode);
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
        // A troca de payloads + cálculo do merge acontece no engine da Fase S2
        // (getSyncPayloadJson → exchange → mergeSyncedDatabases → preview).
        setPhase('preview');
      } catch {
        setPhase('error');
        setErrorMsg('não deu para conectar agora — confira a internet nos dois dispositivos e tente de novo ♡');
      }
    },
    []
  );

  const beginJoinWithTimeout = useCallback(() => {
    const clean = normalizePairCode(inputCode);
    if (!isValidPairCode(clean)) {
      showToast('digita o código de 6 letras que aparece no outro dispositivo ♡');
      return;
    }
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      resolveSyncTransport()?.close();
      setPhase('error');
      setErrorMsg('o outro dispositivo não apareceu — confirme que o código é o mesmo e tente de novo ♡');
    }, CONNECT_TIMEOUT_MS);
    void handleConnect(clean);
  }, [inputCode, handleConnect, showToast]);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const payload = await scanQrPayload({ header: 'escanear o QR do cantinho' });
      if (!payload) return; // cancelou / sem QR
      const parsed = parseQrPayload(payload);
      if (!parsed) {
        showToast('esse QR não é de sincronização do cantinho ♡');
        return;
      }
      setInputCode(formatPairCode(parsed));
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        resolveSyncTransport()?.close();
        setPhase('error');
        setErrorMsg('a conexão demorou demais — tente de novo ♡');
      }, CONNECT_TIMEOUT_MS);
      await handleConnect(parsed);
    } catch {
      /* permissão negada/cancelamento — fica na tela */
    } finally {
      setIsScanning(false);
    }
  }, [handleConnect, showToast]);

  return (
    <div className="min-h-full pb-10">
      {/* topbar própria (tela empilhada sobre o perfil) */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-1">
        <button
          onClick={phase === 'choose' ? closeSyncScreen : backToChoose}
          aria-label="voltar"
          className="touch-target w-11 h-11 -ml-2 rounded-2xl flex items-center justify-center text-ceci-secondary hover:bg-surface-muted active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-ceci-primary">
          sincronizar dispositivos
        </h1>
      </div>

      <div className="px-5 space-y-4">
        {phase === 'choose' && (
          <>
            <StepCard>
              <div className="flex items-center gap-2 mb-1">
                <MonitorSmartphone className="w-4 h-4 text-ceci-brand-strong" />
                <h2 className="font-display font-bold text-lg text-ceci-primary">
                  levar o cantinho para outro aparelho
                </h2>
              </div>
              <p className="text-xs text-ceci-secondary leading-relaxed">
                conecte seu celular e seu computador direto, sem servidor e sem nuvem — os dados
                continuam só seus, nos dois cantinhos ♡
              </p>
            </StepCard>

            <button
              onClick={startHost}
              className="w-full text-left rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm hover:border-ceci-border-brand transition-colors cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5 text-ceci-brand-strong" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-bold text-sm text-ceci-primary">
                    mostrar um código neste dispositivo
                  </span>
                  <span className="block text-xs text-ceci-secondary leading-relaxed mt-0.5">
                    aparece um QR code para você escanear com o celular
                  </span>
                </span>
              </div>
            </button>

            <button
              onClick={startJoin}
              className="w-full text-left rounded-[24px] p-5 bg-white border border-ceci-border-default shadow-sm hover:border-ceci-border-academic transition-colors cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-2xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center shrink-0">
                  <ScanLine className="w-5 h-5 text-ceci-academic-strong" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-bold text-sm text-ceci-primary">
                    conectar a outro dispositivo
                  </span>
                  <span className="block text-xs text-ceci-secondary leading-relaxed mt-0.5">
                    escaneie o QR ou digite o código que está aparecendo lá
                  </span>
                </span>
              </div>
            </button>

            <p className="text-[11px] text-ceci-muted text-center leading-relaxed px-4">
              os dois dispositivos precisam estar com internet. nada é enviado para servidores — a
              conversa é direta entre eles ♡
            </p>
          </>
        )}

        {phase === 'host' && (
          <StepCard className="flex flex-col items-center text-center">
            <h2 className="font-display font-bold text-base text-ceci-primary mb-1">
              escaneie este código
            </h2>
            <p className="text-xs text-ceci-secondary leading-relaxed mb-4">
              no outro dispositivo, toque em “conectar a outro dispositivo”
            </p>

            <div className="w-56 h-56 rounded-[20px] bg-white border border-ceci-border-default shadow-sm flex items-center justify-center overflow-hidden mb-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR code de pareamento" className="w-full h-full object-contain" />
              ) : (
                <Loader2 className="w-6 h-6 animate-spin text-ceci-muted" />
              )}
            </div>

            <p className="text-[11px] uppercase tracking-wider text-ceci-muted mb-1">ou digite o código</p>
            <p className="font-mono text-2xl tracking-[0.2em] text-ceci-primary font-semibold mb-4">
              {formatPairCode(code)}
            </p>

            <div className="flex items-center gap-2 text-xs text-ceci-secondary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              aguardando o outro dispositivo…
            </div>

            <button
              onClick={() => setCode(generatePairCode())}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ceci-brand-strong hover:text-ceci-primary cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              gerar outro código
            </button>
          </StepCard>
        )}

        {phase === 'join' && (
          <StepCard>
            <h2 className="font-display font-bold text-base text-ceci-primary mb-1">conectar</h2>
            <p className="text-xs text-ceci-secondary leading-relaxed mb-4">
              escaneie o QR code que aparece no outro dispositivo — ou digite o código de 6 letras
            </p>

            <button
              onClick={() => void handleScan()}
              disabled={isScanning}
              className="w-full flex items-center justify-center gap-2 bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong px-4 py-3 rounded-2xl text-sm font-semibold tap-interactive cursor-pointer hover:bg-ceci-academic-strong hover:text-white transition-colors disabled:opacity-60"
            >
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              {isScanning ? 'abrindo a câmera…' : 'escanear QR code'}
            </button>

            <div className="flex items-center gap-3 my-4">
              <span className="flex-1 h-px bg-ceci-border-subtle" />
              <span className="text-[11px] uppercase tracking-wider text-ceci-muted">ou</span>
              <span className="flex-1 h-px bg-ceci-border-subtle" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="w-4 h-4 text-ceci-muted shrink-0" />
              <input
                value={inputCode}
                onChange={(e) => {
                  const clean = normalizePairCode(e.target.value).slice(0, 6);
                  setInputCode(formatPairCode(clean));
                }}
                placeholder="XXX-XXX"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                aria-label="código de pareamento"
                className="flex-1 min-w-0 rounded-xl border border-ceci-border-default px-4 py-3 font-mono text-lg tracking-[0.2em] uppercase text-ceci-primary placeholder:text-ceci-muted focus:outline-none focus:border-ceci-border-brand bg-white"
              />
            </div>

            <button
              onClick={beginJoinWithTimeout}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-ceci-brand-strong hover:bg-ceci-primary cursor-pointer active:scale-95 transition-all"
            >
              conectar
            </button>
          </StepCard>
        )}

        {phase === 'connecting' && (
          <StepCard className="flex flex-col items-center text-center py-8">
            <Loader2 className="w-7 h-7 animate-spin text-ceci-brand-strong mb-3" />
            <h2 className="font-display font-bold text-base text-ceci-primary mb-1">conectando…</h2>
            <p className="text-xs text-ceci-secondary leading-relaxed max-w-[260px]">
              achamos seu par! estamos preparando a conversa direta entre os dispositivos ♡
            </p>
          </StepCard>
        )}

        {(phase === 'preview' || phase === 'applying') && (
          <StepCard>
            <h2 className="font-display font-bold text-base text-ceci-primary mb-1">
              tudo prontinho para juntar
            </h2>
            <p className="text-xs text-ceci-secondary leading-relaxed mb-4">
              vamos somar os dois cantinhos: nada se perde — o que for mais recente vence ♡
            </p>
            {preview && (
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <StatsBadge label="você recebe" stats={preview.local} tone="receive" />
                <StatsBadge label="você envia" stats={preview.remote} tone="send" />
              </div>
            )}
            <button
              disabled={phase === 'applying'}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-ceci-brand-strong hover:bg-ceci-primary cursor-pointer active:scale-95 transition-all disabled:opacity-60"
            >
              {phase === 'applying' ? 'juntando…' : 'juntar os cantinhos'}
            </button>
          </StepCard>
        )}

        {phase === 'done' && (
          <StepCard className="flex flex-col items-center text-center py-8">
            <CheckCircle2 className="w-9 h-9 text-green-700 mb-3" />
            <h2 className="font-display font-bold text-base text-ceci-primary mb-1">
              prontinho, seus dois cantinhos estão iguais ♡
            </h2>
            <p className="text-xs text-ceci-secondary leading-relaxed max-w-[260px]">
              pode continuar por onde quiser — os dados estão nos dois dispositivos
            </p>
          </StepCard>
        )}

        {phase === 'unavailable' && (
          <StepCard className="flex flex-col items-center text-center py-8">
            <Sparkles className="w-8 h-8 text-ceci-brand-strong mb-3" />
            <h2 className="font-display font-bold text-base text-ceci-primary mb-1">
              a conexão está sendo preparada
            </h2>
            <p className="text-xs text-ceci-secondary leading-relaxed max-w-[280px] mb-4">
              a parte que conecta os dispositivos ainda não chegou nesta versão do cantinho — já já
              está disponível ♡
            </p>
            <button
              onClick={backToChoose}
              className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-ceci-secondary bg-white border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
            >
              voltar
            </button>
          </StepCard>
        )}

        {phase === 'error' && (
          <StepCard className="flex flex-col items-center text-center py-8">
            <h2 className="font-display font-bold text-base text-ceci-primary mb-1">
              ops, não deu dessa vez
            </h2>
            <p className="text-xs text-ceci-secondary leading-relaxed max-w-[280px] mb-4">{errorMsg}</p>
            <div className="flex gap-2 w-full max-w-[280px]">
              <button
                onClick={backToChoose}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-white border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
              >
                voltar
              </button>
              <button
                onClick={() => {
                  setPhase(role === 'host' ? 'host' : 'join');
                }}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white bg-ceci-brand-strong hover:bg-ceci-primary cursor-pointer active:scale-95 transition-transform"
              >
                tentar de novo
              </button>
            </div>
          </StepCard>
        )}
      </div>
    </div>
  );
};

/** Badge compacto com as contagens +/~/− de um lado do merge. */
const StatsBadge: React.FC<{
  label: string;
  stats: SyncPreview['local'];
  tone: 'receive' | 'send';
}> = ({ label, stats, tone }) => (
  <div
    className={`rounded-2xl border px-3 py-2.5 ${
      tone === 'receive' ? 'bg-surface-rose border-ceci-border-brand' : 'bg-surface-blue border-ceci-border-academic'
    }`}
  >
    <p className={`text-[11px] font-semibold mb-1 ${tone === 'receive' ? 'text-ceci-brand-strong' : 'text-ceci-academic-strong'}`}>
      {label}
    </p>
    <p className="text-xs text-ceci-secondary leading-relaxed">
      +{stats.added} novos · ~{stats.updated} alterados · −{stats.removed} removidos
    </p>
  </div>
);

export default SyncScreen;
