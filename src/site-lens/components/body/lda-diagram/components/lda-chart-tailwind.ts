import classNames from 'classnames';

export const scrollableBase = classNames(
  'overflow-x-hidden overflow-y-auto',
  '[&::-webkit-scrollbar]:w-2',
  '[&::-webkit-scrollbar-track]:rounded',
  '[&::-webkit-scrollbar-thumb]:rounded',
);

export const scrollableDark = classNames(
  '[scrollbar-color:rgba(255,255,255,0.2)_rgba(255,255,255,0.05)]',
  '[scrollbar-width:thin]',
  '[&::-webkit-scrollbar-track]:bg-[rgba(255,255,255,0.05)]',
  '[&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.2)]',
  '[&::-webkit-scrollbar-thumb:hover]:bg-[rgba(255,255,255,0.3)]',
);

export const scrollableLight = classNames(
  '[scrollbar-color:rgba(0,0,0,0.2)_rgba(0,0,0,0.05)]',
  '[scrollbar-width:thin]',
  '[&::-webkit-scrollbar-track]:bg-[rgba(0,0,0,0.05)]',
  '[&::-webkit-scrollbar-thumb]:bg-[rgba(0,0,0,0.2)]',
  '[&::-webkit-scrollbar-thumb:hover]:bg-[rgba(0,0,0,0.3)]',
);
