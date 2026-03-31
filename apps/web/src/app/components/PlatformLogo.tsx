"use client";

export default function PlatformLogo() {
  return (
    <div
      className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] border border-white/55 bg-white/38 shadow-[0_16px_32px_rgba(15,23,42,0.1)] backdrop-blur-md transition-transform duration-200 hover:-translate-y-0.5"
      aria-label="星点评品牌标识"
    >
      <div
        className="pointer-events-none absolute inset-[1px] rounded-[18px] bg-radial-[at_30%_25%] from-white/60 via-white/8 to-transparent opacity-75"
        aria-hidden="true"
      />
      <img
        src="/brand/logo.png"
        alt="星点评品牌标识"
        className="relative z-10 h-12 w-12 object-contain drop-shadow-[0_8px_18px_rgba(17,32,59,0.22)]"
      />
    </div>
  );
}
