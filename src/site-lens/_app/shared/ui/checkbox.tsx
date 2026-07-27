interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

// shadcn-style checkbox (checked + onCheckedChange).
export const Checkbox = ({checked = false, onCheckedChange, disabled, className = '', id}: CheckboxProps) => (
  <button
    type="button"
    role="checkbox"
    id={id}
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange?.(!checked)}
    className={`grid h-4 w-4 place-items-center rounded border transition-colors ${
      checked ? 'border-[#7F4EAD] bg-[#7F4EAD] text-white' : 'border-white/30 bg-transparent'
    } ${disabled ? 'opacity-50' : ''} ${className}`}
  >
    {checked && (
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2.5 6.5l2.5 2.5 4.5-5" />
      </svg>
    )}
  </button>
);

export default Checkbox;
