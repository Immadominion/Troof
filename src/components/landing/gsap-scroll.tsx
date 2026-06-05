"use client";

import { useEffect, useRef } from "react";

/**
 * Drives every landing-page motion from one client wrapper:
 *
 *  • a HERO entrance timeline that plays on mount,
 *  • play-once scroll reveals for each section below the fold (headings,
 *    card/step grids, the proof block, the orbit cluster),
 *  • two restrained signature beats — the "How it works" dashed connector
 *    drawing across (transform-only scaleX) and the orbit chips settling onto
 *    their (CSS-spinning) rings,
 *  • the existing "deck of slides" snap — but only where sections are genuinely
 *    full-height (≥1536px, the `2xl` breakpoint the page's FULL class uses), so
 *    it no longer snaps to mid-section between 1024–1535px.
 *
 * Pre-hiding lives in CSS, gated on `html.gsap-armed` (added before paint by a
 * tiny script in layout.tsx, only when JS is live AND motion is allowed) — so
 * there is no FOUC and content stays visible with JS disabled or
 * prefers-reduced-motion set. Everything is built inside one `gsap.matchMedia()`
 * whose `.revert()` is the only cleanup needed; it also branches reduced-motion
 * and desktop/mobile in one place and re-runs if those settings change live.
 *
 * Motion is decorative only: opacity + transform, no new colour, nothing that
 * implies status — the verdict green/red stay the only chromatic signals.
 */
