import { useState } from "react";
import Reveal from "./Reveal";
import GlassCard from "./ui/GlassCard";
import NoteModal from "./NoteModal";
import { FIELD_NOTES } from "../data/content";
import { IconInfo, IconArrowRight } from "./icons";
import { SECTION, TAG_HEAD, SEC_TITLE, SEC_LEDE, EASE } from "../ui";

export default function FieldNotes() {
  const [activeNote, setActiveNote] = useState(null);

  return (
    <section id="fieldnotes" data-aos="zoom-in" className={SECTION}>
      <Reveal className={TAG_HEAD}>Selected Work</Reveal>
      <Reveal as="h2" delay={1} className={`${SEC_TITLE} mb-3`}>
        Field notes
      </Reveal>
      <Reveal as="p" delay={2} className={`${SEC_LEDE} mb-6`}>
        Notes from real client work, kept deliberately anonymous.
      </Reveal>

      <Reveal delay={2} className="mb-9">
        <GlassCard className="w-full!">
          <div className="flex gap-3.5 p-5 items-start">
            <IconInfo className="w-4.5 h-4.5 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-[13.5px] text-muted leading-[1.7]">
              Most of what I&apos;ve shipped was built for someone else, under NDA — so for those I
              can&apos;t share company names, logos or live links, but I can walk through exactly how
              each was built. Where a project is public, I&apos;ve linked it. Click a card to read the note.
            </p>
          </div>
        </GlassCard>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5.5">
        {FIELD_NOTES.map((note, i) => (
          <Reveal key={note.title} delay={(i % 4) + 1} className="h-full">
            <button
              type="button"
              onClick={() => setActiveNote(note)}
              className="group relative block h-full w-full text-left cursor-pointer"
            >
              <GlassCard className="w-full! h-full!" contentClassName="h-full" borderRadius={20}>
                <div className="flex h-full flex-col overflow-hidden" style={{ borderRadius: 20 }}>
                  <div className="relative aspect-16/10 overflow-hidden">
                    {note.shots?.[0] ? (
                      <img
                        src={note.shots[0].src}
                        alt={note.shots[0].alt}
                        loading="lazy"
                        className={`absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 ${EASE} group-hover:scale-105`}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-br from-primary via-violet to-accent transition-transform duration-500 group-hover:scale-105">
                        <div className="absolute inset-0 grid place-items-center">
                          <span className="font-display text-[13px] tracking-[0.2em] text-white/85 uppercase px-4 text-center">
                            {note.domain}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/5 to-transparent" />
                    <span className="absolute bottom-4 left-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white">
                      Read the note
                      <IconArrowRight className="w-3.25 h-3.25 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>

                  <div className="p-5.5 flex flex-col flex-1">
                    <h3 className="text-[19px] mb-2 font-semibold">{note.title}</h3>
                    <p className="text-muted text-sm leading-[1.6] mb-4 flex-1">{note.teaser}</p>
                    <div className="flex items-center gap-5 pt-4 border-t border-edge/8 text-[11px] font-display tracking-wide uppercase text-muted-2">
                      <span>
                        Engagement <b className="text-highlight font-semibold">{note.engagement || "Contract"}</b>
                      </span>
                      <span>
                        Client{" "}
                        <b className={`font-semibold ${note.client ? "text-highlight" : "text-heart"}`}>
                          {note.client || "Redacted"}
                        </b>
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </button>
          </Reveal>
        ))}
      </div>

      <NoteModal note={activeNote} onClose={() => setActiveNote(null)} />
    </section>
  );
}
