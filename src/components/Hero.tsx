"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Component as TrustBadge } from "@/components/ui/demo";
import { useTheme } from "./theme-provider";

/* -----------------------------------------------------------------------------
 * CANVAS STAGGERED PHYSICS ENGINE
 * Calibrated outward expansion ripple: extremely smooth and slightly relaxed 
 * to feel cohesive, satisfyingly responsive, and visually distinct.
 * -------------------------------------------------------------------------- */

type Pixel = {
  x: number;
  y: number;
  color: string;
  ctx: CanvasRenderingContext2D;
  speed: number;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSizeInt: number;
  maxSize: number;
  delay: number;
  counter: number;
  counterStep: number;
  isIdle: boolean;
  isReverse: boolean;
  isShimmer: boolean;
  draw: () => void;
  appear: () => void;
  disappear: () => void;
  shimmer: () => void;
};

function createPixel(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  color: string,
  baseSpeed: number,
  delay: number
): Pixel {
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  const p: Pixel = {
    x, y, color, ctx,
    speed: rand(0.08, 0.4) * baseSpeed,
    size: 0,
    sizeStep: rand(0.12, 0.28),
    minSize: 0.5,
    maxSizeInt: 2,
    maxSize: rand(0.5, 2),
    delay,
    counter: 0,
    counterStep: rand(1.8, 3.2) + (canvas.width + canvas.height) * 0.008,
    isIdle: false,
    isReverse: false,
    isShimmer: false,
    draw() {
      const offset = p.maxSizeInt * 0.5 - p.size * 0.5;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x + offset, p.y + offset, p.size, p.size);
    },
    appear() {
      p.isIdle = false;
      if (p.counter <= p.delay) {
        p.counter += p.counterStep;
        return;
      }
      if (p.size >= p.maxSize) p.isShimmer = true;
      if (p.isShimmer) p.shimmer();
      else p.size += p.sizeStep;
      p.draw();
    },
    disappear() {
      p.isShimmer = false;
      p.counter = 0;
      if (p.size <= 0) {
        p.isIdle = true;
        return;
      }
      p.size -= 0.1;
      p.draw();
    },
    shimmer() {
      if (p.size >= p.maxSize) p.isReverse = true;
      else if (p.size <= p.minSize) p.isReverse = false;
      if (p.isReverse) p.size -= p.speed;
      else p.size += p.speed;
    },
  };

  return p;
}

type PixelCanvasProps = {
  colors: string[];
  gap?: number;
  speed?: number;
};

