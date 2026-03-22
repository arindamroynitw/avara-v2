"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary for chat message components.
 * Catches rendering errors in individual messages without crashing the entire chat.
 */
export class MessageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Message render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="ml-10 my-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle size={14} />
            <span>This message couldn&apos;t be displayed</span>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="ml-auto p-1 hover:bg-red-100 rounded cursor-pointer"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
