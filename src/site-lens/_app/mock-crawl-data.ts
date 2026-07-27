// Data source for Site Lens, reshaped to model THIS portfolio instead of an
// SEO website crawl. The "site" is Muhammad Anas's portfolio; each "page" is a
// portfolio entity (a section, project, stack item, role or education entry).
// The numeric fields keep the feature's original keys (so filtering/sizing/
// coloring all still work) but are reframed to portfolio meanings — the UI
// labels are renamed to match (see constants.ts / graph-color-utils.ts):
//   pageHealth  → Proficiency (0-1000)
//   traffic     → Usage
//   impressions → Reach
//   keywords    → Related items
//   wordCount   → Detail
//   depth       → Level in the hierarchy
//   status      → 'Active' | 'Archived'

interface MockNode {
  id: number;
  url: string;
  name: string;
  depth: number;
  traffic: number;
  impressions: number;
  keywords: number;
  pageHealth: number;
  wordCount: number;
  pagerank: number;
  issueCount: number;
  status: string;
  isPrunable: boolean;
  h1Header: string;
  h2Header: string;
  children?: MockNode[];
}

// Deterministic PRNG (mulberry32) so the layout/values are stable per session.
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOST = 'https://muhammadanas.dev';

interface Item {
  slug: string;
  title: string;
  // 0..1 "strength" — how core / proficient / polished this entity is.
  strength?: number;
  archived?: boolean;
  children?: Item[];
}

// The portfolio's real content, as a hierarchy.
const SECTIONS: {slug: string; title: string; items: Item[]}[] = [
  {
    slug: 'projects',
    title: 'Projects',
    items: [
      {slug: 'ai-seo-platform', title: 'AI-Powered SEO Platform', strength: 0.95, children: [
        {slug: 'pricing-subscriptions', title: 'Pricing & Subscriptions', strength: 0.9},
        {slug: 'component-architecture', title: 'Reusable Component Architecture', strength: 0.85},
      ]},
      {slug: 'learning-platform', title: 'AI-Assisted Learning Platform', strength: 0.8},
      {slug: 'office-management', title: 'Office Management System', strength: 0.85, children: [
        {slug: 'attendance', title: 'Attendance & Roles', strength: 0.75},
      ]},
      {slug: 'content-publishing', title: 'Content Publishing Platform', strength: 0.7},
      {slug: 'payments-checkout', title: 'Payments & Checkout', strength: 0.8},
      {slug: 'browser-extension', title: 'Workflow Chrome Extension (MV3)', strength: 0.72},
      {slug: 'full-stack-practice', title: 'Full-Stack Practice Projects', strength: 0.78},
    ],
  },
  {
    slug: 'stack',
    title: 'Stack',
    items: [
      {slug: 'frontend', title: 'Frontend', strength: 0.98, children: [
        {slug: 'react', title: 'React', strength: 0.97},
        {slug: 'typescript', title: 'TypeScript', strength: 0.92},
        {slug: 'nextjs', title: 'Next.js', strength: 0.9},
        {slug: 'redux', title: 'Redux', strength: 0.82},
        {slug: 'mobx', title: 'MobX', strength: 0.8},
        {slug: 'react-query', title: 'React Query', strength: 0.83},
      ]},
      {slug: 'styling-ui', title: 'Styling & UI', strength: 0.9, children: [
        {slug: 'tailwind', title: 'Tailwind', strength: 0.93},
        {slug: 'ant-design', title: 'Ant Design', strength: 0.8},
        {slug: 'scss', title: 'SCSS', strength: 0.78},
        {slug: 'bootstrap', title: 'Bootstrap', strength: 0.7},
      ]},
      {slug: 'backend', title: 'Backend', strength: 0.72, children: [
        {slug: 'node', title: 'Node.js', strength: 0.78},
        {slug: 'express', title: 'Express', strength: 0.76},
        {slug: 'nestjs', title: 'NestJS', strength: 0.68},
        {slug: 'rest-graphql', title: 'REST / GraphQL', strength: 0.75},
      ]},
      {slug: 'data', title: 'Data', strength: 0.7, children: [
        {slug: 'mongodb', title: 'MongoDB', strength: 0.74},
        {slug: 'postgresql', title: 'PostgreSQL', strength: 0.7},
        {slug: 'firebase', title: 'Firebase', strength: 0.8},
        {slug: 'supabase', title: 'Supabase', strength: 0.65},
      ]},
      {slug: 'integrations', title: 'Integrations', strength: 0.75, children: [
        {slug: 'stripe', title: 'Stripe', strength: 0.8},
        {slug: 'paypal', title: 'PayPal', strength: 0.72},
        {slug: 'chrome-mv3', title: 'Chrome Extensions (MV3)', strength: 0.7},
      ]},
      {slug: 'delivery', title: 'Delivery & Process', strength: 0.85, children: [
        {slug: 'git', title: 'Git & GitHub', strength: 0.92},
        {slug: 'ci-cd', title: 'CI/CD', strength: 0.78},
        {slug: 'jira-linear', title: 'Jira / Linear', strength: 0.8},
      ]},
    ],
  },
  {
    slug: 'experience',
    title: 'Experience',
    items: [
      {slug: 'enigmatix', title: 'Enigmatix — Frontend-Focused Full-Stack', strength: 0.95},
      {slug: 'early-career', title: 'Early Career — Frontend Developer', strength: 0.7},
    ],
  },
  {
    slug: 'education',
    title: 'Education',
    items: [
      {slug: 'cs-foundations', title: 'Computer Science Foundations', strength: 0.8},
      {slug: 'frontend-track', title: 'Frontend Engineering (self-taught)', strength: 0.9},
      {slug: 'backend-track', title: 'Backend & Databases (self-study)', strength: 0.72},
      {slug: 'ongoing', title: 'Ongoing Learning', strength: 0.85},
    ],
  },
  {
    slug: 'about',
    title: 'About',
    items: [
      {slug: 'bio', title: 'Bio', strength: 0.85},
      {slug: 'capabilities', title: 'Capabilities', strength: 0.85},
      {slug: 'contact', title: 'Contact', strength: 0.8},
    ],
  },
];

