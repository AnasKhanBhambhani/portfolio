import type {ChangeEvent, ReactNode} from 'react';

interface FormCheckboxProps {
  checked?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  labelClassName?: string;
  primary?: string;
  transparent?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

// App form-checkbox: native input + optional label children, `onChange` event.
export const Checkbox = ({checked = false, onChange, className = '', labelClassName = '', disabled, children}: FormCheckboxProps) => (
  <label className={`inline-flex cursor-pointer items-center gap-2 ${className}`}>
    <input
      type="checkbox"
      className="h-4 w-4 accent-[#7F4EAD]"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
    />
    {children != null && <span className={labelClassName}>{children}</span>}
  </label>
);

export default Checkbox;
