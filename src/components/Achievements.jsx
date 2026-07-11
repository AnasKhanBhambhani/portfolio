import Reveal from "./Reveal";
import { STATS } from "../data/content";
import { GLASS_CARD, SECTION } from "../ui";
import useCountUp from "../hooks/useCountUp";

function StatCard({ stat, index }) {
  const [ref, value] = useCountUp(stat.count);
  return (
    <Reveal
      delay={(index % 4) + 1}
      className={`${GLASS_CARD} text-center p-6 sm:p-8.5 hover:-translate-y-1.25 hover:border-violet/40`}
    >
      <div ref={ref} className="tabular-nums font-display font-bold text-[clamp(36px,5vw,52px)] grad-text">
        {value}
        {stat.suffix}
      </div>
      <div className="text-muted text-sm mt-1.5">{stat.label}</div>
    </Reveal>
  );
}

export default function Achievements() {
  return (
    <section id="achievements" className={SECTION}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        {STATS.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>
    </section>
  );
}
