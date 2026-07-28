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
  { count: 5, suffix: "+", label: "Years building frontends" },
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
  { label: "frontend", items: ["JavaScript", "TypeScript", "React", "Next.js", "Redux", "MobX", "React Query"] },
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
    date: "2019 —\n2023",
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
    domain: "EdTech · Frontend",
    title: "AI-Assisted Learning Platform",
    engagement: "Contract",
    teaser: "Core frontend for a platform where educators generate structured lessons from uploaded content.",
    desc: "Built the frontend for an EdTech platform where educators generate structured lessons from uploaded content. Implemented Next.js SSR for fast, SEO-friendly page loads, classroom creation and management flows, and a secure student enrollment UI. Real-time features — live updates, notifications and chat — were wired up on Firebase, with client state handled across Redux, React Query and MobX. Performance work (code-splitting, lazy loading, memoization) kept the experience fast during high-traffic events.",
    tech: ["Next.js", "React", "Redux", "React Query", "MobX", "Firebase", "Ant Design"],
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
    domain: "Media · Frontend",
    title: "Content Publishing Platform",
    engagement: "Contract",
    teaser: "Scalable, markdown-based publishing UI for a content and blogging product.",
    desc: "Developed the frontend for a content publishing platform with markdown-based authoring so writers could create and manage posts efficiently. Wired up authentication and role-based authorization with Firebase to support protected content and multiple contributor roles, with an emphasis on a clean, distraction-free writing and reading experience.",
    tech: ["React", "Firebase", "Redux"],
  },
  {
    domain: "E-commerce / SaaS · Frontend",
    title: "Payments & Checkout Experience",
    engagement: "Contract",
    teaser: "Integrated payment gateways and subscription flows across multiple client products.",
    desc: "Built the checkout and subscription UI and integrated Stripe and PayPal from the frontend across several client engagements. Handled the client-side of failed payments, plan upgrades and downgrades, and confirmation states, while keeping the checkout experience simple, fast and trustworthy for end users.",
    tech: ["React", "Stripe", "PayPal", "REST APIs"],
  },
  {
    domain: "Productivity Tools · Frontend",
    title: "Browser Extension for Workflow Automation",
    engagement: "Contract",
    teaser: "Chrome extension (Manifest V3) built to streamline a repetitive in-browser workflow.",
    desc: "Designed and built a Chrome Extension using Manifest V3 to automate a repetitive, time-consuming browser workflow for a client's team. Focused on a lightweight footprint, reliable messaging between background and content scripts, and a simple popup UI that non-technical team members could use without training.",
    tech: ["JavaScript", "Chrome Extension APIs", "React"],
  },
  {
    domain: "Personal · Full-Stack",
    title: "Full-Stack Practice Projects",
    engagement: "Personal",
    teaser: "Self-built projects where I own the backend too — APIs, auth and databases.",
    desc: "To round out my frontend work, I build full-stack projects end-to-end on my own time: REST and GraphQL APIs on Node, Express and NestJS, data modelled in MongoDB and PostgreSQL, authentication and role-based access, all wired to a React or Next.js frontend. Not client work — this is how I keep my backend fundamentals sharp and stay fluent with the teams I build alongside.",
    tech: ["Node.js", "Express", "NestJS", "MongoDB", "PostgreSQL", "React", "Next.js"],
  },
];
