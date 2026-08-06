export const NAV_ITEMS = [
  { href: "#about", label: "About" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#stack", label: "Stack" },
  { href: "#timeline", label: "Timeline" },
  { href: "#fieldnotes", label: "Field notes" },
  { href: "#contact", label: "Contact" },
];

export const NAV_IDS = NAV_ITEMS.map((item) => item.href.slice(1));

export const CONTACT = {
  email: "anashamza457@gmail.com",
  phoneDisplay: "+92 346 6273186",
  phoneIntl: "923466273186",
  linkedin: "https://www.linkedin.com/in/anas-bhambhani-33b8842a5",
};

export const STATS = [
  { count: 4, suffix: "+", label: "Years building frontends" },
  { count: 15, suffix: "+", label: "Client projects shipped" },
  { count: 10, suffix: "+", label: "Core technologies" },
  { count: 100, suffix: "%", label: "Remote-ready" },
];

export const FACTS = [
  { k: "Looking for", v: "Full-time roles" },
  { k: "Availability", v: "Open to new opportunities" },
  { k: "Timezone", v: "GMT+5 · flexible overlap" },
  { k: "Process", v: "Jira, Linear, ClickUp, Asana" },
];

export const CAPABILITIES = [
  {
    num: "01",
    title: "Frontend engineering",
    body: "React, Next.js and TypeScript interfaces that load fast, hold up under real data, and don't fight the people using them — this is where I do my best work.",
  },
  {
    num: "02",
    title: "Interface architecture",
    body: "Reusable component systems, sensible state management, and rendering strategy — SSR, code-splitting, lazy loading — that keep large products maintainable as they grow.",
  },
  {
    num: "03",
    title: "Full-stack when needed",
    body: "Node, Express and NestJS with MongoDB and PostgreSQL — enough to design APIs, model data, take a feature end-to-end, and work fluently with a backend team.",
  },
  {
    num: "04",
    title: "Team integration",
    body: "Comfortable inside someone else's process sprints, standups, and tickets in Jira, Linear, ClickUp or Asana.",
  },
];

export const STACK_GROUPS = [
  { label: "frontend", items: ["JavaScript", "TypeScript", "React", "Next.js", "Remix", "Redux", "MobX", "React Query", "Zod"] },
  { label: "styling & ui", items: ["Tailwind", "Ant Design", "SCSS", "Bootstrap"] },
  { label: "backend · studied & practice", items: ["Node.js", "Express", "NestJS", "REST APIs", "GraphQL"] },
  { label: "data · practice", items: ["MongoDB", "PostgreSQL", "Firebase", "Supabase"] },
  { label: "integrations", items: ["Stripe", "PayPal", "Chrome Extensions (MV3)"] },
  { label: "delivery & process", items: ["Git", "GitHub", "GitLab", "CI/CD", "Jira", "Linear"] },
];

export const TIMELINE = [
  {
    date: "2023 —\nPresent",
    role: "Frontend-Focused Full-Stack Engineer",
    org: "Enigmatix · Onsite",
    bullets: [
      "Drive frontend delivery for a large-scale, AI-powered SEO SaaS platform, shipping production-grade features used by thousands of agencies.",
      "Own the end-to-end frontend for a Pricing & Subscription system — multi-tier plans, feature gating and RBAC-aware UI — from API integration through to the screens users convert on.",
      "Engineer a reusable component architecture with React, TypeScript, MobX and Tailwind, cutting duplication and speeding up feature work across the product.",
      "Architect the frontend on Next.js App Router — dynamic routing, nested layouts and SSR — for maintainability and long-term scale.",
      "Optimize performance by ~25% through code-splitting, lazy loading and render control, and partner with backend, QA and product to ship reliable features.",
    ],
    tags: ["React", "TypeScript", "Next.js", "MobX", "Tailwind", "REST APIs"],
  },
  {
    date: "2022 —\n2023",
    role: "Frontend Developer",
    org: "Early career · local & small projects",
    bullets: [
      "Started out building websites, landing pages and small web apps for local and international clients.",
      "Built strong fundamentals in JavaScript, component-based UI, and responsive layout.",
      "Alongside client work, studied Node, Express and databases and built personal full-stack projects to round out the frontend skill set.",
    ],
    tags: ["JavaScript", "React", "HTML/CSS", "Git"],
  },
];

export const FIELD_NOTES = [
  {
    domain: "AI SaaS · Frontend",
    title: "AI-Powered SEO Platform",
    engagement: "Full-time",
    teaser: "Frontend delivery for an AI-powered SEO SaaS serving 5,000+ agencies and 430K+ installations.",
    desc: "Drove frontend delivery for an AI-powered SEO SaaS platform serving 5,000+ agencies and 430K+ installations, shipping scalable, production-grade features used at scale.",
    bullets: [
      "Owned and delivered the end-to-end Pricing & Subscription system (UI → API → RBAC), implementing multi-tier plans and feature gating that increased user conversion and streamlined onboarding.",
      "Engineered a reusable component architecture using React, TypeScript, MobX and Tailwind, eliminating duplication and accelerating feature development across the product.",
      "Designed and scaled the frontend architecture with Next.js App Router — dynamic routing, nested layouts and SSR — strengthening maintainability and long-term scalability.",
      "Optimized application performance by ~25% through code-splitting, lazy loading and render control, significantly improving load time and user experience.",
      "Delivered high-impact, conversion-focused workflows (e.g. press-release generation) and partnered with backend, QA and product teams to ship reliable features aligned with user and business goals.",
    ],
    tech: ["TypeScript", "React", "MobX", "Next.js", "Tailwind", "Ant Design", "REST APIs", "Git"],
  },
  {
    domain: "Internal Tooling · Frontend",
    title: "Office Management System",
    engagement: "Full-time",
    client: "Enigmatix",
    teaser: "Role-based UI for managing employees, attendance and day-to-day tasks.",
    desc: "Built the frontend for a web-based office management system covering employee records, role-based access UI, authentication flows, attendance tracking and task management on a Firebase backend. Focused on a scalable component architecture and a fully responsive, mobile-first UI so the tool held up equally well in the office and on the floor.",
    tech: ["React", "Firebase", "Redux", "Ant Design", "SCSS"],
    link: "https://oms.enigmatix.co/login",
    shots: [
      { src: "/oms-dashboard.webp", alt: "Office Management System — employee dashboard" },
      { src: "/oms-login.webp", alt: "Office Management System — login screen" },
    ],
  },
  {
    domain: "Healthcare · Full-Stack",
    title: "HottoCare",
    engagement: "Contract",
    teaser: "Patient management platform with real-time doctor-to-doctor messaging built on GetStream.io.",
    desc: "Built a modern patient management application focused on performance, responsiveness and user experience, giving healthcare professionals and administrative staff an efficient way to manage appointments, patient histories and medical records.",
    bullets: [
      "Built an intuitive, responsive interface with Svelte 5, SvelteKit, Tailwind CSS, shadcn/ui and Lucide Icons.",
      "Implemented complete CRUD functionality for patient records, with form validation and efficient state management.",
      "Integrated secure authentication, protected routes and session management to safeguard sensitive patient information.",
      "Integrated GetStream.io for real-time doctor-to-doctor communication — room-based chat, message sync and notifications — for case discussions and collaboration.",
      "Worked with backend APIs (Flask) to keep data synchronized and the application performing smoothly.",
    ],
    tech: ["Svelte", "SvelteKit", "Tailwind", "shadcn/ui", "Flask", "GetStream.io"],
  },
  {
    domain: "Media · Frontend",
    title: "DragonFly",
    engagement: "Contract",
    teaser: "High-performance, SSR news platform built with Remix.js and FastAPI.",
    desc: "Contributed to a high-performance news platform, building server-side rendered pages with Remix loaders and actions to optimize data fetching and page performance.",
    bullets: [
      "Built SSR pages using Remix loaders and actions to optimize data fetching and improve page performance.",
      "Applied intelligent caching strategies and progressive enhancement for a fast, seamless user experience.",
      "Developed responsive, reusable UI components with Tailwind CSS for a consistent experience across devices.",
      "Integrated REST APIs for real-time news updates and efficient client-server communication.",
      "Applied Zod for schema validation to ensure reliable and secure data handling.",
    ],
    tech: ["Remix", "FastAPI", "Zod", "Tailwind"],
  },
  {
    domain: "Self-directed · Full-Stack",
    title: "Full-Stack Practice Projects",
    engagement: "Personal",
    client: "Self-initiated",
    teaser: "A product management system — products, customers and everything around them — built end to end.",
    desc: "A self-directed build: a product management system for handling a product catalogue, customer records and the day-to-day operations around them. I owned the whole thing — data model, API and UI — which is where the backend half of the skill set stays current, and where I use the parts of my stack client work doesn't always reach: Remix, Supabase and Zod.",
    bullets: [
      "Built the full product and customer management flow — create, edit, list, search and detail views — on a data model I designed rather than one handed to me.",
      "Remix front-end with Tailwind, using loaders and actions so data fetching and mutations stay on the server side of the boundary.",
      "Supabase for the database and auth, keeping the backend managed while the schema and access rules stayed mine.",
      "Zod for schema validation across the client-server boundary, so bad data fails at the edge instead of deeper in.",
      "This portfolio itself — React and Tailwind, with the Site Lens visualization mapping its own content as a graph.",
    ],
    tech: ["Remix", "React", "Supabase", "Zod", "Tailwind", "Node.js", "Express", "NestJS", "PostgreSQL", "MongoDB"],
  },
];