// Archived / draft entities: present in the graph but nothing links to them
// (they read as orphans — the "loose ends" of the portfolio).
const ORPHANS: Item[] = [
  {slug: 'legacy/jquery-sites', title: 'Legacy jQuery Sites', archived: true, strength: 0.3},
  {slug: 'draft/old-resume', title: 'Old Résumé (draft)', archived: true, strength: 0.35},
];

export interface MockCrawl {
  depthNodesGraph: {nodes: MockNode[]; links: {source: number; target: number}[]};
  lastDepthNode: MockNode;
  depthNodes: MockNode;
}

export function buildMockCrawl(): MockCrawl {
  const rng = makeRng(20260725);
  const nodes: MockNode[] = [];
  const links: {source: number; target: number}[] = [];
  let nextId = 0;
  const byUrl = new Map<string, MockNode>();

  const build = (url: string, name: string, depth: number, item?: Item): MockNode => {
    // Strength drives proficiency/usage; add a little jitter for variety.
    const strength = Math.max(0.05, Math.min(1, (item?.strength ?? 0.6) + (rng() - 0.5) * 0.12));
    const archived = Boolean(item?.archived);
    const proficiency = Math.round(strength * 1000); // pageHealth key, banded 700/300
    const usage = Math.round(strength * (30 + rng() * 120)); // traffic key
    const reach = Math.round(usage * (5 + rng() * 10)); // impressions key
    const related = Math.round(2 + strength * 14 + rng() * 4); // keywords key
    const detail = Math.round(120 + strength * 900 + rng() * 200); // wordCount key
    const node: MockNode = {
      id: nextId++,
      url,
      name,
      depth,
      h1Header: name,
      h2Header: '',
      pageHealth: proficiency,
      traffic: usage,
      impressions: reach,
      keywords: related,
      wordCount: detail,
      pagerank: +(strength).toFixed(3),
      issueCount: archived ? Math.round(2 + rng() * 4) : Math.round(rng() * 2),
      status: archived ? 'Archived' : 'Active',
      isPrunable: archived || (strength < 0.4 && proficiency < 450),
      children: [],
    };
    nodes.push(node);
    byUrl.set(url, node);
    return node;
  };

  const root = build(`${HOST}/`, 'Portfolio', 0, {slug: '', title: 'Portfolio', strength: 1});

  SECTIONS.forEach((section) => {
    const sectionNode = build(`${HOST}/${section.slug}`, section.title, 1, {slug: section.slug, title: section.title, strength: 0.9});
    root.children!.push(sectionNode);
    links.push({source: root.id, target: sectionNode.id});

    section.items.forEach((item) => {
      const itemNode = build(`${HOST}/${section.slug}/${item.slug}`, item.title, 2, item);
      sectionNode.children!.push(itemNode);
      links.push({source: sectionNode.id, target: itemNode.id});

      (item.children ?? []).forEach((sub) => {
        const subNode = build(`${HOST}/${section.slug}/${item.slug}/${sub.slug}`, sub.title, 3, sub);
        itemNode.children!.push(subNode);
        links.push({source: itemNode.id, target: subNode.id});
      });
    });
  });

  // Cross-links: which projects/experience use which parts of the stack, and
  // how education feeds the stack — these give the chord/link-flow diagram real
  // inter-section ribbons and thicken the graph.
  const link = (a: string, b: string) => {
    const an = byUrl.get(a);
    const bn = byUrl.get(b);
    if (an && bn) links.push({source: an.id, target: bn.id});
  };
  link(`${HOST}/projects/ai-seo-platform`, `${HOST}/stack/frontend/react`);
  link(`${HOST}/projects/ai-seo-platform`, `${HOST}/stack/frontend/typescript`);
  link(`${HOST}/projects/ai-seo-platform`, `${HOST}/stack/frontend/nextjs`);
  link(`${HOST}/projects/ai-seo-platform`, `${HOST}/stack/frontend/mobx`);
  link(`${HOST}/projects/office-management`, `${HOST}/stack/data/firebase`);
  link(`${HOST}/projects/payments-checkout`, `${HOST}/stack/integrations/stripe`);
  link(`${HOST}/projects/payments-checkout`, `${HOST}/stack/integrations/paypal`);
  link(`${HOST}/projects/browser-extension`, `${HOST}/stack/integrations/chrome-mv3`);
  link(`${HOST}/projects/full-stack-practice`, `${HOST}/stack/backend/node`);
  link(`${HOST}/projects/full-stack-practice`, `${HOST}/stack/data/postgresql`);
  link(`${HOST}/experience/enigmatix`, `${HOST}/projects/ai-seo-platform`);
  link(`${HOST}/experience/enigmatix`, `${HOST}/projects/payments-checkout`);
  link(`${HOST}/education/frontend-track`, `${HOST}/stack/frontend`);
  link(`${HOST}/education/backend-track`, `${HOST}/stack/backend`);

  // Orphans (archived, no inbound link).
  ORPHANS.forEach((o) => build(`${HOST}/${o.slug}`, o.title, o.slug.includes('/') ? 2 : 1, o));

  return {depthNodesGraph: {nodes, links}, lastDepthNode: root, depthNodes: root};
}