export function GsapScroll({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = containerRef.current;
    if (!scope) return;

    let cancelled = false;
    let mm: { revert: () => void } | undefined;

    async function init() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !containerRef.current) return;
      const root = containerRef.current;

      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });

      // `armed` mirrors the CSS gate: when absent, nothing was pre-hidden, so we
      // must not animate (content is already visible).
      const armed = document.documentElement.classList.contains("gsap-armed");

      const media = gsap.matchMedia(root);
      mm = media; // keep a minimal handle for cleanup

      media.add(
        {
          // `base` always matches, so the callback ALWAYS runs (and re-runs when
          // the others toggle). Without it, gsap.matchMedia skips the callback
          // entirely on the common case (width < 1536 + motion on) — which would
          // strand every pre-hidden target invisible. isDeck/reduce stay as flags.
          base: "(min-width: 0px)",
          isDeck: "(min-width: 1536px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const conds = ctx.conditions ?? {};
          const isDeck = !!conds.isDeck;
          const reduce = !!conds.reduce;
          const q = gsap.utils.selector(root);

          // ── No motion: ensure everything is visible, build nothing. ──
          if (reduce || !armed) {
            gsap.set(
              q(
                "[data-hero], [data-reveal], [data-reveal-group] > *, [data-orbit-center], [data-orbit-chip]",
              ),
              { clearProps: "opacity,transform" },
            );
            gsap.set(q("[data-connector]"), { clearProps: "transform" });
            return;
          }

          const EASE = "power2.out";
          // free the layer-promotion hint once an element has finished revealing
          const settle = (t: Element | Element[]) =>
            gsap.set(t, { clearProps: "willChange" });

          // ───────────────── HERO — entrance timeline (on load) ─────────────────
          const hero = (k: string) => q(`[data-hero="${k}"]`);
          const heroEls = ["badge", "title", "lead", "cta", "trust"].flatMap(hero);
          const visual = hero("visual");
          const answer = [...hero("q"), ...hero("a-card"), ...hero("a-chip")];

          gsap.set([...heroEls, ...visual, ...answer], {
            willChange: "transform, opacity",
          });
          gsap.set(heroEls, { y: 16 });
          gsap.set(visual, { y: 22, scale: 0.985 });
          gsap.set(answer, { y: 8 });

          const tl = gsap.timeline({
            defaults: { ease: EASE, duration: 0.6 },
            onComplete: () => settle([...heroEls, ...visual, ...answer]),
          });
          tl.to(heroEls, { opacity: 1, y: 0, stagger: 0.08 }, 0.05);
          if (visual.length) {
            tl.to(
              visual,
              { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" },
              0.18,
            );
          }
          // the in-mock answer "composes" a beat after the frame lands
          if (answer.length) {
            tl.to(
              answer,
              { opacity: 1, y: 0, duration: 0.45, stagger: 0.12 },
              0.55,
            );
          }

          // ───────────── SCROLL REVEALS — standalone elements (batched) ─────────────
          const singles = q(
            "[data-reveal]:not([data-hero]):not([data-reveal-group] [data-reveal])",
          );
          singles.forEach((el) => gsap.set(el, { y: 18 }));
          ScrollTrigger.batch(singles, {
            start: "top 85%",
            once: true,
            onEnter: (batch) => {
              gsap.set(batch, { willChange: "transform, opacity" });
              gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: EASE,
                stagger: 0.1,
                overwrite: true,
                onComplete: () => settle(batch),
              });
            },
          });

          // ───────────── SCROLL REVEALS — staggered groups (card / step grids) ─────────────
          q("[data-reveal-group]").forEach((group) => {
            const kids = Array.from(group.children) as HTMLElement[];
            if (!kids.length) return;
            gsap.set(kids, { y: 20 });
            ScrollTrigger.create({
              trigger: group,
              start: "top 82%",
              once: true,
              onEnter: () => {
                gsap.set(kids, { willChange: "transform, opacity" });
                gsap.to(kids, {
                  opacity: 1,
                  y: 0,
                  duration: 0.6,
                  ease: EASE,
                  stagger: 0.08,
                  overwrite: true,
                  onComplete: () => settle(kids),
                });
              },
            });
          });

          // ───────────── SIGNATURE — the "How it works" dashed connector draws across ─────────────
          q("[data-connector]").forEach((line) => {
            ScrollTrigger.create({
              trigger: line,
              start: "top 80%",
              once: true,
              onEnter: () =>
                gsap.fromTo(
                  line,
                  { scaleX: 0 },
                  {
                    scaleX: 1,
                    duration: 0.8,
                    ease: "power2.inOut",
                    transformOrigin: "left center",
                  },
                ),
            });
          });

          // ───────────── SIGNATURE — orbit chips settle onto the spinning rings ─────────────
          // (Only the center mark + chips are touched; the rings keep their CSS
          //  spin untouched, so the chips appear to arrive on a moving track.)
          q("[data-orbit-root]").forEach((orbit) => {
            const center = Array.from(orbit.querySelectorAll("[data-orbit-center]"));
            const chips = Array.from(orbit.querySelectorAll("[data-orbit-chip]"));
            gsap.set([...center, ...chips], { transformOrigin: "50% 50%" });
            gsap.set(center, { scale: 0.9 });
            gsap.set(chips, { scale: 0.85 });
            ScrollTrigger.create({
              trigger: orbit,
              start: "top 78%",
              once: true,
              onEnter: () => {
                const ot = gsap.timeline();
                ot.to(center, {
                  opacity: 1,
                  scale: 1,
                  duration: 0.5,
                  ease: EASE,
                });
                ot.to(
                  chips,
                  {
                    opacity: 1,
                    scale: 1,
                    duration: 0.45,
                    ease: EASE,
                    stagger: 0.1,
                  },
                  0.15,
                );
              },
            });
          });

          // ───────────── DESKTOP SNAP — only where sections are full-height (≥1536) ─────────────
          if (isDeck) {
            const sections = Array.from(
              root.querySelectorAll<HTMLElement>(":scope > section"),
            );
            if (sections.length >= 2) {
              ScrollTrigger.create({
                start: 0,
                end: "max",
                invalidateOnRefresh: true,
                snap: {
                  // recompute each evaluation so font/image reflow can't desync it
                  snapTo: (value) => {
                    const total = ScrollTrigger.maxScroll(window);
                    if (total <= 0) return value;
                    let best = Math.min(sections[0].offsetTop / total, 1);
                    for (const s of sections) {
                      const p = Math.min(s.offsetTop / total, 1);
                      if (Math.abs(p - value) < Math.abs(best - value)) best = p;
                    }
                    return best;
                  },
                  duration: { min: 0.3, max: 0.6 },
                  ease: "power2.inOut",
                  delay: 0.08,
                },
              });
            }
          }

          // Local Clash Display (display:swap) reflows headings after first paint;
          // recompute every trigger/snap position once the fonts settle.
          if (document.fonts?.ready) {
            document.fonts.ready.then(() => {
              if (!cancelled) ScrollTrigger.refresh();
            });
          }
        },
      );
    }

    init().catch(() => {
      // If the GSAP chunk fails to load, disarm the gate so every pre-hidden
      // target falls back to fully visible (the same path as JS-off). Without
      // this, armed content would stay hidden forever on a chunk-load failure.
      document.documentElement.classList.remove("gsap-armed");
    });

    return () => {
      cancelled = true;
      // Reverts every tween, timeline, ScrollTrigger and gsap.set created in the
      // matchMedia branches, and removes the media listeners — the only cleanup.
      mm?.revert();
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
