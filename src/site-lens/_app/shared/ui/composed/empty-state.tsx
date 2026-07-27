interface EmptyStateProps {
  className?: string;
  title?: string;
  description?: string;
}

export const EmptyState = ({className = '', title = 'No data', description}: EmptyStateProps) => (
  <div className={`flex h-full w-full flex-col items-center justify-center gap-1 text-center ${className}`}>
    <div className="text-sm font-medium opacity-80">{title}</div>
    {description && <div className="text-xs opacity-60">{description}</div>}
  </div>
);

export default EmptyState;
