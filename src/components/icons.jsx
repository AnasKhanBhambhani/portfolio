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
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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

// Connected nodes — stands for the Site Lens graph visualization.
export function IconGraph(props) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M12 12 6 6M12 12l6-5M12 12l-5 7M12 12l6 6" />
      <circle cx="12" cy="12" r="2.4" />
      <circle cx="5" cy="5" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="6" cy="20" r="2" />
      <circle cx="19" cy="19" r="2" />
    </svg>
  );
}

export function IconHome(props) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5M9.5 20v-6h5v6" />
    </svg>
  );
}

// Mirror of IconArrowRight, for "go back" affordances.
export function IconArrowLeft(props) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
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

export function IconUsers(props) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconSun(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function IconMoon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}
