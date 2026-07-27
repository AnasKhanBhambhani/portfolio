interface SliderProps {
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  onValueChange?: (value: number[]) => void;
  disabled?: boolean;
}

// Single-thumb Radix-style slider backed by a native range input. Reads/writes
// value[0]; the dual-thumb metric filter uses its own component, not this one.
export const Slider = ({className = '', min = 0, max = 100, step = 1, value = [0], onValueChange, disabled}: SliderProps) => (
  <input
    type="range"
    className={`site-lens-slider w-full ${className}`}
    min={min}
    max={max}
    step={step}
    value={value[0] ?? 0}
    disabled={disabled}
    onChange={(e) => onValueChange?.([Number(e.target.value)])}
  />
);

export default Slider;
