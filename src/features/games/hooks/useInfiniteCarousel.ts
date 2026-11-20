import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Infinite carousel hook using the "clone endpoints" technique.
 *
 * Returns:
 *  - trackRef  → attach to the sliding <div> (carousel-inner)
 *  - extended  → items array with head/tail clones already prepended/appended
 *  - activeDot → 0-based real index of the currently visible item (for dots)
 *  - next / prev / goTo → navigation
 *  - onTransitionEnd → attach to the sliding <div>'s onTransitionEnd
 */
export function useInfiniteCarousel<T>(items: T[], intervalMs: number) {
  const trackRef    = useRef<HTMLDivElement>(null);
  const indexRef    = useRef(1);          // slot in the extended array
  const lenRef      = useRef(0);          // real items.length
  const busy        = useRef(false);      // mid-transition guard
  const timerId     = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeDot, setActiveDot] = useState(0);

  // ── move carousel to a slot ──────────────────────────────────────────────
  const goToSlot = useCallback((slot: number, animated: boolean) => {
    const node = trackRef.current;
    if (!node) return;
    node.style.transition = animated ? "transform 0.5s ease" : "none";
    node.style.transform  = `translateX(-${slot * 100}%)`;
    indexRef.current = slot;
    const len = lenRef.current;
    if (len > 0) setActiveDot(((slot - 1) + len) % len);
  }, []);

  // ── start (or restart) the auto-advance interval ─────────────────────────
  const startTimer = useCallback(() => {
    if (timerId.current) clearInterval(timerId.current);
    if (lenRef.current <= 1) return;
    timerId.current = setInterval(() => {
      if (!busy.current) {
        busy.current = true;
        goToSlot(indexRef.current + 1, true);
      }
    }, intervalMs);
  }, [intervalMs, goToSlot]);

  // ── public navigation ────────────────────────────────────────────────────
  const next = useCallback(() => {
    if (lenRef.current <= 1 || busy.current) return;
    busy.current = true;
    goToSlot(indexRef.current + 1, true);
    startTimer(); // reset timer on manual nav
  }, [goToSlot, startTimer]);

  const prev = useCallback(() => {
    if (lenRef.current <= 1 || busy.current) return;
    busy.current = true;
    goToSlot(indexRef.current - 1, true);
    startTimer();
  }, [goToSlot, startTimer]);

  const goTo = useCallback((index: number) => {
    if (lenRef.current <= 1 || busy.current) return;
    busy.current = true;
    goToSlot(index + 1, true);
    startTimer();
  }, [goToSlot, startTimer]);

  // ── infinite loop: jump silently after animation ends ────────────────────
  const onTransitionEnd = useCallback(() => {
    const len  = lenRef.current;
    const slot = indexRef.current;
    if (slot === 0)       goToSlot(len, false); // was on head clone → jump to real last
    else if (slot === len + 1) goToSlot(1, false);  // was on tail clone → jump to real first
    busy.current = false;
  }, [goToSlot]);

  // ── reset when items change ───────────────────────────────────────────────
  useEffect(() => {
    lenRef.current   = items.length;
    indexRef.current = 1;
    busy.current     = false;
    setActiveDot(0);
    // Wait one frame so React has painted the new clone list
    requestAnimationFrame(() => goToSlot(1, false));
    startTimer();
    return () => { if (timerId.current) clearInterval(timerId.current); };
  // items.length is the only meaningful dep; startTimer/goToSlot are stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // ── build extended array with head/tail clones ────────────────────────────
  const extended = items.length > 0
    ? [items[items.length - 1], ...items, items[0]]
    : [] as T[];

  return { trackRef, extended, activeDot, next, prev, goTo, onTransitionEnd };
}
