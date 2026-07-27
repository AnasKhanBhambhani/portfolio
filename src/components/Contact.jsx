import { useState } from "react";
import Reveal from "./Reveal";
import GlassCard from "./ui/GlassCard";
import { CONTACT } from "../data/content";
import { IconMail, IconWhatsapp, IconLinkedin, IconClock, IconSend } from "./icons";
import { SECTION, TAG_HEAD, SEC_TITLE, SEC_LEDE, BTN_SOLID, STATUS_DOT } from "../ui";

const INFO_IC =
  "w-10.5 h-10.5 rounded-[11px] bg-surface/3 border border-edge/10 text-highlight grid place-items-center " +
  "flex-shrink-0 [&_svg]:w-4.5 [&_svg]:h-4.5";
const FIELD_INPUT =
  "field-input w-full bg-surface/3 border border-edge/10 rounded-xl py-4 px-3.5 text-fg text-[15px] " +
  "transition-colors duration-300 focus:outline-none focus:border-accent focus:bg-accent/4";
const FIELD_LABEL = "absolute left-3.5 top-4 text-muted-2 text-[15px] pointer-events-none transition-all duration-200 px-1";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("sent");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className={SECTION}>
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-12.5 items-start">
        <div>
          <Reveal className={TAG_HEAD}>Get in Touch</Reveal>
          <Reveal as="h2" delay={1} className={`${SEC_TITLE} leading-[1.05]`}>
            Let&apos;s build something
            <br />
            exceptional.
          </Reveal>
          <Reveal as="p" delay={2} className={`${SEC_LEDE} mb-7`}>
            Looking for a frontend (or frontend-focused full-stack) engineer, or just want to
            say hi? My inbox is always open I&apos;ll get back to you within a day.
          </Reveal>

          <Reveal delay={2} className="flex items-center gap-3.5 text-muted mb-4.5 min-w-0">
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-3.5 min-w-0 hover:text-fg transition-colors duration-250"
            >
              <span className={INFO_IC}>
                <IconMail />
              </span>
              <span className="min-w-0 truncate">{CONTACT.email}</span>
            </a>
          </Reveal>

          <Reveal delay={2} className="flex items-center gap-3.5 text-muted mb-4.5 min-w-0">
            <a
              href={`https://wa.me/${CONTACT.phoneIntl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 min-w-0 hover:text-fg transition-colors duration-250"
            >
              <span className={INFO_IC}>
                <IconWhatsapp />
              </span>
              <span className="min-w-0 truncate">{CONTACT.phoneDisplay}</span>
            </a>
          </Reveal>

          <Reveal delay={2} className="flex items-center gap-3.5 text-muted mb-4.5 min-w-0">
            <a
              href={CONTACT.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 min-w-0 hover:text-fg transition-colors duration-250"
            >
              <span className={INFO_IC}>
                <IconLinkedin />
              </span>
              <span className="min-w-0 truncate">linkedin.com/in/anas-bhambhani-33b8842a5</span>
            </a>
          </Reveal>

          <Reveal delay={3} className="flex items-center gap-3.5 text-muted mb-6">
            <span className={INFO_IC}>
              <IconClock />
            </span>
            Usually replies within 24 hours
          </Reveal>

          <Reveal delay={3} className="inline-flex items-center gap-2.25">
            <span className={STATUS_DOT} />
            <span className="text-avail-text text-sm font-medium">Open to new opportunities</span>
          </Reveal>
        </div>

        <Reveal as="form" delay={2} onSubmit={handleSubmit}>
          <GlassCard className="w-full!">
            <div className="p-6 sm:p-8">
              <div className="relative mb-5.5">
                <input
                  id="cf-name"
                  type="text"
                  required
                  placeholder=" "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={FIELD_INPUT}
                />
                <label htmlFor="cf-name" className={FIELD_LABEL}>
                  Your name
                </label>
              </div>
              <div className="relative mb-5.5">
                <input
                  id="cf-email"
                  type="email"
                  required
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={FIELD_INPUT}
                />
                <label htmlFor="cf-email" className={FIELD_LABEL}>
                  Email address
                </label>
              </div>
              <div className="relative mb-5.5">
                <textarea
                  id="cf-msg"
                  required
                  placeholder=" "
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${FIELD_INPUT} resize-y min-h-30`}
                />
                <label htmlFor="cf-msg" className={FIELD_LABEL}>
                  Your message
                </label>
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className={`${BTN_SOLID} w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
              >
                {status === "sending" ? "Sending…" : "Send Message"}
                <IconSend />
              </button>
              <p
                className={`text-center mt-4 text-sm ${
                  status === "sent" ? "text-avail-text" : status === "error" ? "text-heart" : "text-muted-2"
                }`}
              >
                {status === "sent" && "Message sent — I'll get back to you within a day."}
                {status === "sending" && "Sending…"}
                {status === "error" && "Something went wrong — please email me directly instead."}
                {status === "idle" && "Sent straight to my inbox — nothing opens on your end."}
              </p>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
