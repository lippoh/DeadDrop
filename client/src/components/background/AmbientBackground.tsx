'use client';

import { useCallback, useEffect, useRef } from 'react';

// ─── Configuration ───────────────────────────────────────────────────────────
interface Config {
  particleCount: number;
  maxLineDistance: number;
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
  maxLineDistance: 150,
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

  // Outer glow
  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glowSize);
  gradient.addColorStop(0, p.glowColor);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.glowSize, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.globalAlpha = currentOpacity * 0.6;
  ctx.fill();

  // Core dot
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.globalAlpha = currentOpacity;
  ctx.fill();

  // Bright center highlight
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
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      particles.push(
        createParticle(width, height, CONFIG.colors.particles, CONFIG.colors.glow, CONFIG.sizes)
      );
    }
    particlesRef.current = particles;
  }, []);

  const animate = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);

      // Subtle radial ambient glow (dark pink tint)
      const bgGrad = ctx.createRadialGradient(
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
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      timeRef.current += 1;
      const time = timeRef.current;
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Update particles
      for (const p of particles) {
        // Mouse repulsion
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

        // Gentle drift back toward base
        p.vx += (p.baseX - p.x) * 0.0003;
        p.vy += (p.baseY - p.y) * 0.0003;

        // Random micro-drift for organic feel
        p.vx += (Math.random() - 0.5) * 0.01;
        p.vy += (Math.random() - 0.5) * 0.01;

        // Wrap edges
        const pad = 20;
        if (p.x < -pad) p.x = width + pad;
        if (p.x > width + pad) p.x = -pad;
        if (p.y < -pad) p.y = height + pad;
        if (p.y > height + pad) p.y = -pad;

        // Migrate base for organic flow
        p.baseX += (Math.random() - 0.5) * 0.2;
        p.baseY += (Math.random() - 0.5) * 0.2;
        p.baseX = Math.max(0, Math.min(width, p.baseX));
        p.baseY = Math.max(0, Math.min(height, p.baseY));

        // Opacity pulsing
        p.opacity += p.opacityDirection * 0.003;
        if (p.opacity > 1) {
          p.opacity = 1;
          p.opacityDirection = -1;
        } else if (p.opacity < 0.15) {
          p.opacity = 0.15;
          p.opacityDirection = 1;
        }
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          drawLine(ctx, particles[i], particles[j], CONFIG.maxLineDistance, CONFIG.colors.linesRGB);
        }
      }

      // Draw particles on top
      for (const p of particles) {
        drawParticle(ctx, p, time);
      }

      animationRef.current = requestAnimationFrame(() => animate(ctx, width, height));
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    resize();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(canvas.parentElement || document.body);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const rect = canvas.getBoundingClientRect();
    animate(ctx, rect.width, rect.height);

    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [initParticles, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
      style={{ opacity: 0.85 }}
    />
  );
}
