import { useEffect, useRef, useState, type CSSProperties } from 'react';

// F7.3 (spec-performance §4.3): o engine three.js (~608 KB) era inlined 4× —
// uma vez por variante — no MESMO chunk (2,44 MiB). Agora ele vive UMA vez em
// `engine.js` e cada variante carrega só o que difere (~23 KB). O srcDoc é
// montado em runtime e o resultado é byte-idêntico ao HTML original.
import engineSource from './sources/engine.js?raw';
import originalBody from './sources/3d-paper.html?raw';
import certificateBody from './sources/3d-paper-certificate.html?raw';
import japaneseBody from './sources/3d-paper-japanese.html?raw';
import siteOfTheYearBody from './sources/3d-paper-site-of-the-year.html?raw';

export type ThreeDPaperVariant = 'original' | 'site-of-the-year' | 'japanese' | 'certificate';

export type ThreeDPaperProps = {
  className?: string;
  style?: CSSProperties;
  variant?: ThreeDPaperVariant;
};

/** Marcador que ocupa o lugar do engine dentro de cada corpo de variante. */
export const ENGINE_MARKER = '/*__3D_PAPER_ENGINE__*/';

/** Corpo de cada variante com o engine injetado (função no replace: sem `$`). */
const withEngine = (body: string): string => body.replace(ENGINE_MARKER, () => engineSource);

const sources: Record<ThreeDPaperVariant, string> = {
  original: withEngine(originalBody),
  'site-of-the-year': withEngine(siteOfTheYearBody),
  japanese: withEngine(japaneseBody),
  certificate: withEngine(certificateBody),
};

const titles: Record<ThreeDPaperVariant, string> = {
  original: '3D Paper',
  'site-of-the-year': '3D Paper — Site of the Year',
  japanese: '3D Paper — 認定証',
  certificate: '3D Paper — Certificate',
};

export function ThreeDPaper({ className = '', style, variant = 'original' }: ThreeDPaperProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [documentVisible, setDocumentVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );
  const [hostVisible, setHostVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setHostVisible(entry?.isIntersecting ?? true);
      },
      { rootMargin: '80px' },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  const mounted = hostVisible && documentVisible;

  useEffect(() => {
    setReady(false);
  }, [mounted, variant]);

  return (
    <div
      ref={hostRef}
      className={`threeui-background three-d-paper${className ? ` ${className}` : ''}`}
      role="group"
      aria-label="Interactive translucent 3D paper certificate"
      data-state={!mounted ? 'paused' : ready ? 'ready' : 'loading'}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#08080a',
        pointerEvents: 'auto',
        ...style,
      }}
    >
      {mounted ? (
        <iframe
          title={titles[variant]}
          srcDoc={sources[variant]}
          sandbox="allow-scripts"
          loading="eager"
          onLoad={() => setReady(true)}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            width: '100%',
            height: '100%',
            border: 0,
            background: '#08080a',
            opacity: ready ? 1 : 0,
            pointerEvents: ready ? 'auto' : 'none',
            transition: 'opacity 240ms ease-out',
          }}
        />
      ) : null}
    </div>
  );
}
