'use client';

import { useEffect, useRef } from 'react';

// ─── Configuration ───────────────────────────────────────────────────────────
interface Config {
  particleCount: number;
  mobileParticleCount: number;
  maxLineDistance: number;
  mobileLineDistance: number;
  particleSpeed: number;
  mouseRadius: number;
  mouseForce: number;
  colors: {
    particles: string[];
    linesRGB: string;
    glow: string[];
  };
  sizes: {
    min: number;
    max: number;
    glowMultiplier: number;
  };
}

const CONFIG: Config = {
  particleCount: 140,
  mobileParticleCount: 40,
  maxLineDistance: 150,
  mobileLineDistance: 75,
  particleSpeed: 0.3,
  mouseRadius: 200,
  mouseForce: 0.02,
  colors: {
    particles: ['#FF2D78', '#FF6B9D', '#C2185B', '#FF80AB', '#F50057'],
    linesRGB: '255, 45, 120',
    glow: [
      'rgba(255, 45, 120, 0.15)',
      'rgba(194, 24, 91, 0.12)',
      'rgba(245, 0, 87, 0.10)',
    ],
  },
  sizes: {
    min: 0.5,
    max: 2.5,
    glowMultiplier: 8,
  },
};

// ─── Particle ────────────────────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  opacityDirection: number;
  glowSize: number;
  glowColor: string;
  pulseSpeed: number;
  pulseOffset: number;
}

function createParticle(
  width: number,
  height: number,
  colors: string[],
  glowColors: string[],
  sizes: Config['sizes']
): Particle {
  const x = Math.random() * width;
  const y = Math.random() * height;
  const colorIndex = Math.floor(Math.random() * colors.length);
  const size = sizes.min + Math.random() * (sizes.max - sizes.min);

  return {
    x,
    y,
    baseX: x,
    baseY: y,
    vx: (Math.random() - 0.5) * CONFIG.particleSpeed * 2,
    vy: (Math.random() - 0.5) * CONFIG.particleSpeed * 2,
    size,
    color: colors[colorIndex],
    opacity: 0.2 + Math.random() * 0.8,
    opacityDirection: Math.random() > 0.5 ? 1 : -1,
    glowSize: size * sizes.glowMultiplier,
    glowColor: glowColors[Math.floor(Math.random() * glowColors.length)],
    pulseSpeed: 0.005 + Math.random() * 0.01,
    pulseOffset: Math.random() * Math.PI * 2,
  };
}

// ─── Canvas Helpers ──────────────────────────────────────────────────────────
function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, time: number) {
  const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.3 + 0.7;
  const currentOpacity = p.opacity * pulse;

  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glowSize);
  gradient.addColorStop(0, p.glowColor);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.glowSize, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.globalAlpha = currentOpacity * 0.6;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.globalAlpha = currentOpacity;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = currentOpacity * 0.8;
  ctx.fill();

  ctx.globalAlpha = 1;
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  p1: Particle,
  p2: Particle,
  maxDist: number,
  lineColorRGB: string
) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist >= maxDist) return;

  const opacity = (1 - dist / maxDist) * 0.3;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.strokeStyle = `rgba(${lineColorRGB}, ${opacity})`;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const isMobile = window.innerWidth < 768;
    const particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000 };
    let animationId = 0;
    let time = 0;
    let resizeTimeout: number | null = null;

    // Local non-null refs for nested functions
    const cvs = canvas;
    const context = ctx;

    function initParticles(width: number, height: number) {
      particles.length = 0;
      const count = isMobile ? CONFIG.mobileParticleCount : CONFIG.particleCount;
      for (let i = 0; i < count; i++) {
        particles.push(
          createParticle(width, height, CONFIG.colors.particles, CONFIG.colors.glow, CONFIG.sizes)
        );
      }
    }

    function resize() {
      const rect = cvs.getBoundingClientRect();
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      context.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    }

    resize();

    function animate() {
      const rect = cvs.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      context.clearRect(0, 0, width, height);

      const bgGrad = context.createRadialGradient(
        width * 0.3,
        height * 0.3,
        0,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );
      bgGrad.addColorStop(0, 'rgba(255, 45, 120, 0.012)');
      bgGrad.addColorStop(0.5, 'rgba(194, 24, 91, 0.006)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = bgGrad;
      context.fillRect(0, 0, width, height);

      time += 1;

      for (const p of particles) {
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mDist < CONFIG.mouseRadius && mDist > 0) {
          const force = (CONFIG.mouseRadius - mDist) / CONFIG.mouseRadius;
          p.vx += (mdx / mDist) * force * CONFIG.mouseForce;
          p.vy += (mdy / mDist) * force * CONFIG.mouseForce;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.995;
        p.vy *= 0.995;

        p.vx += (p.baseX - p.x) * 0.0003;
        p.vy += (p.baseY - p.y) * 0.0003;

        p.vx += (Math.random() - 0.5) * 0.01;
        p.vy += (Math.random() - 0.5) * 0.01;

        const pad = 20;
        if (p.x < -pad) p.x = width + pad;
        if (p.x > width + pad) p.x = -pad;
        if (p.y < -pad) p.y = height + pad;
        if (p.y > height + pad) p.y = -pad;

        p.baseX += (Math.random() - 0.5) * 0.2;
        p.baseY += (Math.random() - 0.5) * 0.2;
        p.baseX = Math.max(0, Math.min(width, p.baseX));
        p.baseY = Math.max(0, Math.min(height, p.baseY));

        p.opacity += p.opacityDirection * 0.003;
        if (p.opacity > 1) {
          p.opacity = 1;
          p.opacityDirection = -1;
        } else if (p.opacity < 0.15) {
          p.opacity = 0.15;
          p.opacityDirection = 1;
        }
      }

      const maxDist = isMobile ? CONFIG.mobileLineDistance : CONFIG.maxLineDistance;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          drawLine(context, particles[i], particles[j], maxDist, CONFIG.colors.linesRGB);
        }
      }

      for (const p of particles) {
        drawParticle(context, p, time);
      }

      animationId = requestAnimationFrame(animate);
    }

    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout !== null) clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resize, 200);
    });
    resizeObserver.observe(cvs.parentElement || document.body);

    function handleMouseMove(e: MouseEvent) {
      const rect = cvs.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    function handleMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    cvs.addEventListener('mousemove', handleMouseMove);
    cvs.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      if (resizeTimeout !== null) clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      cvs.removeEventListener('mousemove', handleMouseMove);
      cvs.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
      style={{ opacity: 0.85 }}
    />
  );
}