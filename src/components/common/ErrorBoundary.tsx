import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-surface-canvas p-6">
          <div className="max-w-md w-full bg-surface-card border border-border-subtle rounded-3xl p-6 shadow-xl text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="font-serif-title text-xl font-bold text-brand-espresso mb-2">
              Terjadi Kendala Tampilan
            </h2>
            <p className="text-xs text-secondary leading-relaxed mb-6">
              Halaman ini mengalami kendala render sementara. Data transaksi Anda tetap aman di sistem.
            </p>
            {this.state.error?.message && (
              <div className="w-full p-3 rounded-xl bg-surface-container-low text-red-600 font-mono text-[11px] mb-6 text-left break-all">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl border border-border-strong text-brand-espresso text-xs font-bold hover:bg-surface-container transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Coba Lagi
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-brand-gold text-brand-espresso text-xs font-bold shadow-md hover:bg-brand-gold-hover transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Muat Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
