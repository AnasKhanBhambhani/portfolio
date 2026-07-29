import {
  SiHtml5, SiCss, SiJavascript, SiTypescript, SiReact, SiNextdotjs, SiRemix, SiSvelte,
  SiAntdesign, SiTailwindcss, SiShadcnui, SiStyledcomponents, SiReactquery, SiNodedotjs,
  SiExpress, SiNestjs, SiGithub, SiGitlab, SiJira, SiAsana, SiClickup, SiPostman, SiFigma,
  SiVercel, SiPostgresql, SiMongodb, SiGit, SiLinux, SiSupabase,
} from "react-icons/si";
import { TbBrandVscode, TbBrandSlack, TbApi } from "react-icons/tb";

// Icons render with `fill`/`stroke: currentColor`, so color is driven entirely by
// CSS (see .tech-tile-icon) — no colored source assets needed. A few official
// brand colors are near-black and unreadable on our black background, so those
// are swapped for a legible near-equivalent (noted inline). Slack and the
// generic "REST APIs" tile have no Simple Icons entry, so they use a Tabler
// brand icon / a neutral generic API glyph instead.
export const TECH_ICONS = [
  { name: "HTML", Icon: SiHtml5, color: "#E34F26", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
  { name: "CSS", Icon: SiCss, color: "#1572B6", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
  { name: "JavaScript", Icon: SiJavascript, color: "#F7DF1E", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
  { name: "TypeScript", Icon: SiTypescript, color: "#3178C6", url: "https://www.typescriptlang.org/" },
  { name: "React", Icon: SiReact, color: "#61DAFB", url: "https://react.dev/" },
  { name: "Next.js", Icon: SiNextdotjs, color: "#FFFFFF", url: "https://nextjs.org/" }, // official is black
  { name: "Remix", Icon: SiRemix, color: "#FFFFFF", url: "https://remix.run/" }, // official is black
  { name: "Svelte", Icon: SiSvelte, color: "#FF3E00", url: "https://svelte.dev/" },
  { name: "Ant Design", Icon: SiAntdesign, color: "#1890FF", url: "https://ant.design/" },
  { name: "Tailwind", Icon: SiTailwindcss, color: "#38BDF8", url: "https://tailwindcss.com/" },
  { name: "shadcn/ui", Icon: SiShadcnui, color: "#FFFFFF", url: "https://ui.shadcn.com/" }, // official is black
  { name: "styled-components", Icon: SiStyledcomponents, color: "#DB7093", url: "https://styled-components.com/" },
  { name: "React Query", Icon: SiReactquery, color: "#FF4154", url: "https://tanstack.com/query/latest" },
  { name: "Node.js", Icon: SiNodedotjs, color: "#339933", url: "https://nodejs.org/" },
  { name: "Express", Icon: SiExpress, color: "#FFFFFF", url: "https://expressjs.com/" }, // official is black
  { name: "NestJS", Icon: SiNestjs, color: "#E0234E", url: "https://nestjs.com/" },
  { name: "GitHub", Icon: SiGithub, color: "#FFFFFF", url: "https://github.com/" }, // official is black
  { name: "GitLab", Icon: SiGitlab, color: "#FC6D26", url: "https://about.gitlab.com/" },
  { name: "Jira", Icon: SiJira, color: "#0052CC", url: "https://www.atlassian.com/software/jira" },
  { name: "Asana", Icon: SiAsana, color: "#F06A6A", url: "https://asana.com/" },
  { name: "ClickUp", Icon: SiClickup, color: "#7B68EE", url: "https://clickup.com/" },
  { name: "Slack", Icon: TbBrandSlack, color: "#4A154B", url: "https://slack.com/" },
  { name: "Postman", Icon: SiPostman, color: "#FF6C37", url: "https://www.postman.com/" },
  { name: "Figma", Icon: SiFigma, color: "#F24E1E", url: "https://www.figma.com/" },
  { name: "Vercel", Icon: SiVercel, color: "#FFFFFF", url: "https://vercel.com/" }, // official is black
  { name: "VS Code", Icon: TbBrandVscode, color: "#007ACC", url: "https://code.visualstudio.com/" },
  { name: "PostgreSQL", Icon: SiPostgresql, color: "#4169E1", url: "https://www.postgresql.org/" },
  { name: "MongoDB", Icon: SiMongodb, color: "#47A248", url: "https://www.mongodb.com/" },
  { name: "Git", Icon: SiGit, color: "#F05032", url: "https://git-scm.com/" },
  { name: "Linux", Icon: SiLinux, color: "#FCC624", url: "https://www.linux.org/" },
  { name: "Supabase", Icon: SiSupabase, color: "#3ECF8E", url: "https://supabase.com/" },
  { name: "REST APIs", Icon: TbApi, color: "#22D3EE", url: "https://restfulapi.net/" },
];

// Snooker/pool-rack layout: each row holds one fewer tile than the last,
// tapering to a single tile — row sizes add up to TECH_ICONS.length.
const ROW_SIZES = [8, 7, 6, 5, 3, 2, 1];

export const TECH_ICON_ROWS = (() => {
  let cursor = 0;
  return ROW_SIZES.map((size) => {
    const row = TECH_ICONS.slice(cursor, cursor + size);
    cursor += size;
    return row;
  });
})();
