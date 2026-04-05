import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AUTH_SESSION_STORAGE_KEY } from '../utils/authClient';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * 捕获渲染期错误（例如损坏的 localStorage、未预期的空字段），避免整页只剩背景色却无提示。
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      const msg = this.state.error.message || String(this.state.error);
      return (
        <div
          className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#F4F3ED] text-[#2c2417]"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          <div className="max-w-lg w-full rounded-2xl border border-black/10 bg-white p-6 shadow-lg space-y-4">
            <h1 className="text-lg font-bold">界面加载失败</h1>
            <p className="text-sm text-[#5c5346] leading-relaxed">
              通常是浏览器本地数据损坏或与当前版本不兼容。可先尝试清除登录缓存后刷新；若仍失败，请打开开发者工具（F12）查看 Console 中的完整报错。
            </p>
            <pre className="text-xs text-red-700 bg-red-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
              {msg}
            </pre>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-[#2D3436] text-white text-sm font-semibold hover:bg-black"
                onClick={() => {
                  try {
                    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
                  } catch {
                    /* ignore */
                  }
                  window.location.reload();
                }}
              >
                清除登录缓存并刷新
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-full border border-black/15 text-sm font-medium hover:bg-black/5"
                onClick={() => this.setState({ error: null })}
              >
                重试渲染
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
