import { useEffect } from 'react';

export interface ToastAction {
  label: string;
  on?: boolean;
  warn?: boolean;
  onClick: () => void;
}

export interface ToastData {
  id: number;
  message: string;
  actions: ToastAction[];
}

/** Auto-dismisses after 6 s; the timer restarts whenever the toast content changes. */
export default function Toast({ toast, onDone }: { toast: ToastData; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 6000);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  return (
    <div className="toast" role="status">
      <div className="msg">{toast.message}</div>
      <div className="chips">
        {toast.actions.map((a) => (
          <button key={a.label} className={`chip${a.on ? ' on' : ''}${a.warn ? ' warn' : ''}`} onClick={a.onClick}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
