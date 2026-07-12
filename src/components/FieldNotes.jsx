import { useState } from "react";
import Reveal from "./Reveal";
import NoteModal from "./NoteModal";
import { FIELD_NOTES } from "../data/content";
import { IconInfo, IconArrowRight } from "./icons";
import { SECTION, TAG_HEAD, SEC_TITLE, SEC_LEDE, GLASS_CARD, EASE } from "../ui";

export default function FieldNotes() {
  const [activeNote, setActiveNote] = useState(null);

  return (
    <section id="fieldnotes" className={SECTION}>
      <Reveal className={TAG_HEAD}>Selected Work</Reveal>
      <Reveal as="h2" delay={1} className={`${SEC_TITLE} mb-3`}>
        Field notes
      </Reveal>
      <Reveal as="p" delay={2} className={`${SEC_LEDE} mb-6`}>
        Notes from real client work, kept deliberately anonymous.
      </Reveal>

      <Reveal delay={2} className={`${GLASS_CARD} flex gap-3.5 p-5 items-start mb-9`}>
        <IconInfo className="w-4.5 h-4.5 text-accent flex-shrink-0 mt-0.5" />
        <p className="text-[13.5px] text-muted leading-[1.7]">
          Almost everything I&apos;ve shipped was built for someone else, under NDA. I can&apos;t
          share company names, logos or live links but I can walk through exactly how each of
          these was built. Click a card to read the note.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5.5">
        {FIELD_NOTES.map((note, i) => (
          <Reveal key={note.title} delay={(i % 4) + 1}>
            <button
              type="button"
              onClick={() => setActiveNote(note)}
              className={`group relative h-full w-full text-left flex flex-col overflow-hidden cursor-pointer
                rounded-[20px] ${GLASS_CARD} hover:-translate-y-2 hover:border-accent/50
                hover:shadow-[0_30px_70px_rgba(0,0,0,0.5)]`}
            >
              <div className="relative aspect-16/10 overflow-hidden bg-[repeating-linear-gradient(135deg,#1c0a10,#1c0a10_12px,#170810_12px,#170810_24px)] grid place-items-center">
                <div className="absolute w-36 h-36 rounded-[28px] bg-linear-to-br from-primary/35 to-violet/25 blur-[2px] opacity-50 animate-float" />
                <span className="relative font-display text-xs tracking-widest text-muted-2 uppercase px-4 text-center">
                  {note.domain}
                </span>
                <div
                  className={`absolute inset-0 bg-linear-to-t from-bg/95 via-bg/40 to-transparent opacity-0
                    group-hover:opacity-100 transition-opacity duration-400 ${EASE} flex items-end p-5`}
                >
                  <span className="inline-flex items-center gap-1.75 py-2.25 px-4 rounded-[10px] text-[13px] font-semibold bg-white/10 border border-white/15 backdrop-blur-sm text-white">
                    Read the note
                    <IconArrowRight className="w-3.25 h-3.25 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>

              <div className="p-5.5 flex flex-col flex-1">
                <h3 className="text-[19px] mb-2 font-semibold">{note.title}</h3>
                <p className="text-muted text-sm leading-[1.6] mb-4 flex-1">{note.teaser}</p>
                <div className="flex items-center gap-5 pt-4 border-t border-white/8 text-[11px] font-display tracking-wide uppercase text-muted-2">
                  <span>
                    Engagement <b className="text-highlight font-semibold">Contract</b>
                  </span>
                  <span>
                    Client <b className="text-heart font-semibold">Redacted</b>
                  </span>
                </div>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      <NoteModal note={activeNote} onClose={() => setActiveNote(null)} />
    </section>
  );
}
