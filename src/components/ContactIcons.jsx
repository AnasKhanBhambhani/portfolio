import { CONTACT } from "../data/content";
import { IconMail, IconWhatsapp, IconPhone, IconLinkedin } from "./icons";

const ICON_BTN =
  "w-11 h-11 grid place-items-center rounded-xl bg-white/3 border border-white/10 text-muted " +
  "transition-all duration-300 hover:text-white hover:border-accent hover:-translate-y-0.75 " +
  "hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--color-accent)_25%,transparent)] [&_svg]:w-5 [&_svg]:h-5";

export default function ContactIcons() {
  return (
    <div className="flex gap-3.5">
      <a className={ICON_BTN} href={`mailto:${CONTACT.email}`} aria-label="Email">
        <IconMail />
      </a>
      <a
        className={ICON_BTN}
        href={`https://wa.me/${CONTACT.phoneIntl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
      >
        <IconWhatsapp />
      </a>
      <a className={ICON_BTN} href={`tel:+${CONTACT.phoneIntl}`} aria-label="Call">
        <IconPhone />
      </a>
      <a
        className={ICON_BTN}
        href={CONTACT.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
      >
        <IconLinkedin />
      </a>
    </div>
  );
}
