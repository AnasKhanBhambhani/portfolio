import { createContext, useContext, useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";

// Animate UI-style Tabs primitive (Tabs / TabsList / TabsTrigger / TabsContents
// / TabsContent), built on `motion` — same public API as
// @animate-ui/components-animate-tabs (defaultValue/value/onValueChange on
// Tabs, a spring-driven crossfade in TabsContents). TabsList/TabsTrigger are
// included for API completeness but aren't rendered for the page-level
// transition below — that one is driven purely by value/onValueChange.

const DEFAULT_TRANSITION = { type: "spring", stiffness: 300, damping: 32, bounce: 0, restDelta: 0.01 };

// clip-path (unlike transform/filter) never creates a containing block for
// `position: fixed` descendants, so this circular reveal is safe to use even
// though both page panels contain fixed elements (Nav, modals, the back
// button) — a transform- or filter-based reveal would silently break those.
const ENTER_CLIP = "circle(0% at 50% 50%)";
const FULL_CLIP = "circle(140% at 50% 50%)";

const TabsContext = createContext(null);

function useTabsContext(component) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<${component}> must be used within <Tabs>`);
  return ctx;
}

export function Tabs({ defaultValue, value, onValueChange, className, children, ...props }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;
  const baseId = useId();

  function setValue(next) {
    if (!isControlled) setInternalValue(next);
    onValueChange?.(next);
  }

  return (
    <TabsContext.Provider value={{ value: activeValue, setValue, baseId }}>
      <div className={cn("flex flex-col", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }) {
  return (
    <div role="tablist" className={cn("relative inline-flex items-center gap-1", className)} {...props}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, asChild, className, children, ...props }) {
  const { value: activeValue, setValue, baseId } = useTabsContext("TabsTrigger");
  const isActive = activeValue === value;
  const Comp = asChild ? motion.create("span") : motion.button;

  return (
    <Comp
      type={asChild ? undefined : "button"}
      role="tab"
      aria-selected={isActive}
      onClick={() => setValue(value)}
      className={cn("relative z-10 px-4 py-2 text-sm font-medium", className)}
      {...props}
    >
      {isActive && (
        <motion.span
          layoutId={`${baseId}-tab-highlight`}
          className="absolute inset-0 -z-10 rounded-full bg-white/10"
          transition={DEFAULT_TRANSITION}
        />
      )}
      {children}
    </Comp>
  );
}

export function TabsContents({ transition = DEFAULT_TRANSITION, className, children, ...props }) {
  const { value } = useTabsContext("TabsContents");
  const items = Array.isArray(children) ? children : [children];
  const active = items.find((child) => child?.props?.value === value) ?? null;

  return (
    <div className={cn("relative", className)} {...props}>
      <AnimatePresence mode="wait" initial={false}>
        {active && (
          <motion.div
            key={active.props.value}
            initial={{ opacity: 0, clipPath: ENTER_CLIP }}
            animate={{ opacity: 1, clipPath: FULL_CLIP }}
            exit={{ opacity: 0, clipPath: ENTER_CLIP }}
            transition={active.props.transition ?? transition}
          >
            {active}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TabsContent({ value, transition, className, children, ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
