import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../lib/utils";

// Animate UI-style Code primitive (Code / CodeHeader / CodeBlock) — same
// public API as @animate-ui/components-animate-code, built on
// prism-react-renderer instead of shiki (much smaller bundle for a portfolio
// hero widget) with a hand-rolled reveal-by-character typing animation.

const CodeContext = createContext(null);

function useCodeContext() {
  const ctx = useContext(CodeContext);
  if (!ctx) throw new Error("<CodeHeader>/<CodeBlock> must be used within <Code>");
  return ctx;
}

export function Code({ code, className, children }) {
  return (
    <CodeContext.Provider value={{ code }}>
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border border-edge/12 bg-card shadow-[0_30px_70px_rgba(0,0,0,0.35)]",
          className,
        )}
      >
        {children}
      </div>
    </CodeContext.Provider>
  );
}

export function CodeHeader({ icon: Icon, copyButton, children }) {
  const { code } = useCodeContext();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — silently no-op,
      // there's no reasonable fallback UI for a portfolio decoration widget.
    }
  }

  return (
    <div className="flex items-center gap-2.5 border-b border-edge/10 bg-surface/4 px-4 py-3">
      <span className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-heart/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#f1aa3e]/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-avail/70" />
      </span>
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-2 ml-1.5" />}
      <span className="text-[13px] text-muted-2 font-mono">{children}</span>
      {copyButton && (
        <button
          type="button"
          onClick={handleCopy}
          className="ml-auto text-[11px] text-muted-2 hover:text-fg transition-colors duration-200 font-sans"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      )}
    </div>
  );
}

export function CodeBlock({ lang = "tsx", writing = true, duration = 4, delay = 0, cursor = true, className }) {
  const { code } = useCodeContext();
  const { theme } = useTheme();
  const [visibleChars, setVisibleChars] = useState(writing ? 0 : code.length);
  const [done, setDone] = useState(!writing);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!writing) {
      setVisibleChars(code.length);
      setDone(true);
      return undefined;
    }

    setVisibleChars(0);
    setDone(false);
    let start = null;

    function tick(ts) {
      if (start === null) start = ts;
      const elapsed = (ts - start) / 1000 - delay;
      if (elapsed <= 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, elapsed / duration);
      setVisibleChars(Math.round(progress * code.length));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, writing, duration, delay]);

  const prismTheme = theme === "dark" ? themes.vsDark : themes.github;
  const visible = code.slice(0, visibleChars);
  // Fixed to the FULL code's line count (not the currently-revealed slice) so
  // the block's height never changes while typing — otherwise the box grows
  // line by line and shoves everything below/around it down the page. `+2rem`
  // accounts for the `p-4` top+bottom padding: box-sizing is border-box
  // site-wide, so `height` includes padding — without adding it back the
  // last line or two get clipped/scrolled instead of just fitting.
  const totalLines = useMemo(() => code.split("\n").length, [code]);

  return (
    <Highlight theme={prismTheme} code={visible} language={lang}>
      {({ className: hClass, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cn(hClass, "m-0 overflow-hidden p-4 text-[13px] leading-[1.65] font-mono", className)}
          style={{ ...style, background: "transparent", height: `calc(${totalLines * 1.65}em + 2rem)` }}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
              {cursor && !done && i === tokens.length - 1 && (
                <span className="inline-block w-[7px] h-[1em] translate-y-[2px] bg-accent ml-0.5 animate-blink" />
              )}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
