import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type FeedbackTone = 'success' | 'warning' | 'error' | 'info';

interface FeedbackMessageInput {
  title: string;
  description?: string;
  tone?: FeedbackTone;
  durationMs?: number;
}

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Extract<FeedbackTone, 'warning' | 'error' | 'info'>;
}

interface FeedbackMessage extends Required<Omit<FeedbackMessageInput, 'durationMs'>> {
  id: number;
  durationMs: number;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface FeedbackContextValue {
  showMessage: (input: FeedbackMessageInput) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const toneStyles: Record<
  FeedbackTone,
  {
    icon: typeof CheckCircle2;
    cardClassName: string;
    iconClassName: string;
    buttonClassName: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    cardClassName: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    iconClassName: 'text-emerald-500',
    buttonClassName: 'bg-emerald-600 hover:bg-emerald-700',
  },
  warning: {
    icon: AlertTriangle,
    cardClassName: 'border-amber-200 bg-amber-50 text-amber-900',
    iconClassName: 'text-amber-500',
    buttonClassName: 'bg-amber-600 hover:bg-amber-700',
  },
  error: {
    icon: AlertCircle,
    cardClassName: 'border-red-200 bg-red-50 text-red-900',
    iconClassName: 'text-red-500',
    buttonClassName: 'bg-red-600 hover:bg-red-700',
  },
  info: {
    icon: Info,
    cardClassName: 'border-sky-200 bg-sky-50 text-sky-900',
    iconClassName: 'text-sky-500',
    buttonClassName: 'bg-sky-600 hover:bg-sky-700',
  },
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const nextIdRef = useRef(1);
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const removeMessage = useCallback((messageId: number) => {
    setMessages((current) => current.filter((message) => message.id !== messageId));
  }, []);

  const showMessage = useCallback(
    ({ title, description, tone = 'info', durationMs = 3200 }: FeedbackMessageInput) => {
      const messageId = nextIdRef.current;
      nextIdRef.current += 1;

      setMessages((current) => [
        ...current,
        {
          id: messageId,
          title,
          description: description ?? '',
          tone,
          durationMs,
        },
      ]);

      window.setTimeout(() => {
        removeMessage(messageId);
      }, durationMs);
    },
    [removeMessage],
  );

  const showConfirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        ...options,
        resolve,
      });
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      showMessage,
      showConfirm,
    }),
    [showConfirm, showMessage],
  );

  const closeConfirm = useCallback((accepted: boolean) => {
    setConfirmState((current) => {
      current?.resolve(accepted);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      setConfirmState((current) => {
        current?.resolve(false);
        return null;
      });
    };
  }, []);

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed right-5 top-5 z-[70] flex w-full max-w-sm flex-col gap-3">
        {messages.map((message) => {
          const style = toneStyles[message.tone];
          const Icon = style.icon;

          return (
            <div
              key={message.id}
              className={`pointer-events-auto rounded-3xl border px-4 py-4 shadow-[0_20px_60px_rgba(17,24,39,0.12)] ${style.cardClassName}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClassName}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{message.title}</p>
                  {message.description ? (
                    <p className="mt-1 text-sm leading-6 opacity-80">{message.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="메시지 닫기"
                  className="rounded-full p-1 opacity-60 transition hover:bg-white/70 hover:opacity-100"
                  onClick={() => removeMessage(message.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {confirmState ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-line bg-white p-6 shadow-[0_30px_90px_rgba(17,24,39,0.2)]">
            <div className="flex items-start gap-3">
              {(() => {
                const tone = confirmState.tone ?? 'warning';
                const Icon = toneStyles[tone].icon;
                return (
                  <Icon
                    className={`mt-1 h-6 w-6 shrink-0 ${toneStyles[tone].iconClassName}`}
                  />
                );
              })()}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black tracking-tight text-gray-950">
                  {confirmState.title}
                </h2>
                {confirmState.description ? (
                  <p className="mt-2 text-sm leading-6 text-muted">{confirmState.description}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-2xl border border-line px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                onClick={() => closeConfirm(false)}
              >
                {confirmState.cancelLabel ?? '취소'}
              </button>
              <button
                type="button"
                className={`rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition ${
                  toneStyles[confirmState.tone ?? 'warning'].buttonClassName
                }`}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmLabel ?? '확인'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider.');
  }

  return context;
}
