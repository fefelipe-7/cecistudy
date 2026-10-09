import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Trash2, ExternalLink, Plus } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { StatusChip } from '../ui/StatusChip';
import { TagChip } from '../ui/TagChip';
import { hapticSuccess, hapticTap } from '../../lib/haptics';
import { copyToClipboard } from '../../lib/utils';
import {
  THESIS_ID,
  newReferenceId,
  parseAuthorString,
  abntDataFromReading,
  formatAbnt,
  toPlainText,
  validateRef,
  type RefAuthor,
  type RefStatus,
  type RefType,
  type ThesisReference,
} from '../../types';

/**
 * Sheet da referência (SPEC-012 F7.3 / ADR-010) — a obra mora no `ReadingItem`
 * (estante, dono Biblioteca); a `ThesisReference` é o ato de citar (status,
 * capítulos onde usada, nota).
 *
 * - `'new'` → escolhe uma leitura da estante que ainda não virou referência.
 * - id → edita a referência viva (nunca guarda cópia do objeto: o modal da
 *   SPEC-009 `U5` congelava o estado velho). Os campos de formulário são locais.
 *
 * Uma escrita por coleção por ação: editar faz **uma** escrita em
 * `thesisReferences` (status/capítulos/nota) e **uma** em `readings` (dados
 * bibliográficos) — o precedente é o `ChapterSheet.remove`, que também escreve
 * nas duas coleções.
 */
interface ReferenceSheetProps {
  open: boolean;
  /** `'new'` cria; qualquer outro id edita. */
  referenceId: string | 'new' | null;
  onClose: () => void;
}

const inputClass =
  'w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand';
const labelClass = 'block text-xs font-medium text-ceci-secondary mb-1';

const STATUS_OPTIONS: { value: RefStatus; label: string }[] = [
  { value: 'candidata', label: 'candidata' },
  { value: 'lida', label: 'lida' },
  { value: 'citada', label: 'citada' },
  { value: 'descartada', label: 'descartada' },
];

const REF_TYPE_OPTIONS: { value: RefType; label: string }[] = [
  { value: 'artigo', label: 'artigo' },
  { value: 'livro', label: 'livro' },
  { value: 'capitulo', label: 'capítulo' },
  { value: 'site', label: 'site' },
  { value: 'tese', label: 'tese' },
  { value: 'outro', label: 'outro' },
];

const TYPE_TO_REF: Record<'livro' | 'artigo' | 'capitulo' | 'pdf', RefType> = {
  livro: 'livro',
  artigo: 'artigo',
  capitulo: 'capitulo',
  pdf: 'outro',
};

/** "Sobrenome, Nome" por autor — o inverso do `parseAuthorString`. */
const authorToText = (a: RefAuthor): string => (a.given ? `${a.family}, ${a.given}` : a.family);

/** Aceita "Sobrenome, Nome; Outro, Fulano" → autores estruturados (sem adivinhar). */
const parseAuthorText = (raw: string): RefAuthor[] => {
  const parsed = raw
    .split(';')
    .map((s) => parseAuthorString(s))
    .filter((a): a is RefAuthor => a !== null);
  return parsed.length > 0 ? parsed : [];
};

