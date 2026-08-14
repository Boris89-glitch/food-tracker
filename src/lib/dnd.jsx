import { createContext, useContext, useEffect, useReducer, useRef } from "react";

// Lightweight drag-and-drop that runs two engines side by side:
//   • Mouse / trackpad → native HTML5 drag (the elements keep `draggable` +
//     onDragStart/onDrop). Untouched by this module.
//   • Touch → a custom pointer engine below. Native touch DnD needs a long
//     press (~500ms) to arm; this arms after a short ~120ms settle so a drag
//     feels near-instant, while a quick flick still scrolls the page.
//
// Drop zones register their live bounding box; on touch we hit-test those
// boxes ourselves and drive a floating ghost + edge auto-scroll.

const DndContext = createContext(null);

const ACTIVATE_MS = 120; // settle time before a touch becomes a drag
const MOVE_CANCEL = 12; // px of pre-activation movement that means "scrolling"
const EDGE = 0.5; // fraction of viewport at top/bottom that auto-scrolls (whole screen)
const MAX_SCROLL = 110; // px/frame at the very edge
const DRAG_PAN = 3.6; // finger-move → page-scroll multiplier (grab & fling)

export function DndProvider({ children }) {
  const zonesRef = useRef([]);
  const dragRef = useRef(null);

  const registerZone = (zone) => {
    zonesRef.current.push(zone);
    return () => {
      zonesRef.current = zonesRef.current.filter((z) => z !== zone);
    };
  };

  const zoneAt = (x, y) => {
    const zones = zonesRef.current;
    // Last-registered wins when boxes overlap (later = visually on top).
    for (let i = zones.length - 1; i >= 0; i--) {
      const r = zones[i].el?.getBoundingClientRect();
      if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return zones[i];
    }
    return null;
  };

  const positionGhost = (d) => {
    d.ghost.style.transform =
      `translate3d(${d.x - d.offX}px, ${d.y - d.offY}px, 0) scale(1.03) rotate(1.5deg)`;
  };

  const frame = () => {
    const d = dragRef.current;
    if (!d) return;

    // Edge auto-scroll — steeper the closer to the edge, so you can whip the
    // page up to reach the meal buckets while dragging from the library.
    let dy = 0;
    const band = innerHeight * EDGE;
    if (d.y < band) {
      const k = 1 - d.y / band; // 0 at band edge → 1 at the very top
      dy = -MAX_SCROLL * k * k; // quadratic ramp: gentle far, fast near the edge
    } else if (d.y > innerHeight - band) {
      const k = 1 - (innerHeight - d.y) / band;
      dy = MAX_SCROLL * k * k;
    }
    if (dy) scrollBy(0, dy);

    // Re-evaluate the hovered zone every frame: the finger may be still while
    // the page scrolls under it.
    const z = zoneAt(d.x, d.y);
    if (z !== d.over) {
      d.over?.setOver(false);
      z?.setOver(true);
      d.over = z;
    }
    positionGhost(d);
    d.raf = requestAnimationFrame(frame);
  };

  const onMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    e.preventDefault(); // suppress native scroll; we drive it ourselves
    const t = e.touches[0];
    // Grab-and-pan: the page tracks the finger and then some, so a short flick
    // up whisks the meal buckets into view — no need to reach the screen edge.
    const dy = t.clientY - d.y;
    if (dy) scrollBy(0, dy * DRAG_PAN);
    d.x = t.clientX;
    d.y = t.clientY;
  };

  const cleanup = () => {
    const d = dragRef.current;
    if (!d) return;
    cancelAnimationFrame(d.raf);
    removeEventListener("touchmove", onMove);
    removeEventListener("touchend", onEnd);
    removeEventListener("touchcancel", onEnd);
    d.over?.setOver(false);
    d.ghost.remove();
    document.body.style.userSelect = "";
    d.opts.onEnd?.();
    dragRef.current = null;
  };

  const onEnd = () => {
    const d = dragRef.current;
    if (!d) return;
    if (d.over) d.over.onDrop(d.payload);
    else d.opts.onDragAway?.();
    cleanup();
  };

  const beginDrag = (payload, startX, startY, sourceEl, opts) => {
    const rect = sourceEl.getBoundingClientRect();
    const ghost = sourceEl.cloneNode(true);
    Object.assign(ghost.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: rect.width + "px",
      margin: "0",
      pointerEvents: "none",
      zIndex: "9999",
      opacity: "0.92",
      boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
      transition: "none",
    });
    document.body.appendChild(ghost);
    document.body.style.userSelect = "none";

    const d = {
      payload,
      ghost,
      opts,
      x: startX,
      y: startY,
      offX: startX - rect.left,
      offY: startY - rect.top,
      over: null,
      raf: 0,
    };
    dragRef.current = d;
    positionGhost(d);
    opts.onStart?.();
    addEventListener("touchmove", onMove, { passive: false });
    addEventListener("touchend", onEnd);
    addEventListener("touchcancel", onEnd);
    d.raf = requestAnimationFrame(frame);
  };

  return (
    <DndContext.Provider value={{ registerZone, beginDrag }}>{children}</DndContext.Provider>
  );
}

// Attach to a draggable element for touch. Returns `onTouchStart`; keep the
// element's native `draggable`/onDragStart for mouse.
export function useDrag(payload, opts = {}) {
  const ctx = useContext(DndContext);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const onTouchStart = (e) => {
    if (!ctx || e.touches.length !== 1) return;
    const el = e.currentTarget;
    const t0 = e.touches[0];
    const start = { x: t0.clientX, y: t0.clientY };
    let armed = false;

    const guardMove = (ev) => {
      const t = ev.touches[0];
      // Moved before arming → treat as a scroll; abandon this drag.
      if (Math.hypot(t.clientX - start.x, t.clientY - start.y) > MOVE_CANCEL) done();
    };
    const done = () => {
      clearTimeout(timer);
      removeEventListener("touchmove", guardMove);
      removeEventListener("touchend", done);
      removeEventListener("touchcancel", done);
    };
    const timer = setTimeout(() => {
      armed = true;
      done();
      ctx.beginDrag(payload, start.x, start.y, el, optsRef.current);
    }, ACTIVATE_MS);

    addEventListener("touchmove", guardMove, { passive: true });
    addEventListener("touchend", done);
    addEventListener("touchcancel", done);
    void armed;
  };

  return { onTouchStart };
}

// Register an element as a drop target. `onDrop(payload)` fires for both touch
// and (when wired to native onDrop) mouse. Returns { ref, over, setOver }.
export function useDrop(onDrop) {
  const ctx = useContext(DndContext);
  const ref = useRef(null);
  const overRef = useRef(false);
  const [, force] = useReducer((x) => x + 1, 0);
  const cbRef = useRef(onDrop);
  cbRef.current = onDrop;

  const setOver = (v) => {
    if (overRef.current === v) return;
    overRef.current = v;
    force();
  };

  useEffect(() => {
    if (!ctx || !ref.current) return;
    return ctx.registerZone({ el: ref.current, onDrop: (p) => cbRef.current(p), setOver });
  }, [ctx]);

  return { ref, over: overRef.current, setOver };
}
