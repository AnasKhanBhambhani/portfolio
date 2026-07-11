import { useEffect, useRef } from "react";
import { IconClose } from "./icons";
import { CHIP, EASE } from "../ui";

export default function NoteModal({ note, onClose }) {
  const closeBtnRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (note) {
      triggerRef.current = document.activeElement;
      document.body.style.overflow = "hidden";
      closeBtnRef.current?.focus();
    } else {
      document.body.style.overflow = "";
      triggerRef.current?.focus?.();
    }
  }, [note]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape" && note) onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [note, onClose]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-200 p-4 sm:p-6 bg-bg/80 backdrop-blur-md
        transition-opacity duration-300 ${note ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        className={`relative glass border border-white/12 rounded-[22px] max-w-140 w-full max-h-[82vh] overflow-y-auto
          p-6 sm:p-9 shadow-[0_30px_80px_rgba(0,0,0,0.6)] transition-transform duration-300 ${EASE}
          ${note ? "translate-y-0 scale-100" : "translate-y-3.5 scale-[0.98]"}`}
      >
        <button
          ref={closeBtnRef}
          aria-label="Close"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 grid place-items-center rounded-xl bg-white/5 border border-white/10 text-muted hover:text-white hover:border-accent [&_svg]:w-4 [&_svg]:h-4"
        >
          <IconClose />
        </button>
        {note && (
          <>
            <div className="font-display text-xs tracking-widest uppercase text-highlight mb-3">{note.domain}</div>
            <h3 id="modalTitle" className="text-2xl font-semibold mb-4.5 pr-8">
              {note.title}
            </h3>
            <p className="text-muted text-[15px] leading-[1.75] mb-5.5">{note.desc}</p>
            <div className="flex flex-wrap gap-2 mb-5.5">
              {note.tech.map((t) => (
                <span className={CHIP} key={t}>
                  {t}
                </span>
              ))}
            </div>
            <p className="font-display text-xs text-muted-2 border-t border-white/10 pt-4 leading-[1.6] tracking-wide">
              <b className="text-heart">Client &amp; live link:</b> withheld under NDA. Happy to walk through
              specifics on a call.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
