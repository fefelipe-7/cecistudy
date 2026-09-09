// packages/navigation — engine de navegação por pilha (puro, sem React).
// Movido de src/lib (routing/quizStack) + tipos de navegação React-free de src/types.
// Bridge de domínio: NavScreen referencia tipos de quiz/temple (type-only).

export * from './types';
export * from './temple';
export * from './hash';
export * from './stack';
export * from './derive';
