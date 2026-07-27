import { Component } from "react";

// A WebGL/3D failure inside a lazily-loaded graph (GPU blocklisted, context
// creation refused, driver crash) throws during render. Without a boundary
// that error propagates to the root and unmounts the entire app — the whole
// page goes black. This catches it and shows an inline fallback instead, so
// only the graph panel is affected.
export default class GraphErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, detail: "" };
  }

  static getDerivedStateFromError(error) {
    return { failed: true, detail: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    // Surface the real cause in the console for diagnosis — the on-screen
    // message stays friendly, but this line has the actual error + stack.
    // eslint-disable-next-line no-console
    console.error("[graph] view failed to render:", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Reset when the user switches to a different tab so a previously-failed
    // view doesn't stay stuck on the fallback.
    if (prevProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false, detail: "" });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="h-full w-full grid place-items-center p-8 text-center">
          <div className="max-w-90">
            <p className="text-muted text-sm">
              This view couldn&apos;t load. Try switching tabs, or refresh the page.
            </p>
            {this.state.detail && (
              <p className="mt-3 text-muted-2 text-[11px] font-mono wrap-break-word">{this.state.detail}</p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
