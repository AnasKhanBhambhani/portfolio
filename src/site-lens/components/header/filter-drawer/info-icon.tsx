import React from 'react';
import {SimpleTooltip} from '@/shared/ui/composed/simple-tooltip';
import type {IInfoIconProps} from './types';

const InfoIcon: React.FC<IInfoIconProps> = ({theme, title, colorClass}) => {
  const isDark = theme === 'dark';
  const defaultColorClass = isDark ? 'text-[#888] hover:text-[#aaa]' : 'text-[#999] hover:text-[#666]';

  return (
    <SimpleTooltip title={title}>
      <span
        className={`items-center inline-flex mt-1 ml-[5px] relative cursor-pointer ${colorClass || defaultColorClass}`}
        aria-label={title}
      >
        <svg width='12' height='12' viewBox='0 0 16 16' fill='none'>
          <circle cx='8' cy='8' r='7' stroke='currentColor' strokeWidth='1.5' fill='none' />
          <text x='8' y='11.5' textAnchor='middle' fontSize='9' fontWeight='600' fill='currentColor'>i</text>
        </svg>
      </span>
    </SimpleTooltip>
  );
};

export default InfoIcon;
