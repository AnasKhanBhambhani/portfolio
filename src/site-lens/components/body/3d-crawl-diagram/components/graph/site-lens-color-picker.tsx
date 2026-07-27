import React, {useCallback, useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';

// ─── Color utilities ──────────────────────────────────────────────────────────

function hsbToRgb(h: number, s: number, b: number): [number, number, number] {
  s /= 100;
  b /= 100;
  const k = (n: number) => (n + h / 60) % 6;
  const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
}

function rgbToHsb(r: number, g: number, b: number): {h: number; s: number; b: number} {
  const rr = r / 255; const gg = g / 255; const bb = b / 255;
  const max = Math.max(rr, gg, bb); const min = Math.min(rr, gg, bb); const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d + 6) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h = Math.round(h * 60);
  }
  return {h, s: max === 0 ? 0 : Math.round((d / max) * 100), b: Math.round(max * 100)};
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ISiteLensColorPickerProps {
  value: string;
  onSave: (hex: string) => void;
  isDark?: boolean;
}

const POPOVER_WIDTH = 220;
const POPOVER_HEIGHT = 280;

// const POPOVER_WIDTH = 172;
// const POPOVER_HEIGHT = 232;
export const SiteLensColorPicker: React.FC<ISiteLensColorPickerProps> = ({value, onSave, isDark = false}) => {
  const swatchRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const hueBarRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({top: 0, left: 0});

  // Draft state — only committed when Save is pressed
  const [hsb, setHsb] = useState({h: 0, s: 0, b: 100});
  const hsbRef = useRef(hsb);
  hsbRef.current = hsb;

  const [hexInput, setHexInput] = useState('');
  const [rgbInputs, setRgbInputs] = useState<[string, string, string]>(['0', '0', '0']);

  const isDragging = useRef<'gradient' | 'hue' | null>(null);

  // ── Sync helpers ────────────────────────────────────────────────────────

  const syncFromHsb = useCallback((newHsb: {h: number; s: number; b: number}) => {
    setHsb(newHsb);
    const [r, g, b] = hsbToRgb(newHsb.h, newHsb.s, newHsb.b);
    setHexInput(rgbToHex(r, g, b).slice(1).toUpperCase());
    setRgbInputs([String(r), String(g), String(b)]);
  }, []);

  // ── Open / close ────────────────────────────────────────────────────────

  const openPicker = useCallback(() => {
    const rgb = hexToRgb(value);
    const newHsb = rgb ? rgbToHsb(...rgb) : {h: 0, s: 0, b: 100};
    syncFromHsb(newHsb);

    if (swatchRef.current) {
      const rect = swatchRef.current.getBoundingClientRect();
      const spaceAbove = rect.top - 8;
      const top = spaceAbove >= POPOVER_HEIGHT ?
        rect.top - POPOVER_HEIGHT - 8 :
        Math.min(window.innerHeight - POPOVER_HEIGHT - 8, rect.bottom + 8);
      const left = Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8);
      setPopoverPos({top, left});
    }
    setIsOpen(true);
  }, [value, syncFromHsb]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        swatchRef.current && !swatchRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // ── Drag handlers ────────────────────────────────────────────────────────

  const applyGradientDrag = useCallback((e: MouseEvent) => {
    const el = gradientRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    syncFromHsb({
      h: hsbRef.current.h,
      s: Math.round((x / rect.width) * 100),
      b: Math.round((1 - y / rect.height) * 100),
    });
  }, [syncFromHsb]);

  const applyHueDrag = useCallback((e: MouseEvent) => {
    const el = hueBarRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    syncFromHsb({
      h: Math.round((x / rect.width) * 360),
      s: hsbRef.current.s,
      b: hsbRef.current.b,
    });
  }, [syncFromHsb]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging.current === 'gradient') applyGradientDrag(e);
      else if (isDragging.current === 'hue') applyHueDrag(e);
    };
    const onUp = () => {
      isDragging.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [applyGradientDrag, applyHueDrag]);

  // ── Input handlers ───────────────────────────────────────────────────────

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace('#', '').replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    setHexInput(raw.toUpperCase());
    if (raw.length === 6) {
      const rgb = hexToRgb('#' + raw);
      if (rgb) setHsb(rgbToHsb(...rgb));
    }
  };

  const handleRgbInput = (channel: 0 | 1 | 2, raw: string) => {
    let cleaned = raw.replace(/[^0-9]/g, '').replace(/^0+(\d)/, '$1');
    while (cleaned.length > 1 && parseInt(cleaned) > 255) {
      cleaned = cleaned.slice(0, -1);
    }
    const updated: [string, string, string] = [...rgbInputs];
    updated[channel] = cleaned;
    setRgbInputs(updated);

    if (cleaned !== '') {
      const n = parseInt(cleaned);
      const [curR, curG, curB] = hsbToRgb(hsb.h, hsb.s, hsb.b);
      const rgb: [number, number, number] = [curR, curG, curB];
      rgb[channel] = n;
      const newHsb = rgbToHsb(...rgb);
      setHsb(newHsb);
      const [r, g, b] = hsbToRgb(newHsb.h, newHsb.s, newHsb.b);
      setHexInput(rgbToHex(r, g, b).slice(1).toUpperCase());
    }
  };

  const handleRgbBlur = (channel: 0 | 1 | 2) => {
    if (rgbInputs[channel] === '') {
      const updated: [string, string, string] = [...rgbInputs];
      updated[channel] = '0';
      setRgbInputs(updated);
      const [curR, curG, curB] = hsbToRgb(hsb.h, hsb.s, hsb.b);
      const rgb: [number, number, number] = [curR, curG, curB];
      rgb[channel] = 0;
      syncFromHsb(rgbToHsb(...rgb));
    }
  };

  // ── Derived values ───────────────────────────────────────────────────────

  const [cr, cg, cb] = hsbToRgb(hsb.h, hsb.s, hsb.b);
  const hueHex = rgbToHex(...hsbToRgb(hsb.h, 100, 100));
  const currentHex = rgbToHex(cr, cg, cb);

  // ── Shared input class ───────────────────────────────────────────────────

  const inputClass = `w-full text-[12px] rounded-lg h-8 border outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
    isDark ?
      'bg-[#2a2b30] border-[#444648] text-white focus:border-[#7f4ead]' :
      'bg-[#f5f5f5] border-[#d9d9d9] text-[#1a1a1a] focus:border-[#7f4ead]'
  }`;

  const labelClass = `text-[10px] font-medium leading-none ${isDark ? 'text-[#a0a0a0]' : 'text-[#888]'}`;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div ref={swatchRef} className={`relative inline-flex items-center gap-2 cursor-pointer p-[5px] border rounded-[9px] flex-1 ${isDark ? 'border-[#444444]' : 'border-[#cccccc]'}`} onClick={openPicker}>
      {/* Color swatch trigger */}
      <div
        className={`w-6 h-6 rounded-md flex-shrink-0 border-2 transition-colors ${
          isDark ? 'border-[#555] hover:border-[#7f4ead]' : 'border-[#ccc] hover:border-[#7f4ead]'
        }`}
        style={{backgroundColor: value}}
      />
      <span
        className={`text-[13px] font-mono ${isDark ? 'text-[#a0a0a0]' : 'text-[#666]'}`}
      >
        {value.toUpperCase()}
      </span>

      {/* Portal popover */}
      {isOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div
          ref={popoverRef}
          className={`fixed z-[9999] rounded-2xl select-none p-3 ${
            isDark ? 'bg-[#1a1b1f]' : 'bg-white'
          }`}
          onClick={e => e.stopPropagation()}
          style={{
            top: popoverPos.top,
            left: popoverPos.left,
            width: POPOVER_WIDTH,
            boxShadow: isDark ?
              '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' :
              '0 8px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)',
          }}
        >
          {/* Gradient picker */}
          <div
            ref={gradientRef}
            className='relative w-full h-[170px] mb-3 rounded-xl cursor-crosshair'
            onMouseDown={e => {
              isDragging.current = 'gradient';
              applyGradientDrag(e.nativeEvent);
            }}
          >
            {/* Base gradient — overflow-hidden for rounded corners */}
            <div
              className='absolute inset-0 rounded-xl overflow-hidden pointer-events-none'
              style={{background: `linear-gradient(to right, #ffffff, ${hueHex})`}}
            >
              <div
                className='absolute inset-0'
                style={{background: 'linear-gradient(to bottom, transparent, #000000)'}}
              />
            </div>
            {/* Cursor — outside overflow-hidden div so never clipped */}
            <div
              className='absolute w-[14px] h-[14px] rounded-full border-2 border-white pointer-events-none'
              style={{
                left: `${hsb.s}%`,
                top: `${100 - hsb.b}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          {/* Hue slider */}
          <div
            ref={hueBarRef}
            className='relative h-3 w-full mb-4 cursor-pointer'
            onMouseDown={e => {
              isDragging.current = 'hue';
              applyHueDrag(e.nativeEvent);
            }}
          >
            <div
              className='absolute inset-0 rounded-full pointer-events-none'
              style={{
                background: 'linear-gradient(to right, #f00, #ff0 16.67%, #0f0 33.33%, #0ff 50%, #00f 66.67%, #f0f 83.33%, #f00)',
              }}
            />
            {/* Hue cursor */}
            <div
              className='absolute top-1/2 w-5 h-5 rounded-full border-2 border-white pointer-events-none'
              style={{
                left: `${(hsb.h / 360) * 100}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: hueHex,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          {/* HEX + RGB inputs */}
          <div className='flex gap-2 mb-4'>
            {/* HEX */}
            <div className='flex flex-col gap-1' style={{flex: '2'}}>
              <span className={labelClass}>HEX</span>
              <input
                className={`${inputClass} font-mono px-2`}
                value={'#' + hexInput}
                onChange={handleHexInput}
              />
            </div>
            {/* R */}
            <div className='flex flex-col gap-1 flex-1'>
              <span className={labelClass}>R</span>
              <input
                type='text'
                inputMode='numeric'
                className={`${inputClass} text-center`}
                value={rgbInputs[0]}
                onChange={e => handleRgbInput(0, e.target.value)}
                onBlur={() => handleRgbBlur(0)}
              />
            </div>
            {/* G */}
            <div className='flex flex-col gap-1 flex-1'>
              <span className={labelClass}>G</span>
              <input
                type='text'
                inputMode='numeric'
                className={`${inputClass} text-center`}
                value={rgbInputs[1]}
                onChange={e => handleRgbInput(1, e.target.value)}
                onBlur={() => handleRgbBlur(1)}
              />
            </div>
            {/* B */}
            <div className='flex flex-col gap-1 flex-1'>
              <span className={labelClass}>B</span>
              <input
                type='text'
                inputMode='numeric'
                className={`${inputClass} text-center`}
                value={rgbInputs[2]}
                onChange={e => handleRgbInput(2, e.target.value)}
                onBlur={() => handleRgbBlur(2)}
              />
            </div>
          </div>

          {/* Cancel / Save */}
          <div className='flex gap-2'>
            <button
              type='button'
              className={`flex-1 h-9 rounded-xl text-sm font-medium cursor-pointer border transition-colors ${
                isDark ?
                  'border-[#444648] text-[#e8e8e8] bg-transparent hover:bg-[#2a2b30]' :
                  'border-[#d9d9d9] text-[#1a1a1a] bg-white hover:bg-[#f5f5f5]'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <button
              type='button'
              className='flex-1 h-9 rounded-xl text-sm font-medium cursor-pointer bg-[#7f4ead] hover:bg-[#6b3d95] text-white border-0 flex items-center justify-center gap-1.5 transition-colors'
              onClick={() => {
                onSave(currentHex);
                setIsOpen(false);
              }}
            >
              <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'>
                <polyline points='20 6 9 17 4 12' />
              </svg>
              Save
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
