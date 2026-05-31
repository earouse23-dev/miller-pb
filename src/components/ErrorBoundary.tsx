import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[miller-pb] Uncaught error:', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg-primary px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15">
            <AlertTriangle className="h-7 w-7 text-danger" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-content-primary">Something went wrong</h1>
            <p className="mt-1 max-w-sm text-sm text-content-secondary">
              {this.state.error.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <Button onClick={() => (window.location.href = '/')}>Return to Home</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
