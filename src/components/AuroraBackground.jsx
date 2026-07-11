export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="aurora-blob animate-drift w-[620px] h-[620px] top-[-160px] left-[-120px]"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 55%, transparent), transparent 70%)" }}
      />
      <div
        className="aurora-blob animate-drift w-[560px] h-[560px] top-[30%] right-[-180px]"
        style={{
          background: "radial-gradient(circle, color-mix(in srgb, var(--color-violet) 45%, transparent), transparent 70%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="aurora-blob animate-drift w-[520px] h-[520px] bottom-[-160px] left-[25%]"
        style={{
          background: "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 40%, transparent), transparent 70%)",
          animationDelay: "-11s",
        }}
      />
      <div className="absolute inset-0 grain-layer opacity-35" />
    </div>
  );
}
