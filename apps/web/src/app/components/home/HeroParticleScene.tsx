"use client";

export default function HeroParticleScene() {
  return (
    <div className="home-motion-layer" data-testid="hero-particle-scene" aria-hidden="true">
      <span className="home-motion-grid" />
      <span className="home-broadcast-beam home-broadcast-beam--primary" />
      <span className="home-broadcast-beam home-broadcast-beam--secondary" />
      <span className="home-broadcast-beam home-broadcast-beam--tertiary" />
      <span className="home-route-node home-route-node--task">任务</span>
      <span className="home-route-node home-route-node--tools">工具</span>
      <span className="home-route-node home-route-node--proof">经验</span>
    </div>
  );
}
