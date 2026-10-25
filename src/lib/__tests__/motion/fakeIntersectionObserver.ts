/**
 * `IntersectionObserver` falso para jsdom (que não tem o nativo).
 *
 * Vive fora de `*.test.*` de propósito: é usado por `reveal.test.tsx` e por
 * `Ambient.test.tsx`, e o Vitest não coleta arquivo sem `test` no nome.
 */
export class FakeIntersectionObserver implements IntersectionObserver {
  static last: FakeIntersectionObserver | null = null;
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: number[] = [];
  targets = new Set<Element>();
  disconnected = false;

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.last = this;
  }

  observe(target: Element) {
    this.targets.add(target);
  }

  unobserve(target: Element) {
    this.targets.delete(target);
  }

  disconnect() {
    this.disconnected = true;
    this.targets.clear();
  }

  takeRecords() {
    return [];
  }

  /** Entrega a mudança para todos os alvos observados. */
  trigger(isIntersecting: boolean) {
    this.callback(
      [...this.targets].map(
        (target) => ({ target, isIntersecting }) as IntersectionObserverEntry,
      ),
      this,
    );
  }
}
