"use client";

export default function HeroParticleScene() {
  return (
    <div className="home-motion-layer" data-testid="hero-particle-scene" aria-hidden="true">
      <span className="home-motion-grid" />
      <span className="home-broadcast-beam home-broadcast-beam--primary" />
      <span className="home-broadcast-beam home-broadcast-beam--secondary" />
      <span className="home-broadcast-beam home-broadcast-beam--tertiary" />
    </div>
  );
}
