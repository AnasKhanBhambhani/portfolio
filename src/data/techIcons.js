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
  { name: "HTML", Icon: SiHtml5, color: "#E34F26" },
  { name: "CSS", Icon: SiCss, color: "#1572B6" },
  { name: "JavaScript", Icon: SiJavascript, color: "#F7DF1E" },
  { name: "TypeScript", Icon: SiTypescript, color: "#3178C6" },
  { name: "React", Icon: SiReact, color: "#61DAFB" },
  { name: "Next.js", Icon: SiNextdotjs, color: "#FFFFFF" }, // official is black
  { name: "Remix", Icon: SiRemix, color: "#FFFFFF" }, // official is black
  { name: "Svelte", Icon: SiSvelte, color: "#FF3E00" },
  { name: "Ant Design", Icon: SiAntdesign, color: "#1890FF" },
  { name: "Tailwind", Icon: SiTailwindcss, color: "#38BDF8" },
  { name: "shadcn/ui", Icon: SiShadcnui, color: "#FFFFFF" }, // official is black
  { name: "styled-components", Icon: SiStyledcomponents, color: "#DB7093" },
  { name: "React Query", Icon: SiReactquery, color: "#FF4154" },
  { name: "Node.js", Icon: SiNodedotjs, color: "#339933" },
  { name: "Express", Icon: SiExpress, color: "#FFFFFF" }, // official is black
  { name: "NestJS", Icon: SiNestjs, color: "#E0234E" },
  { name: "GitHub", Icon: SiGithub, color: "#FFFFFF" }, // official is black
  { name: "GitLab", Icon: SiGitlab, color: "#FC6D26" },
  { name: "Jira", Icon: SiJira, color: "#0052CC" },
  { name: "Asana", Icon: SiAsana, color: "#F06A6A" },
  { name: "ClickUp", Icon: SiClickup, color: "#7B68EE" },
  { name: "Slack", Icon: TbBrandSlack, color: "#4A154B" },
  { name: "Postman", Icon: SiPostman, color: "#FF6C37" },
  { name: "Figma", Icon: SiFigma, color: "#F24E1E" },
  { name: "Vercel", Icon: SiVercel, color: "#FFFFFF" }, // official is black
  { name: "VS Code", Icon: TbBrandVscode, color: "#007ACC" },
  { name: "PostgreSQL", Icon: SiPostgresql, color: "#4169E1" },
  { name: "MongoDB", Icon: SiMongodb, color: "#47A248" },
  { name: "Git", Icon: SiGit, color: "#F05032" },
  { name: "Linux", Icon: SiLinux, color: "#FCC624" },
  { name: "Supabase", Icon: SiSupabase, color: "#3ECF8E" },
  { name: "REST APIs", Icon: TbApi, color: "#22D3EE" },
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
