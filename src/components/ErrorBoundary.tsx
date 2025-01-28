import React from "react";

interface ErrorBoundaryProps {
  fallback: React.ReactNode; // UI to display when an error occurs
  children: React.ReactNode; // The normal UI
}

interface ErrorBoundaryState {
  hasError: boolean; // Tracks if an error occurred
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state to show fallback UI on error
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error details for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI when an error occurs
      return this.props.fallback;
    }
    // Render normal children when there’s no error
    return this.props.children;
  }
}

export default ErrorBoundary;