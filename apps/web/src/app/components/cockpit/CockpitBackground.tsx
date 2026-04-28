export function CockpitBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(37,99,235,0.22),transparent_34%),radial-gradient(circle_at_72%_66%,rgba(163,230,53,0.16),transparent_32%),linear-gradient(180deg,#07101d_0%,#05070f_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute left-10 top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-32 w-32 rounded-full bg-lime-300/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.22)_1px,transparent_1.5px)] [background-size:38px_38px] opacity-20" />
    </>
  );
}
