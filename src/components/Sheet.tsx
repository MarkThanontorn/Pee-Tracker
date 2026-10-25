import type { ReactNode } from 'react';

interface Props {
  title: string;
  icon?: ReactNode;
  /** Theme class such as `t-water` that sets --c / --tint for the sheet. */
  tone?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Sheet({ title, icon, tone = 't-pee', onClose, children }: Props) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className={`sheet ${tone}`} role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="sheet-title">
          {icon && <span className="ic">{icon}</span>}
          <h2>{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
