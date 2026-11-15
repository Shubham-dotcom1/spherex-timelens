import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Compass, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SPHEREx TimeLens Uncaught Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    // Clear URL parameters if corrupted and reload
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-lg w-full bg-space-900/90 border border-red-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-wide">
                SPHEREx Observatory Signal Interrupted
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected telemetry exception occurred while rendering the astronomical pipeline.
                Telemetry details are captured below.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-space-950/80 border border-space-800 rounded-lg p-3 text-left font-mono text-[11px] text-red-300 max-h-36 overflow-auto">
                <div className="font-semibold text-red-400 mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-500 whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Re-align Optics & Reload</span>
              </button>
              <a
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-space-800 hover:bg-space-700 text-slate-300 font-medium text-xs border border-space-700 transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Reset to NEP Field</span>
              </a>
            </div>

            <div className="text-[10px] text-slate-500 font-mono">
              Team CodeGenesis • NASA Space Apps Challenge 2026
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
