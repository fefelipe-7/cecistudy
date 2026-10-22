import React, { Component, type ErrorInfo, type ReactNode } from 'react';

import { erro } from '../../lib/voice';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  /** O erro original, só para a expansão (`D5`). */
  erro?: Error;
}

/** Captura erros de renderização sem derrubar o app (fallback acolhedor). */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, erro: error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('cecistudy error boundary:', error, info);
  }

  render() {
    const { hasError, erro: falha } = this.state;
    if (hasError) {
      // Sem contexto de perfil: esta tela vive **fora** de qualquer provider, e é
      // a pior hora possível para o app depender de estado. Sem tratamento por
      // nome, e nunca com a mensagem original no primeiro nível (`D5`, `D19`).
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center bg-canvas text-ceci-primary">
          <p className="text-3xl" aria-hidden>
            🌷
          </p>
          <h1 className="font-display font-bold text-lg">{erro('appQuebrou')}</h1>
          {falha ? (
            <details className="max-w-xs text-left">
              <summary className="cursor-pointer text-xs text-ceci-muted">
                ver detalhe técnico
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-ceci-muted">
                {falha.message}
              </pre>
            </details>
          ) : null}
          <button
            onClick={() => {
              this.setState({ hasError: false, erro: undefined });
              window.location.hash = '#/home';
            }}
            className="mt-2 px-5 py-2.5 rounded-full bg-ceci-brand-strong text-ceci-on-brand text-xs font-bold cursor-pointer active:scale-95 transition-transform"
          >
            voltar para o começo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
