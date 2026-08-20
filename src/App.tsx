import { Component, type ErrorInfo, type ReactNode } from "react";
import { AppShell } from "./ui/layout/AppShell";
import { createLogger } from "./lib/log";
import { LegacyUiTranslator } from "./i18n/LegacyUiTranslator";

const log = createLogger("app");

/** Error boundary cấp app (mục 24) — 1 lỗi render không kéo sập trắng màn hình. */
class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error("Lỗi render chưa bắt được", { error, info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="glass-strong max-w-md px-6 py-8 text-center">
            <h2 className="font-display mb-2 text-lg text-[var(--danger)]">Đã xảy ra lỗi giao diện</h2>
            <p className="mb-4 break-words text-sm text-[var(--text-muted)]">{this.state.error.message}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-md border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm text-[var(--text-soft)] hover:bg-[var(--glass-bg-hover)]"
            >
              Thử tải lại giao diện
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <LegacyUiTranslator />
      <AppShell />
    </AppErrorBoundary>
  );
}