export const ReferenceSheet: React.FC<ReferenceSheetProps> = ({ open, referenceId, onClose }) => {
  const {
    readings,
    thesisReferences,
    thesisChapters,
    setReadings,
    setThesisReferences,
    showToast,
  } = useMobileApp();

  const live =
    referenceId === 'new' || referenceId === null
      ? undefined
      : thesisReferences.find((r) => r.id === referenceId);
  const reading = useMemo(
    () => (live ? readings.find((r) => r.id === live.readingId) : undefined),
    [live, readings],
  );

  const [filter, setFilter] = useState('');
  // ---- campos de formulário (locais; o save constrói as entidades) ----
  const [status, setStatus] = useState<RefStatus>('candidata');
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [refType, setRefType] = useState<RefType>('outro');
  const [authorsText, setAuthorsText] = useState('');
  const [year, setYear] = useState('');
  const [container, setContainer] = useState('');
  const [publisher, setPublisher] = useState('');
  const [place, setPlace] = useState('');
  const [edition, setEdition] = useState('');
  const [volume, setVolume] = useState('');
  const [issue, setIssue] = useState('');
  const [pages, setPages] = useState('');
  const [doi, setDoi] = useState('');
  const [accessedOn, setAccessedOn] = useState('');
  const [url, setUrl] = useState('');
  const [rawCitation, setRawCitation] = useState('');
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStatus(live?.status ?? 'candidata');
    setChapterIds(live?.chapterIds ?? []);
    setNote(live?.note ?? '');
    setRefType(reading?.refType ?? (reading ? TYPE_TO_REF[reading.type] : 'outro'));
    setAuthorsText(reading?.authors?.map(authorToText).join('; ') ?? '');
    setYear(reading?.year ?? '');
    setContainer(reading?.container ?? '');
    setPublisher(reading?.publisher ?? '');
    setPlace(reading?.place ?? '');
    setEdition(reading?.edition ?? '');
    setVolume(reading?.volume ?? '');
    setIssue(reading?.issue ?? '');
    setPages(reading?.pages ?? '');
    setDoi(reading?.doi ?? '');
    setAccessedOn(reading?.accessedOn ?? '');
    setUrl(reading?.url ?? '');
    setRawCitation(reading?.rawCitation ?? '');
    setFilter('');
    setConfirmingRemove(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, referenceId]);

  // Leitura "ffa" com os campos de formulário → a forma ABNT já espera.
  const draftReadingSource = useMemo(
    () => ({
      type: (reading?.type ?? 'artigo') as 'livro' | 'artigo' | 'capitulo' | 'pdf',
      refType,
      title: reading?.title ?? '',
      author: reading?.author,
      authors: parseAuthorText(authorsText),
      rawCitation: rawCitation.trim() || undefined,
      year: year.trim() || undefined,
      container: container.trim() || undefined,
      publisher: publisher.trim() || undefined,
      place: place.trim() || undefined,
      edition: edition.trim() || undefined,
      volume: volume.trim() || undefined,
      issue: issue.trim() || undefined,
      pages: pages.trim() || undefined,
      doi: doi.trim() || undefined,
      accessedOn: accessedOn || undefined,
      url: url.trim() || undefined,
    }),
    [
      reading,
      refType,
      rawCitation,
      authorsText,
      year,
      container,
      publisher,
      place,
      edition,
      volume,
      issue,
      pages,
      doi,
      accessedOn,
      url,
    ],
  );

  const dataForAbnt = useMemo(() => abntDataFromReading(draftReadingSource), [draftReadingSource]);
  const segments = useMemo(() => formatAbnt(dataForAbnt), [dataForAbnt]);
  const plain = useMemo(() => toPlainText(segments), [segments]);
  const missing = useMemo(() => validateRef(dataForAbnt), [dataForAbnt]);

  // Leituras que ainda não viraram referência (dedupe por `readingId`).
  const candidates = useMemo(() => {
    const referenced = new Set(thesisReferences.map((r) => r.readingId));
    const q = filter.trim().toLowerCase();
    return readings
      .filter((r) => !referenced.has(r.id))
      .filter(
        (r) =>
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q),
      )
      .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  }, [readings, thesisReferences, filter]);

  const copy = async () => {
    const ok = await copyToClipboard(plain);
    if (ok) {
      hapticSuccess();
      showToast('referência copiada ♡');
    }
  };

  const toggleChapter = (id: string) =>
    setChapterIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );

  const save = () => {
    if (!reading) return;
    const now = new Date().toISOString();
    // **Uma** escrita por coleção: o vínculo…
    setThesisReferences((prev) => {
      const draft: ThesisReference = live
        ? { ...live, status, chapterIds, note: note.trim() || undefined, updatedAt: now }
        : {
            id: newReferenceId(),
            thesisId: THESIS_ID,
            readingId: reading.id,
            status,
            chapterIds,
            note: note.trim() || undefined,
            createdAt: now,
            updatedAt: now,
          };
      const i = prev.findIndex((r) => r.id === draft.id);
      return i === -1 ? [...prev, draft] : prev.map((r) => (r.id === draft.id ? draft : r));
    });
    // …e a obra, no dono (ADR-010). `rawCitation` cheio e os estruturados não
    // somam: se a usuária monta à mão, a citação à mão vence (`formatAbnt`).
    const authors = parseAuthorText(authorsText);
    setReadings((prev) =>
      prev.map((r) =>
        r.id === reading.id
          ? {
              ...r,
              refType,
              authors,
              year: year.trim() || undefined,
              container: container.trim() || undefined,
              publisher: publisher.trim() || undefined,
              place: place.trim() || undefined,
              edition: edition.trim() || undefined,
              volume: volume.trim() || undefined,
              issue: issue.trim() || undefined,
              pages: pages.trim() || undefined,
              doi: doi.trim() || undefined,
              accessedOn: accessedOn || undefined,
              url: url.trim() || undefined,
              rawCitation: rawCitation.trim() || undefined,
              updatedAt: now,
            }
          : r,
      ),
    );
    hapticTap();
    showToast('referência guardada ♡');
    onClose();
  };

  const remove = () => {
    if (!live) return;
    setThesisReferences((prev) => prev.filter((r) => r.id !== live.id));
    hapticTap();
    showToast('referência removida');
    onClose();
  };

  const createFromReading = (readingId: string) => {
    const now = new Date().toISOString();
    setThesisReferences((prev) => [
      ...prev,
      {
        id: newReferenceId(),
        thesisId: THESIS_ID,
        readingId,
        status: 'candidata',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    hapticTap();
    showToast('referência adicionada ♡');
    onClose();
  };

  // ---- modo "nova referência": escolhe uma leitura da estante ----
  if (referenceId === 'new') {
    return (
      <Modal open={open} onClose={onClose} position="bottom" className="w-full max-w-lg">
        <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary space-y-4">
          <h3 className="font-display font-bold text-base text-ceci-primary">
            nova referência
          </h3>
          <p className="text-xs text-ceci-secondary leading-relaxed">
            escolha uma leitura da sua estante que ainda não virou referência — a
            ficha da obra já guardada vem junto (ADR-010).
          </p>
          <div>
            <label htmlFor="ref-buscar" className={labelClass}>de qual leitura?</label>
            <input
              id="ref-buscar"
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={inputClass}
              placeholder="buscar pelo título ou autor…"
            />
          </div>
          <div className="max-h-[42vh] overflow-y-auto space-y-2">
            {candidates.length === 0 ? (
              <p className="text-xs text-ceci-tertiary bg-surface-muted rounded-xl p-4 border border-ceci-border-subtle">
                nenhuma leitura sobrando por aqui — ou todas já são referência,
                ou a estante está vazia.
              </p>
            ) : (
              candidates.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => createFromReading(r.id)}
                  className="w-full text-left bg-surface-muted rounded-xl p-3 border border-ceci-border-default hover:border-ceci-border-brand transition-colors cursor-pointer tap-interactive"
                >
                  <p className="text-sm font-medium text-ceci-primary line-clamp-2">{r.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] text-ceci-secondary truncate">
                      {r.author || 'sem autor'}
                    </span>
                    <TagChip size="sm" variant="neutral" className="shrink-0">
                      {TYPE_TO_REF[r.type]}
                    </TagChip>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
            >
              cancelar
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  if (!live) return null;

  return (
    <Modal open={open} onClose={onClose} position="bottom" className="w-full max-w-lg">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-base text-ceci-primary">referência</h3>
          <div
            role="status"
            aria-live="polite"
            aria-label="referência copiada"
            className="sr-only"
          >
            {''}
          </div>
          <button
            type="button"
            onClick={copy}
            aria-label="copiar referência"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> copiar
          </button>
        </div>

        {/* Prévia ABNT (derivada ao vivo dos campos) + diagnóstico não bloqueante. */}
        <div className="bg-surface-muted rounded-xl p-3.5 border border-ceci-border-default">
          <p className="font-mono text-[11px] leading-relaxed text-ceci-primary">
            {segments.map((s, i) =>
              s.bold ? (
                <strong key={i} className="font-bold">{s.text}</strong>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </p>
          {missing.length > 0 && (
            <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-ceci-border-subtle">
              <span role="status" className="text-[11px] text-status-warning-strong">
                falta: {missing.map((m) => m.label).join(' · ')}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>estado</label>
          <SegmentedControl
            variant="rose"
            ariaLabel="estado da referência"
            className="w-full [&>button]:flex-1"
            value={status}
            onChange={(v) => setStatus(v)}
            options={STATUS_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ref-tipo" className={labelClass}>tipo abnt</label>
            <select
              id="ref-tipo"
              value={refType}
              onChange={(e) => setRefType(e.target.value as RefType)}
              className={inputClass}
            >
              {REF_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ref-ano" className={labelClass}>ano</label>
            <input
              id="ref-ano"
              type="text"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ref-autores" className={labelClass}>
            autores <span className="text-ceci-tertiary">(“Sobrenome, Nome; …”)</span>
          </label>
          <input
            id="ref-autores"
            type="text"
            value={authorsText}
            onChange={(e) => setAuthorsText(e.target.value)}
            className={inputClass}
            placeholder="ex.: Bowlby, John; Ainsworth, Mary"
          />
        </div>

        <div>
          <label htmlFor="ref-veiculo" className={labelClass}>periódico / site / editora</label>
          <input
            id="ref-veiculo"
            type="text"
            value={container}
            onChange={(e) => setContainer(e.target.value)}
            className={inputClass}
            placeholder="de onde a obra veio"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ref-editora" className={labelClass}>editora</label>
            <input
              id="ref-editora"
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
          <div>
            <label htmlFor="ref-lugar" className={labelClass}>lugar</label>
            <input
              id="ref-lugar"
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="ref-volume" className={labelClass}>volume</label>
            <input
              id="ref-volume"
              type="text"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className={inputClass}
              placeholder="opc."
            />
          </div>
          <div>
            <label htmlFor="ref-numero" className={labelClass}>número</label>
            <input
              id="ref-numero"
              type="text"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              className={inputClass}
              placeholder="opc."
            />
          </div>
          <div>
            <label htmlFor="ref-paginas" className={labelClass}>páginas</label>
            <input
              id="ref-paginas"
              type="text"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className={inputClass}
              placeholder="opc."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ref-doi" className={labelClass}>doi</label>
            <input
              id="ref-doi"
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
          <div>
            <label htmlFor="ref-acesso" className={labelClass}>acesso em</label>
            <input
              id="ref-acesso"
              type="date"
              value={accessedOn}
              onChange={(e) => setAccessedOn(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="ref-url" className={labelClass}>link</label>
          <input
            id="ref-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass}
            placeholder="opcional"
          />
        </div>

        <div>
          <label htmlFor="ref-mao" className={labelClass}>
            citação montada à mão <span className="text-ceci-tertiary">(vence a automática)</span>
          </label>
          <textarea
            id="ref-mao"
            rows={2}
            value={rawCitation}
            onChange={(e) => setRawCitation(e.target.value)}
            className={inputClass}
            placeholder="quando você prefere escrever a referência do seu jeito"
          />
        </div>

        {thesisChapters.length > 0 && (
          <div>
            <label className={labelClass}>onde usei</label>
            <div className="flex flex-wrap gap-1.5">
              {thesisChapters.map((ch) => {
                const on = chapterIds.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChapter(ch.id)}
                    aria-pressed={on}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors tap-interactive cursor-pointer ${
                      on
                        ? 'bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong'
                        : 'bg-surface-default text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted'
                    }`}
                  >
                    {ch.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="ref-nota" className={labelClass}>nota</label>
          <textarea
            id="ref-nota"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
            placeholder="o que essa leitura deixou no trabalho"
          />
        </div>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-ceci-academic-strong hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" /> abrir o link da obra
          </a>
        )}

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-ceci-border-subtle">
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            aria-label="remover referência"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs text-status-danger-strong hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> remover
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
            >
              cancelar
            </button>
            <button
              type="button"
              onClick={save}
              className="bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[44px] cursor-pointer"
            >
              guardar ♡
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={confirmingRemove}
        onClose={() => setConfirmingRemove(false)}
        position="bottom"
        className="w-full max-w-sm"
      >
        <div className="bg-canvas rounded-2xl border border-ceci-border-default shadow-xl p-5 text-ceci-primary space-y-3">
          <h3 className="font-display font-bold text-base leading-tight">
            remover esta referência da lista?
          </h3>
          <p className="text-xs text-ceci-secondary leading-relaxed">
            a leitura continua na sua estante — só deixa de contar como referência
            do tcc.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingRemove(false)}
              className="px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
            >
              voltar
            </button>
            <button
              type="button"
              onClick={remove}
              className="bg-status-danger hover:bg-status-danger-strong text-ceci-on-primary px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[44px] cursor-pointer"
            >
              remover mesmo assim
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};