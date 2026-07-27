import Reveal from "./Reveal";
import { SECTION, TAG_HEAD, SEC_TITLE, SEC_LEDE } from "../ui";

// Heading only — the tech-stack showcase itself (video + icon grid) is a
// separate, full-width component (TechStackShowcase) rendered outside <main>
// so it isn't constrained by main's max-width/overflow-clip.
export default function StackLens() {
  return (
    <section id="stack" className={`${SECTION} pb-0!`}>
      <Reveal className={TAG_HEAD}>Stack</Reveal>
      <Reveal as="h2" delay={1} className={`${SEC_TITLE} mb-3`}>
        What I build with
      </Reveal>
      <Reveal as="p" delay={2} className={SEC_LEDE}>
        My whole portfolio as an interactive map — projects, stack, experience and education,
        explored as a 3D graph, a 2D graph and a tree.
      </Reveal>
    </section>
  );
}
