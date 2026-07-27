import {createContext, useContext, useState, cloneElement, isValidElement} from 'react';
import type {ReactNode, ReactElement} from 'react';

interface MenuCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const MenuContext = createContext<MenuCtx>({open: false, setOpen: () => {}});

interface RadioCtx {
  value?: string;
  onValueChange?: (v: string) => void;
  close: () => void;
}
const RadioContext = createContext<RadioCtx>({close: () => {}});

export const DropdownMenu = ({children}: {children: ReactNode}) => {
  const [open, setOpen] = useState(false);
  return (
    <MenuContext.Provider value={{open, setOpen}}>
      <div className="relative inline-block">{children}</div>
    </MenuContext.Provider>
  );
};

interface TriggerProps {
  children: ReactNode;
  asChild?: boolean;
}
export const DropdownMenuTrigger = ({children}: TriggerProps) => {
  const {open, setOpen} = useContext(MenuContext);
  const onClick = () => setOpen(!open);
  if (isValidElement(children)) {
    return cloneElement(children as ReactElement, {onClick} as never);
  }
  return <span onClick={onClick}>{children}</span>;
};

interface ContentProps {
  children: ReactNode;
  className?: string;
  align?: string;
}
export const DropdownMenuContent = ({children, className = ''}: ContentProps) => {
  const {open, setOpen} = useContext(MenuContext);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
      <div className={`absolute z-[100] mt-1 min-w-[180px] rounded-md p-1 shadow-xl ${className}`}>{children}</div>
    </>
  );
};

interface RadioGroupProps {
  value?: string;
  onValueChange?: (v: string) => void;
  children: ReactNode;
}
export const DropdownMenuRadioGroup = ({value, onValueChange, children}: RadioGroupProps) => {
  const {setOpen} = useContext(MenuContext);
  return (
    <RadioContext.Provider value={{value, onValueChange, close: () => setOpen(false)}}>
      {children}
    </RadioContext.Provider>
  );
};

interface RadioItemProps {
  value: string;
  children: ReactNode;
  className?: string;
}
export const DropdownMenuRadioItem = ({value, children, className = ''}: RadioItemProps) => {
  const {value: current, onValueChange, close} = useContext(RadioContext);
  const selected = current === value;
  return (
    <div
      role="menuitemradio"
      aria-checked={selected}
      onClick={() => {
        onValueChange?.(value);
        close();
      }}
      className={`cursor-pointer rounded px-2 py-1.5 text-sm ${selected ? 'bg-white/10' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default DropdownMenu;
