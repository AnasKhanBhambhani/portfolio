import React from 'react';
import type {IMetricSliderProps} from './types';
import InfoIcon from './info-icon';

const sliderInputBase = [
  'appearance-none bg-transparent h-5 left-0 pointer-events-none absolute top-0 w-full',
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-brand-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-3.5',
  '[&::-moz-range-thumb]:bg-brand-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-3.5',
].join(' ');

const MetricSlider: React.FC<IMetricSliderProps> = ({
  label,
  tooltip,
  dataMin,
  dataMax,
  currentMin,
  currentMax,
  onChange,
  format,
  theme,
}) => {
  const range = dataMax - dataMin || 1;
  const minPercent = ((currentMin - dataMin) / range) * 100;
  const maxPercent = ((currentMax - dataMin) / range) * 100;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), currentMax - 1);
    onChange(value, currentMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), currentMin + 1);
    onChange(currentMin, value);
  };

  const isFiltered = currentMin > dataMin || currentMax < dataMax;
  const isDark = theme === 'dark';
  const textClass = isDark ? 'text-[#e8e8e8]' : 'text-[#333]';
  const subtextClass = isDark ? 'text-[#888]' : 'text-[#666]';

  return (
    <div className='mb-3.5'>
      <div className='flex justify-between mb-1.5'>
        <span className={`items-center flex text-xs gap-0.5 ${textClass} ${isFiltered ? 'font-semibold' : ''}`}>
          {label}
          <InfoIcon theme={theme} title={tooltip} />
          {isFiltered && <span className='text-brand-primary ml-1'>●</span>}
        </span>
        <span className={`text-[11px] ${subtextClass}`}>
          {format(currentMin)} - {format(currentMax)}
        </span>
      </div>
      <div className='h-5 relative'>
        <div className={`rounded-sm h-1 left-0 absolute right-0 top-2 ${isDark ? 'bg-[#3a3c40]' : 'bg-[#e0e0e0]'}`} />
        <div
          className='bg-brand-primary rounded-sm h-1 absolute top-2'
          style={{left: `${minPercent}%`, width: `${maxPercent - minPercent}%`}}
        />
        <input
          type='range'
          min={dataMin}
          max={dataMax}
          value={currentMin}
          onChange={handleMinChange}
          className={`${sliderInputBase} z-[2]`}
        />
        <input
          type='range'
          min={dataMin}
          max={dataMax}
          value={currentMax}
          onChange={handleMaxChange}
          className={`${sliderInputBase} z-[3]`}
        />
      </div>
      <div className='flex justify-between mt-0.5'>
        <span className={`text-[10px] ${subtextClass}`}>{format(dataMin)}</span>
        <span className={`text-[10px] ${subtextClass}`}>{format(dataMax)}</span>
      </div>
    </div>
  );
};

export default MetricSlider;
