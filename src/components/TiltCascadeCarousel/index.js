import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const wrapIndex = (index, length) => length > 0 ? ((index % length) + length) % length : 0;

const indexAt = (position, length, loop) => {
  if (!length) return 0;
  const index = Math.round(position);
  return loop ? wrapIndex(index, length) : Math.min(Math.max(index, 0), length - 1);
};

const offsetOf = (index, position, length, loop) => {
  const distance = index - position;
  return loop && length > 0
    ? distance - length * Math.round(distance / length)
    : distance;
};

const scaleAt = (distance, minimum) => 1 - (1 - minimum) * Math.min(Math.abs(distance), 1);

const rubber = (position, length) => {
  if (position < 0) return position / 3;
  if (position > length - 1) return length - 1 + (position - (length - 1)) / 3;
  return position;
};

const springOf = (bounce, duration) => {
  const clampedBounce = Math.min(Math.max(bounce, 0), 0.9);
  return {
    omega: (2 * Math.PI) / Math.max(duration, 0.1),
    slide: 1 - clampedBounce / 2,
    tilt: 1 - clampedBounce,
  };
};

const springStep = (position, velocity, target, omega, damping, delta) => {
  const steps = Math.max(1, Math.ceil(delta / (1 / 240)));
  const step = delta / steps;
  let nextPosition = position;
  let nextVelocity = velocity;

  for (let index = 0; index < steps; index += 1) {
    nextVelocity += (-omega * omega * (nextPosition - target) - 2 * damping * omega * nextVelocity) * step;
    nextPosition += nextVelocity * step;
  }

  return [nextPosition, nextVelocity];
};

const releaseTarget = (position, velocity, length, loop) => {
  const current = Math.round(position);
  let target = Math.round(position + velocity * 0.2);
  target = Math.min(Math.max(target, current - 3), current + 3);
  return loop ? target : Math.min(Math.max(target, 0), length - 1);
};

const targetFor = (index, target, length, loop) => {
  if (!loop) return Math.min(Math.max(index, 0), length - 1);
  const current = Math.round(target);
  let distance = index - wrapIndex(current, length);
  distance -= length * Math.round(distance / length);
  return current + distance;
};

/**
 * A theme-neutral, spring-driven image cascade. Its container owns the size;
 * the component only animates the cards inside that existing footprint.
 */
