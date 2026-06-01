import { createContext, useContext } from 'react';

export type FeedbackTone = 'success' | 'warning' | 'error' | 'info';

export interface FeedbackMessageInput {
  title: string;
  description?: string;
  tone?: FeedbackTone;
  durationMs?: number;
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Extract<FeedbackTone, 'warning' | 'error' | 'info'>;
}

export interface FeedbackContextValue {
  showMessage: (input: FeedbackMessageInput) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider.');
  }

  return context;
}
