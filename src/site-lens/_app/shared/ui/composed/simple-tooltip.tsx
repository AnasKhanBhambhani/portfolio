import type {ReactNode} from 'react';

interface SimpleTooltipProps {
  title?: ReactNode;
  children: ReactNode;
  placement?: string;
  color?: string;
  overlayInnerStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

// Lightweight tooltip: wraps children and, when the title is a plain string,
// exposes it via the native `title` attribute. (The app's Ant-style tooltip
// is cosmetic here.)
export const SimpleTooltip = ({title, children}: SimpleTooltipProps) => {
  const native = typeof title === 'string' ? title : undefined;
  return (
    <span title={native} style={{display: 'contents'}}>
      {children}
    </span>
  );
};

export default SimpleTooltip;