export default function TiltCascadeCarousel({
  items = [],
  height = "100%",
  slideSize = "clamp(210px, 26vw, 360px)",
  slidePitch = slideSize,
  angle = 24,
  drop = 0.28,
  inactiveScale = 0.72,
  visibleRange = 1.6,
  radius = 24,
  bounce = 0.22,
  duration = 0.8,
  loop = false,
  autoplay = 0,
  controls = true,
  controlsBottom = "18px",
  color = "var(--FG, #0f0f0f)",
  background = "transparent",
  accent = "var(--A, #0097b2)",
  border = "var(--B, rgba(0,0,0,.1))",
  defaultIndex,
  onIndexChange,
  onSelect,
  ariaLabel = "Place photo gallery",
  className = "",
}) {
  const length = items.length;
  const initialIndex = Math.min(
    Math.max(Math.round(defaultIndex == null ? Math.floor((length - 1) / 2) : defaultIndex), 0),
    Math.max(length - 1, 0),
  );
  const [active, setActive] = useState(initialIndex);
  const [dragging, setDragging] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const slideRefs = useRef([]);
  const callbacks = useRef({ active, onIndexChange });
  callbacks.current = { active, onIndexChange };

  const engine = useRef({
    slide: initialIndex,
    slideVelocity: 0,
    tilt: initialIndex,
    tiltVelocity: 0,
    target: initialIndex,
    frame: 0,
    last: 0,
    size: 300,
    reduced: false,
    drag: null,
    blockClick: false,
    wheel: 0,
    wheelAt: 0,
    stepAt: 0,
  }).current;

  const config = useRef({ length, loop, angle, drop, inactiveScale, bounce, duration });
  config.current = { length, loop, angle, drop, inactiveScale, bounce, duration };

  const transformFor = (index, slidePosition, tiltPosition) => {
    const current = config.current;
    const horizontalDistance = offsetOf(index, slidePosition, current.length, current.loop);
    const styledDistance = offsetOf(index, tiltPosition, current.length, current.loop);

    return {
      transform: `translate3d(calc(${horizontalDistance.toFixed(4)} * var(--tcc-pitch)), ${(styledDistance * current.drop * 100).toFixed(3)}%, 0) scale(${scaleAt(styledDistance, current.inactiveScale).toFixed(4)}) rotate(${(styledDistance * current.angle).toFixed(3)}deg)`,
      zIndex: 100 - Math.round(Math.abs(styledDistance) * 10),
      hidden: Math.abs(horizontalDistance) > visibleRange,
    };
  };

  const paint = () => {
    slideRefs.current.forEach((element, index) => {
      if (!element) return;
      const next = transformFor(index, engine.slide, engine.tilt);
      element.style.transform = next.transform;
      element.style.zIndex = String(next.zIndex);
      element.style.visibility = next.hidden ? "hidden" : "";
    });
  };

  const runFrame = (now) => {
    const delta = Math.min((now - (engine.last || now)) / 1000, 1 / 20);
    engine.last = now;
    const current = config.current;
    const spring = springOf(current.bounce, current.duration);

    if (engine.reduced && !engine.drag) {
      engine.slide = engine.tilt = engine.target;
      engine.slideVelocity = engine.tiltVelocity = 0;
    } else {
      if (!engine.drag) {
        [engine.slide, engine.slideVelocity] = springStep(
          engine.slide,
          engine.slideVelocity,
          engine.target,
          spring.omega,
          spring.slide,
          delta,
        );
      }
      [engine.tilt, engine.tiltVelocity] = springStep(
        engine.tilt,
        engine.tiltVelocity,
        engine.slide,
        spring.omega * 1.05,
        spring.tilt,
        delta,
      );
    }

    paint();
    const settled = !engine.drag
      && Math.abs(engine.slide - engine.target) < 0.001
      && Math.abs(engine.slideVelocity) < 0.01
      && Math.abs(engine.tilt - engine.slide) < 0.001
      && Math.abs(engine.tiltVelocity) < 0.01;

    if (settled) {
      engine.slide = engine.tilt = engine.target;
      engine.slideVelocity = engine.tiltVelocity = 0;
      paint();
      engine.frame = 0;
      engine.last = 0;
      return;
    }
    engine.frame = requestAnimationFrame(runFrame);
  };

  const kick = () => {
    if (!engine.frame) engine.frame = requestAnimationFrame(runFrame);
  };

  const setTarget = (target) => {
    const current = config.current;
    if (!current.length) return;
    engine.target = current.loop ? target : Math.min(Math.max(target, 0), current.length - 1);
    const nextIndex = indexAt(engine.target, current.length, current.loop);
    if (nextIndex !== callbacks.current.active) {
      setActive(nextIndex);
      callbacks.current.onIndexChange?.(nextIndex);
    }
    kick();
  };

  const goTo = (index) => setTarget(targetFor(index, engine.target, config.current.length, config.current.loop));
  const step = (amount) => setTarget(Math.round(engine.target) + amount);

  useEffect(() => {
    if (length && !loop && engine.target > length - 1) setTarget(length - 1);
    paint();
    // The animation engine intentionally owns these mutable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, loop, angle, drop, inactiveScale]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { engine.reduced = media.matches; };
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, [engine]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const measure = () => { engine.size = stage.offsetWidth || 300; };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [engine]);

  useEffect(() => () => cancelAnimationFrame(engine.frame), [engine]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const onWheel = (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const now = performance.now();
      if (now - engine.wheelAt > 160) engine.wheel = 0;
      engine.wheelAt = now;
      engine.wheel += event.deltaX;
      if (Math.abs(engine.wheel) > 50 && now - engine.stepAt > 320) {
        setStopped(true);
        step(Math.sign(engine.wheel));
        engine.wheel = 0;
        engine.stepAt = now;
      }
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !autoplay) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && !document.hidden));
    observer.observe(root);
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [autoplay]);

  const playing = autoplay > 0 && length > 1 && !stopped && !dragging && visible;
  useEffect(() => {
    if (!stopped || !autoplay) return undefined;
    const timer = window.setTimeout(() => setStopped(false), Math.max(autoplay, 2500));
    return () => window.clearTimeout(timer);
  }, [stopped, autoplay]);

  useEffect(() => {
    if (!playing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setTimeout(() => {
      const current = config.current;
      if (!current.loop && Math.round(engine.target) >= current.length - 1) goTo(0);
      else step(1);
    }, autoplay);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, active, autoplay]);

  const onPointerDown = (event) => {
    if (event.button !== 0 || !length || event.target.closest("[data-tcc-controls]")) return;
    engine.drag = {
      id: event.pointerId,
      x0: event.clientX,
      position0: engine.slide,
      moved: false,
      samples: [{ time: event.timeStamp, x: event.clientX }],
    };
  };

  const onPointerMove = (event) => {
    const drag = engine.drag;
    if (!drag || drag.id !== event.pointerId) return;
    const distance = event.clientX - drag.x0;
    if (!drag.moved) {
      if (Math.abs(distance) < 6) return;
      drag.moved = true;
      drag.x0 = event.clientX;
      drag.position0 = engine.slide;
      engine.slideVelocity = 0;
      rootRef.current?.setPointerCapture(event.pointerId);
      setDragging(true);
      setStopped(true);
    }
    const current = config.current;
    const raw = drag.position0 - (event.clientX - drag.x0) / engine.size;
    engine.slide = current.loop ? raw : rubber(raw, current.length);
    drag.samples.push({ time: event.timeStamp, x: event.clientX });
    if (drag.samples.length > 6) drag.samples.shift();
    const nextIndex = indexAt(engine.slide, current.length, current.loop);
    if (nextIndex !== callbacks.current.active) {
      setActive(nextIndex);
      callbacks.current.onIndexChange?.(nextIndex);
    }
    kick();
  };

  const onPointerUp = (event) => {
    const drag = engine.drag;
    if (!drag || drag.id !== event.pointerId) return;
    engine.drag = null;
    if (!drag.moved) return;
    setDragging(false);
    engine.blockClick = true;
    window.setTimeout(() => { engine.blockClick = false; }, 0);
    const first = drag.samples[0];
    const last = drag.samples[drag.samples.length - 1];
    const milliseconds = Math.max(last.time - first.time, 1);
    const velocity = event.type === "pointercancel"
      ? 0
      : (-(last.x - first.x) / milliseconds / engine.size) * 1000;
    engine.slideVelocity = velocity;
    setTarget(releaseTarget(engine.slide, velocity, config.current.length, config.current.loop));
  };

  const onKeyDown = (event) => {
    let handled = true;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") step(1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") step(-1);
    else if (event.key === "Home") goTo(0);
    else if (event.key === "End") goTo(length - 1);
    else handled = false;
    if (handled) {
      event.preventDefault();
      setStopped(true);
    }
  };

  const onSlideClick = (index) => {
    if (engine.blockClick) return;
    setStopped(true);
    if (index === active) onSelect?.(items[index], index);
    else goTo(index);
  };

  const dotItems = useMemo(() => items.slice(0, 14), [items]);
  const atStart = !loop && active <= 0;
  const atEnd = !loop && active >= length - 1;

  return (
    <div
      ref={rootRef}
      className={`tilt-cascade ${className}`}
      style={{
        height,
        background,
        color,
        "--tcc-accent": accent,
        "--tcc-border": border,
        "--tcc-radius": `${radius}px`,
        "--tcc-controls-bottom": controlsBottom,
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      data-dragging={dragging ? "" : undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <style>{`
        .tilt-cascade{position:relative;overflow:visible;display:grid;place-items:center;width:100%;box-sizing:border-box;user-select:none;-webkit-user-select:none;touch-action:pan-y;outline:none;-webkit-tap-highlight-color:transparent}
        .tilt-cascade:focus-visible{box-shadow:none}
        .tilt-cascade[data-dragging]{cursor:grabbing}
        .tilt-cascade-stage{position:relative;aspect-ratio:1/1}
        .tilt-cascade-slide{position:absolute;inset:0;margin:0;padding:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer;will-change:transform;transform-origin:50% 50%;-webkit-tap-highlight-color:transparent}
        .tilt-cascade-slide:focus-visible{outline:none}
        .tilt-cascade-slide:focus-visible .tilt-cascade-frame{box-shadow:0 0 0 3px var(--W,#fff),0 0 0 5px var(--tcc-accent)}
        .tilt-cascade-frame{position:absolute;inset:0;overflow:hidden;border-radius:var(--tcc-radius);background:var(--S,#f3f3f1);border:0;box-shadow:0 22px 52px rgba(0,0,0,.14)}
        .tilt-cascade-frame img{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block;object-fit:cover;pointer-events:none}
        .tilt-cascade-shade{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 64%,rgba(0,0,0,.28));pointer-events:none}
        .tilt-cascade-controls{position:absolute;bottom:var(--tcc-controls-bottom,18px);left:50%;transform:translateX(-50%);z-index:180;display:flex;align-items:center;gap:10px;padding:5px 7px;border-radius:999px;background:color-mix(in srgb,var(--W,#fff) 88%,transparent);border:0;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 10px 30px rgba(0,0,0,.14)}
        .tilt-cascade-button{display:grid;place-items:center;width:34px;height:34px;margin:0;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer;transition:background .2s,color .2s,transform .2s}
        .tilt-cascade-button:not(:disabled):hover{background:var(--tcc-accent);color:#fff}
        .tilt-cascade-button:not(:disabled):active{transform:scale(.88)}
        .tilt-cascade-button:disabled{opacity:.28;cursor:default}
        .tilt-cascade-dots{display:flex;justify-content:center;align-items:center;gap:6px;min-width:84px}
        .tilt-cascade-dot{position:relative;width:6px;height:6px;margin:0;padding:0;border:0;border-radius:999px;background:currentColor;opacity:.28;cursor:pointer;transition:width .3s,opacity .3s,background .3s}
        .tilt-cascade-dot:after{content:"";position:absolute;inset:-10px -4px}
        .tilt-cascade-dot[aria-current]{width:22px;opacity:1;background:var(--tcc-accent)}
        .tilt-cascade-count{min-width:76px;text-align:center;font-size:11px;font-weight:700;letter-spacing:.16em;font-variant-numeric:tabular-nums}
        .tilt-cascade-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
        @media(max-width:768px){.tilt-cascade-button{width:32px;height:32px}.tilt-cascade-frame{box-shadow:0 18px 42px rgba(0,0,0,.18)}}
        @media(prefers-reduced-motion:reduce){.tilt-cascade-button,.tilt-cascade-dot{transition:none}}
      `}</style>

      <div
        ref={stageRef}
        className="tilt-cascade-stage"
        style={{ width: slideSize, "--tcc-size": slideSize, "--tcc-pitch": slidePitch }}
      >
        {items.map((item, index) => {
          const next = transformFor(index, engine.slide, engine.tilt);
          const isActive = index === active;
          return (
            <button
              key={`${item.src || "image"}-${index}`}
              ref={(element) => { slideRefs.current[index] = element; }}
              type="button"
              className="tilt-cascade-slide"
              data-active={isActive ? "" : undefined}
              tabIndex={isActive ? 0 : -1}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${length}: ${item.alt || item.title || "Place photo"}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onSlideClick(index)}
              style={{ transform: next.transform, zIndex: next.zIndex, visibility: next.hidden ? "hidden" : undefined }}
            >
              <span className="tilt-cascade-frame">
                <img
                  src={item.src}
                  alt={item.alt || item.title || "Place"}
                  draggable={false}
                  loading={Math.abs(index - initialIndex) > 3 ? "lazy" : "eager"}
                  decoding="async"
                />
                <span className="tilt-cascade-shade" />
              </span>
            </button>
          );
        })}
      </div>

      {controls && length > 1 && (
        <div className="tilt-cascade-controls" data-tcc-controls="">
          <button type="button" className="tilt-cascade-button" aria-label="Previous photo" disabled={atStart} onClick={() => { setStopped(true); step(-1); }}>
            <ChevronLeft size={18} />
          </button>
          <div className="tilt-cascade-dots">
            {length > 14 ? (
              <span className="tilt-cascade-count">{String(active + 1).padStart(2, "0")} / {String(length).padStart(2, "0")}</span>
            ) : dotItems.map((item, index) => (
              <button
                key={`${item.src || "dot"}-${index}`}
                type="button"
                className="tilt-cascade-dot"
                aria-label={`Go to photo ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => { setStopped(true); goTo(index); }}
              />
            ))}
          </div>
          <button type="button" className="tilt-cascade-button" aria-label="Next photo" disabled={atEnd} onClick={() => { setStopped(true); step(1); }}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <div className="tilt-cascade-sr" aria-live="polite" aria-atomic="true">
        {length ? `Photo ${active + 1} of ${length}` : ""}
      </div>
    </div>
  );
}
