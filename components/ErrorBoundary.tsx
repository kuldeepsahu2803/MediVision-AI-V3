
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  // Explicitly declare props to satisfy strict TypeScript environments
  public readonly props: Readonly<Props>;

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    if (error.message.includes('jsPDF') || error.message.includes('PubSub')) {
      console.error('PDF Generation Error Caught by Boundary:', error, errorInfo);
    }
  }

  private handleHardReset = async () => {
    if (window.confirm("This will delete all saved prescription history and reset the app. Are you sure?")) {
      try {
        // 1. Clear LocalStorage
        localStorage.clear();
        
        // 2. Clear IndexedDB (Cross-browser safe)
        if (window.indexedDB && window.indexedDB.databases) {
            try {
                const dbs = await window.indexedDB.databases();
                dbs.forEach(db => {
                    if (db.name) window.indexedDB.deleteDatabase(db.name);
                });
            } catch (e) {
                console.warn("Could not enumerate databases:", e);
            }
        }

        // 3. Force Reload
        window.location.reload();
      } catch (e) {
        console.error("Failed to reset:", e);
        alert("Could not auto-reset. Please clear your browser site data manually.");
      }
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text p-4">
          <div className="bg-light-panel dark:bg-dark-panel p-8 rounded-2xl shadow-2xl border border-red-500/20 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">System Recovery Mode</h1>
            <p className="text-light-text-mid dark:text-dark-text-mid mb-6">
              The application encountered a critical error. This is usually caused by corrupted data or a network interruption.
            </p>
            
            <div className="flex flex-col gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 rounded-lg btn-gradient text-white font-semibold shadow-lg hover:opacity-90 transition-opacity"
                >
                  Restart Application
                </button>
                
                <button 
                  onClick={this.handleHardReset}
                  className="w-full px-6 py-3 rounded-lg border-2 border-red-500/50 text-red-600 dark:text-red-400 font-semibold hover:bg-red-500/10 transition-colors"
                >
                  Hard Reset (Clear Data)
                </button>
            </div>

            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-light-text-dark dark:text-dark-text-dark cursor-pointer hover:underline">View Error Log</summary>
                <pre className="mt-2 p-3 text-[10px] bg-black/5 dark:bg-white/5 rounded-lg overflow-auto max-h-32 font-mono text-red-500">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children || null;
  }
}

export default ErrorBoundary;
