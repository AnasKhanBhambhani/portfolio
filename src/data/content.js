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
  { count: 5, suffix: "+", label: "Years shipping production code" },
  { count: 15, suffix: "+", label: "Client engagements" },
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
    body: "React and Next.js interfaces that load fast, hold up under real data, and don't fight the people using them.",
  },
  {
    num: "02",
    title: "Backend & APIs",
    body: "REST and GraphQL services on Node, Express and NestJS, built to be maintained by someone other than me.",
  },
  {
    num: "03",
    title: "Full-stack delivery",
    body: "One engineer covering schema design through deployed UI, so handoffs and context-loss aren't part of the plan.",
  },
  {
    num: "04",
    title: "Team integration",
    body: "Comfortable inside someone else's process — sprints, standups, and tickets in Jira, Linear, ClickUp or Asana.",
  },
];

export const STACK_GROUPS = [
  { label: "frontend", items: ["JavaScript", "React", "Next.js", "Redux", "React Query"] },
  { label: "backend", items: ["Node.js", "Express", "NestJS", "GraphQL", "REST APIs"] },
  { label: "data", items: ["MongoDB", "PostgreSQL", "Firebase", "Supabase"] },
  { label: "integrations", items: ["Stripe", "PayPal", "Chrome Extensions (MV3)"] },
  { label: "delivery & tooling", items: ["Git", "GitHub", "GitLab", "CI/CD"] },
  { label: "process", items: ["Jira", "Linear", "ClickUp", "Asana"] },
];

export const TIMELINE = [
  {
    date: "2023 —\nPresent",
    role: "Full-Stack Engineer",
    org: "Enigmatix · Onsite",
    bullets: [
      "Own features end-to-end across the stack — from React and Next.js interfaces to the Node, Express and NestJS services powering them.",
      "Architect SSR Next.js applications backed by NestJS and GraphQL APIs, improving SEO and cutting initial load times by 30–40%.",
      "Design schemas and services across MongoDB and PostgreSQL, exposing data through REST and GraphQL.",
      "Build shared component libraries that standardize UI across projects, lifting team delivery speed by roughly 30%.",
      "Collaborate closely with designers, backend engineers and product owners to translate requirements into scalable solutions.",
    ],
    tags: ["React", "Next.js", "Node.js", "NestJS", "GraphQL", "PostgreSQL"],
  },
  {
    date: "2021 —\n2023",
    role: "Full-Stack Engineer",
    org: "Freelance · Remote",
    bullets: [
      "Delivered frontend-heavy solutions for international clients using React and Next.js, focusing on performance, scalability and UX.",
      "Built and optimized SSR-based Next.js applications, improving SEO rankings and reducing initial load times by 30–40%.",
      "Implemented state management using Redux, MobX and React Query for complex, data-driven interfaces.",
      "Integrated payment gateways (Stripe, PayPal) including checkout flows, subscriptions and secure transactions.",
      "Designed reusable component libraries using Ant Design, Bootstrap and SCSS, accelerating delivery across projects.",
    ],
    tags: ["React", "Next.js", "Redux", "MobX", "Stripe", "PayPal"],
  },
  {
    date: "2019 —\n2021",
    role: "Frontend Developer",
    org: "Early career · local & small projects",
    bullets: [
      "Started out building websites, landing pages and small web apps for local and international clients.",
      "Built strong fundamentals in JavaScript, component-based UI, and responsive layout.",
      "Learned to translate business requirements into production-ready interfaces on tight timelines.",
    ],
    tags: ["JavaScript", "React", "HTML/CSS", "Git"],
  },
];

export const FIELD_NOTES = [
  {
    domain: "EdTech · Full-Stack",
    title: "AI-Assisted Learning Platform",
    teaser: "Core product for a platform where educators generate structured lessons from uploaded content.",
    desc: "Partnered with a client to build an EdTech platform end-to-end. Implemented Next.js SSR for fast, SEO-friendly page loads, classroom creation and management flows, and secure student enrollment. Real-time features — live updates, notifications and chat — ran on Firebase, with client state handled across Redux, React Query and MobX. Performance work (code-splitting, lazy loading, memoization) kept the experience fast during high-traffic events.",
    tech: ["Next.js", "React", "Redux", "React Query", "MobX", "Firebase", "Ant Design"],
  },
  {
    domain: "SaaS · Frontend & Backend",
    title: "SEO Automation & Reporting Platform",
    teaser: "Automated keyword research, metadata management and SEO performance tracking.",
    desc: "Built an SSR platform in Next.js that automated keyword research, dynamic meta tags and sitemap generation, and tracked SEO performance over time. The automation replaced manual workflows and cut hands-on SEO operations by more than 60%, while the rendering strategy lifted organic search visibility.",
    tech: ["Next.js", "React", "Redux", "Ant Design", "Node.js"],
  },
  {
    domain: "Internal Tooling · Full-Stack",
    title: "Internal Workforce Management System",
    teaser: "Role-based system for managing employees, attendance and day-to-day tasks.",
    desc: "Designed and built a web-based workforce management system covering employee records, role-based access control, authentication, attendance tracking and task management. Focused on a scalable architecture and a fully responsive, mobile-first UI so the tool held up equally well in the office and on the floor.",
    tech: ["React", "Firebase", "Redux", "Ant Design", "SCSS"],
  },
  {
    domain: "Media · Frontend",
    title: "Content Publishing Platform",
    teaser: "Scalable, markdown-based publishing platform for a content and blogging product.",
    desc: "Developed a content publishing platform with markdown-based authoring so writers could create and manage posts efficiently. Implemented authentication and role-based authorization with Firebase to support protected content and multiple contributor roles, with an emphasis on a clean, distraction-free writing and reading experience.",
    tech: ["React", "Firebase", "Redux"],
  },
  {
    domain: "E-commerce / SaaS · Full-Stack",
    title: "Payments & Checkout Experience",
    teaser: "Integrated payment gateways and subscription flows across multiple client products.",
    desc: "Implemented secure checkout, subscription billing and payment workflows using Stripe and PayPal across several client engagements. Handled edge cases around failed payments, plan upgrades and downgrades, and webhooks, while keeping the checkout UI simple, fast and trustworthy for end users.",
    tech: ["React", "Node.js", "Stripe", "PayPal", "REST APIs"],
  },
  {
    domain: "Productivity Tools · Frontend",
    title: "Browser Extension for Workflow Automation",
    teaser: "Chrome extension (Manifest V3) built to streamline a repetitive in-browser workflow.",
    desc: "Designed and built a Chrome Extension using Manifest V3 to automate a repetitive, time-consuming browser workflow for a client's team. Focused on a lightweight footprint, reliable messaging between background and content scripts, and a simple popup UI that non-technical team members could use without training.",
    tech: ["JavaScript", "Chrome Extension APIs", "React"],
  },
];
