import type { FocusEventHandler, KeyboardEventHandler } from 'react';

export function AdminToggleSwitch({
  active,
  onClick,
  disabled = false,
  onBlur,
  onKeyDown,
  autoFocus = false,
}: {
  active: boolean;
  onClick?: () => void;
  disabled?: boolean;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  autoFocus?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      className={`inline-flex h-7 w-12 items-center rounded-full p-1 transition ${
        active ? 'bg-primary' : 'bg-gray-200'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow transition ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