function PixelCanvas({ colors, gap = 5, speed = 30 }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef(performance.now());
  const reducedMotionRef = useRef(false);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || colors.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = wrap.getBoundingClientRect();
    const w = Math.floor(width);
    const h = Math.floor(height);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const effectiveSpeed = reducedMotionRef.current ? 0 : Math.min(speed, 100) * 0.001;
    const pixels: Pixel[] = [];

    for (let x = 0; x < w; x += gap) {
      for (let y = 0; y < h; y += gap) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const dx = x - w / 2;
        const dy = y - h / 2;
        const delay = reducedMotionRef.current ? 0 : Math.sqrt(dx * dx + dy * dy) * 0.65;
        pixels.push(createPixel(ctx, canvas, x, y, color, effectiveSpeed, delay));
      }
    }

    pixelsRef.current = pixels;
  }, [colors, gap, speed]);

  const animate = useCallback((mode: "appear" | "disappear") => {
    cancelAnimationFrame(animationRef.current);
    const frameInterval = 1000 / 60;

    const loop = () => {
      animationRef.current = requestAnimationFrame(loop);

      const now = performance.now();
      const elapsed = now - lastFrameRef.current;
      if (elapsed < frameInterval) return;
      lastFrameRef.current = now - (elapsed % frameInterval);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pixels = pixelsRef.current;
      for (const pixel of pixels) pixel[mode]();

      if (pixels.every((p) => p.isIdle)) {
        cancelAnimationFrame(animationRef.current);
      }
    };

    animationRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    init();

    const resizeObserver = new ResizeObserver(() => init());
    if (wrapRef.current) resizeObserver.observe(wrapRef.current);

    animate("appear");

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, [init, animate]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * HERO COMPONENT
 * -------------------------------------------------------------------------- */

export function Hero() {
  const { theme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [themeColors, setThemeColors] = useState<string[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchReviewsForBadge = async () => {
      try {
        const res = await fetch("https://api.gcx.co.in/api/reviews");
        if (res.ok) {
          const data = await res.json();
          // Normalize to contain name & avatar_url (backend review uses avatar_url)
          setReviews(
            data
              .filter((r: any) => r.verified)
              .map((r: any) => ({
                name: r.name,
                avatar_url: r.avatar_url,
              }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch reviews for badge:", err);
      }
    };
    fetchReviewsForBadge();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const updateColors = () => {
      const div = document.createElement("div");
      document.body.appendChild(div);
      div.className = "text-muted-foreground";
      const muted = getComputedStyle(div).color;
      div.className = "text-primary";
      const primary = getComputedStyle(div).color;
      document.body.removeChild(div);
      
      setThemeColors([muted, muted, muted, muted, primary]);
    };

    updateColors();

    const timer = setTimeout(updateColors, 100);
    const loadTimer = setTimeout(() => setIsLoaded(true), 50);

    return () => {
      clearTimeout(timer);
      clearTimeout(loadTimer);
    };
  }, [theme]);

  const word1 = "Exchange";
  const word2 = "Gift Cards.";
  const description = "Turn your unused Amazon, Flipkart, Roblox, League of Legends, Overwatch 2, and Sea of Thieves gift cards into UPI cash or USDT instantly.";
  const primaryCta = "Start Trade on WhatsApp";
  const primaryCtaMobile = "Start Trade";
  const secondaryCta = "See Card Brands";
  const secondaryCtaMobile = "Cards";

  return (
    <div className="relative w-full min-h-[100dvh] bg-background flex flex-col justify-between md:justify-center md:gap-6 py-8 md:py-0 px-2 sm:px-6 overflow-hidden select-none isolate">
      <style>{`
        .tahoe-glass-text {
            color: var(--foreground);
            text-shadow: 0 1px 2px rgba(0,0,0,0.04);
            letter-spacing: -0.01em;
        }
        .dark .tahoe-glass-text {
            color: transparent;
            background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.55) 25%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.92) 55%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,1) 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-stroke: 0px transparent;
            filter: drop-shadow(0 8px 24px rgba(0,0,0,0.5)) drop-shadow(0 2px 6px rgba(0,0,0,0.3));
            animation: shimmer 8s linear infinite;
        }
        @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: 0% center; }
        }
      `}</style>

      {/* Permanent canvas background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {themeColors.length > 0 && (
          <div className="absolute inset-0 opacity-50 dark:opacity-40 transition-opacity duration-500">
            <PixelCanvas colors={themeColors} gap={6} speed={30} />
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] pointer-events-none opacity-70" />
      </div>

      {/* Top Container: Tahoe Glass Header */}
      <div className="flex flex-col items-center justify-center text-center order-1 md:order-1 mt-28 sm:mt-0 pointer-events-none w-full">
        <h1 className="tahoe-glass-text flex flex-row items-center justify-center gap-1.5 sm:gap-4 lg:gap-6 px-1 py-2 w-full flex-wrap text-[2.8rem] xs:text-[3.2rem] sm:text-6xl md:text-8xl lg:text-9xl leading-[1.1]">
          <span className="font-serif italic font-medium">{word1}</span>
          <span className="font-sans font-extrabold tracking-tighter">{word2}</span>
        </h1>
      </div>

      {/* Center Container: Description & Accepted Cards */}
      <div className="flex flex-col items-center justify-center text-center my-auto md:my-0 order-2 md:order-2 px-1 w-full pointer-events-none">
        <p className="text-sm sm:text-lg md:text-xl font-light text-foreground/85 max-w-[95%] sm:max-w-md md:max-w-xl px-1 leading-relaxed">
          {description}
        </p>

        {/* Accepted Cards list */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8 max-w-xl px-4 pointer-events-auto">
          <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground/85 mr-2 font-mono">We Accept:</span>
          {["Amazon", "Flipkart", "Roblox", "Overwatch 2", "League of Legends", "Sea of Thieves"].map((card) => (
            <span key={card} className="text-[10.5px] font-bold px-3 py-1.5 rounded-full bg-foreground/[0.03] border border-border/60 text-foreground shadow-sm">
              {card}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Container: CTA Row & Trust Badge */}
      <div
        className={cn("pointer-events-auto flex flex-col items-center justify-center gap-6 mt-4 md:mt-10 mb-4 md:mb-0 order-4 md:order-3 transition-all duration-1000 transform px-1", isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}
        style={{ transitionDelay: "450ms" }}
      >
        {/* TrustBadge component */}
        <TrustBadge reviews={reviews} />

        {/* Action Buttons */}
        <div className="flex flex-row items-center gap-3">
          <a
            href="https://wa.me/919120138828"
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex h-10 md:h-12 items-center justify-center gap-1.5 md:gap-2 rounded-xl bg-gradient-to-b from-primary/90 to-primary px-4 md:px-8 text-xs md:text-sm font-semibold text-primary-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.15),0_12px_24px_rgba(0,0,0,0.15)] ring-1 ring-primary/20 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <svg
              viewBox="0 0 32 32"
              className="w-3.5 h-3.5 md:w-4 md:h-4 fill-white dark:fill-black shrink-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M26.576 5.363c-2.69-2.69-6.406-4.354-10.511-4.354-8.209 0-14.865 6.655-14.865 14.865 0 2.732 0.737 5.291 2.022 7.491l-0.038-0.070-2.109 7.702 7.879-2.067c2.051 1.139 4.498 1.809 7.102 1.809h0.006c8.209-0.003 14.862-6.659 14.862-14.868 0-4.103-1.662-7.817-4.349-10.507l0 0zM16.062 28.228h-0.005c-0 0-0.001 0-0.001 0-2.319 0-4.489-0.64-6.342-1.753l0.056 0.031-0.451-0.267-4.675 1.227 1.247-4.559-0.294-0.467c-1.185-1.862-1.889-4.131-1.889-6.565 0-6.822 5.531-12.353 12.353-12.353s12.353 5.531 12.353 12.353c0 6.822-5.53 12.353-12.353 12.353h-0zM22.838 18.977c-0.371-0.186-2.197-1.083-2.537-1.208-0.341-0.124-0.589-0.185-0.837 0.187-0.246 0.371-0.958 1.207-1.175 1.455-0.216 0.249-0.434 0.279-0.805 0.094-1.15-0.466-2.138-1.087-2.997-1.852l0.010 0.009c-0.799-0.74-1.484-1.587-2.037-2.521l-0.028-0.052c-0.216-0.371-0.023-0.572 0.162-0.757 0.167-0.166 0.372-0.434 0.557-0.65 0.146-0.179 0.271-0.384 0.366-0.604l0.006-0.017c0.043-0.087 0.068-0.188 0.068-0.296 0-0.131-0.037-0.253-0.101-0.357l0.002 0.003c-0.094-0.186-0.836-2.014-1.145-2.758-0.302-0.724-0.609-0.625-0.836-0.637-0.216-0.010-0.464-0.012-0.712-0.012-0.395 0.010-0.746 0.188-0.988 0.463l-0.001 0.002c-0.802 0.761-1.3 1.834-1.3 3.023 0 0.026 0 0.053 0.001 0.079l-0-0.004c0.131 1.467 0.681 2.784 1.527 3.857l-0.012-0.015c1.604 2.379 3.742 4.282 6.251 5.564l0.094 0.043c0.548 0.248 1.25 0.513 1.968 0.74l0.149 0.041c0.442 0.14 0.951 0.221 1.479 0.221 0.303 0 0.601-0.027 0.889-0.078l-0.031 0.004c1.069-0.223 1.956-0.868 2.497-1.749l0.009-0.017c0.165-0.366 0.261-0.793 0.261-1.242 0-0.185-0.016-0.366-0.047-0.542l0.003 0.019c-0.092-0.155-0.34-0.247-0.712-0.434z"></path>
            </svg>
            <span className="inline md:hidden">{primaryCtaMobile}</span>
            <span className="hidden md:inline">{primaryCta}</span>
            <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </a>
          <a
            href="#brands"
            className="relative inline-flex h-10 md:h-12 items-center justify-center gap-1.5 md:gap-2 rounded-xl bg-gradient-to-b from-card/80 to-card px-4 md:px-8 text-xs md:text-sm font-semibold text-card-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.05)] ring-1 ring-border/50 backdrop-blur-md transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="inline md:hidden">{secondaryCtaMobile}</span>
            <span className="hidden md:inline">{secondaryCta}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Hero;
