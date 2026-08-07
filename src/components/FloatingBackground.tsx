export function FloatingBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="blob-a absolute top-[-10%] left-[-5%] h-[46vmax] w-[46vmax] rounded-full bg-primary/35" />
      <div className="blob-b absolute top-[30%] right-[-12%] h-[40vmax] w-[40vmax] rounded-full bg-violet/35" />
      <div className="blob-c absolute bottom-[-18%] left-[25%] h-[38vmax] w-[38vmax] rounded-full bg-chart-3/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent,var(--background)_78%)]" />
    </div>
  );
}
