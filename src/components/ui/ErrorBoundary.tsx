import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Captura erros de renderização sem derrubar o app (fallback acolhedor). */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('cecistudy error boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center bg-canvas text-ceci-primary">
          <p className="text-3xl" aria-hidden>
            🌷
          </p>
          <h1 className="font-display font-bold text-lg">ops, algo quebrou aqui</h1>
          <p className="text-sm text-ceci-secondary max-w-xs leading-relaxed">
            tente voltar para a home; se continuar assim, um recarregamento deve resolver.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.hash = '#/home';
            }}
            className="mt-2 px-5 py-2.5 rounded-full bg-ceci-brand-strong text-white text-xs font-bold cursor-pointer active:scale-95 transition-transform"
          >
            voltar para o começo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
