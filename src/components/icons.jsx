// Small stroke-icon set, 24x24 viewBox, inherits color via currentColor.
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24" };

export function IconMail(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

export function IconWhatsapp(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12a9 9 0 1 1-4-7.5" />
      <path d="M21 3l-5 5" />
    </svg>
  );
}

export function IconLinkedin(props) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM3.25 8.75h3.4V21h-3.4V8.75zM9.5 8.75h3.26v1.68h.05c.45-.86 1.56-1.77 3.22-1.77 3.45 0 4.08 2.27 4.08 5.22V21h-3.4v-6.06c0-1.44-.03-3.3-2.01-3.3-2.01 0-2.32 1.57-2.32 3.2V21H9.5V8.75z" />
    </svg>
  );
}

export function IconPhone(props) {
  return (
    <svg {...base} {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

export function IconMenu(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg {...base} {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconArrowRight(props) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconSend(props) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export function IconInfo(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}

export function IconExternal(props) {
  return (
    <svg {...base} strokeWidth={2.1} {...props}>
      <path d="M15 3h6v6M21 3l-9 9M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

export function IconClock(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function IconUp(props) {
  return (
    <svg {...base} strokeWidth={2.4} {...props}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function IconCode(props) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <path d="M4 17l6-6-6-6M12 19h8" />
    </svg>
  );
}

export function IconServer(props) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <rect x="2" y="4" width="20" height="6" rx="2" />
      <rect x="2" y="14" width="20" height="6" rx="2" />
      <path d="M6 7h.01M6 17h.01" />
    </svg>
  );
}

export function IconLayers(props) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <path d="M12 2 3 7l9 5 9-5-9-5z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

export function IconPalette(props) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.9 1.9-1.9H16a4 4 0 0 0 4-4c0-5-3.6-9.5-8-9.5z" />
      <circle cx="7" cy="10" r="1" fill="currentColor" />
      <circle cx="11.5" cy="6.5" r="1" fill="currentColor" />
      <circle cx="16" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
