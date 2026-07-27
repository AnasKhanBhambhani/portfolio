import type {ReactNode} from 'react';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export const Dialog = ({open, onOpenChange, children}: DialogProps) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/60"
      onClick={() => onOpenChange?.(false)}
    >
      {children}
    </div>
  );
};

interface DivProps {
  className?: string;
  children: ReactNode;
}

export const DialogContent = ({className = '', children}: DivProps) => (
  <div className={`relative bg-[#1a1b1f] shadow-2xl overflow-hidden ${className}`} onClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

export const DialogHeader = ({className = '', children}: DivProps) => (
  <div className={className}>{children}</div>
);

export const DialogTitle = ({className = '', children}: DivProps) => (
  <h2 className={className}>{children}</h2>
);

export default Dialog;
