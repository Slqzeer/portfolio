import { Component, type ReactNode } from "react";

export class SceneBoundary extends Component<
  {
    children: ReactNode;
    onError: (error: Error) => void;
    fallback?: ReactNode;
  },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed
      ? (this.props.fallback ?? null)
      : this.props.children;
  }
}
