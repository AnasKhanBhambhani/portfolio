import Reveal from "./Reveal";
import GlassCard from "./ui/GlassCard";
import { STATS } from "../data/content";
import { SECTION } from "../ui";
import useCountUp from "../hooks/useCountUp";

function StatCard({ stat, index }) {
  const [ref, value] = useCountUp(stat.count);
  return (
    <Reveal delay={(index % 4) + 1} className="h-full">
      <GlassCard className="w-full! h-full!" contentClassName="text-center h-full">
        <div className="p-6 sm:p-8.5 h-full">
          <div ref={ref} className="tabular-nums font-display font-bold text-[clamp(36px,5vw,52px)] grad-text">
            {value}
            {stat.suffix}
          </div>
          <div className="text-muted text-sm mt-1.5">{stat.label}</div>
        </div>
      </GlassCard>
    </Reveal>
  );
}

export default function Achievements() {
  return (
    <section id="achievements" data-aos="zoom-in" className={SECTION}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        {STATS.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>
    </section>
  );
}
