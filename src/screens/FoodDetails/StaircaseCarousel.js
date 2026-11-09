import React, { useEffect, useMemo, useRef, useState } from "react";

const wrapIndex = (index, length) => (length > 0 ? ((index % length) + length) % length : 0);

const offsetOf = (index, position, length, loop) => {
  const distance = index - position;
  return loop && length > 0
    ? distance - length * Math.round(distance / length)
    : distance;
};

const scaleAt = (distance, minimum) => 1 - (1 - minimum) * Math.min(Math.abs(distance), 1);

const springOf = (bounce, duration) => {
  const clampedBounce = Math.min(Math.max(bounce, 0), 0.9);
  return {
    omega: (2 * Math.PI) / Math.max(duration, 0.1),
    damping: 1 - clampedBounce / 2,
  };
};

const springStep = (position, velocity, target, omega, damping, delta) => {
  const steps = Math.max(1, Math.ceil(delta / (1 / 240)));
  const dt = delta / steps;
  let nextPosition = position;
  let nextVelocity = velocity;

  for (let k = 0; k < steps; k += 1) {
    nextVelocity += (-omega * omega * (nextPosition - target) - 2 * damping * omega * nextVelocity) * dt;
    nextPosition += nextVelocity * dt;
  }

  return [nextPosition, nextVelocity];
};

const targetFor = (index, target, length, loop) => {
  if (!loop) return Math.min(Math.max(index, 0), length - 1);
  const current = Math.round(target);
  let distance = index - wrapIndex(current, length);
  distance -= length * Math.round(distance / length);
  return current + distance;
};

const clampIndex = (i, n) => (n <= 0 ? 0 : Math.min(Math.max(Math.round(i), 0), n - 1));
const pad = (n) => (n < 10 ? `0${n}` : String(n));

const STYLES = `
  .food-staircase{position:relative;isolation:isolate;overflow:hidden;display:grid;place-items:center;width:100%;box-sizing:border-box;padding:128px 0 12px;color:var(--FG,#0f0f0f);background:var(--BG,#fbfbf9);user-select:none;-webkit-user-select:none;touch-action:pan-y;outline:none;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}
  .food-staircase::before{content:"";position:absolute;inset:0;z-index:-2;background:radial-gradient(circle at 50% 46%,var(--AL,rgba(0,151,178,.08)),transparent 35%),linear-gradient(135deg,transparent 0 48%,color-mix(in srgb,var(--A,#0097b2) 5%,transparent) 48% 52%,transparent 52%);pointer-events:none}
  .food-staircase::after{content:"";position:absolute;inset:0;z-index:-1;opacity:.16;background-image:radial-gradient(var(--M,#7a7a77) .7px,transparent .7px);background-size:16px 16px;mask-image:linear-gradient(to bottom,transparent,black 28%,black 72%,transparent);pointer-events:none}
  .food-staircase:focus-visible{box-shadow:inset 0 0 0 2px var(--A,#0097b2)}
  .food-staircase__stage{position:relative;z-index:2;display:flex;align-items:center;justify-content:center}
  .food-staircase__slide{position:absolute;left:50%;top:50%;margin-left:calc(-0.5 * var(--food-staircase-width));margin-top:calc(-0.5 * var(--food-staircase-width) * (3/4));flex-shrink:0;display:block;padding:0;border:0;width:var(--food-staircase-width);aspect-ratio:var(--food-staircase-ratio,4/3);overflow:hidden;cursor:pointer;will-change:transform,opacity;background:transparent;box-shadow:0 20px 54px rgba(15,15,15,.14);-webkit-tap-highlight-color:transparent;transform-origin:50% 50%}
  .food-staircase__slide[aria-current="true"]{box-shadow:0 30px 90px rgba(15,15,15,.22)}
  .food-staircase__slide:focus-visible{outline:2px solid var(--A,#0097b2);outline-offset:5px}
  .food-staircase__slide>img{width:100%;height:100%;max-width:none;display:block;object-fit:cover;pointer-events:none}
  .food-staircase__backdrops{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none}
  .food-staircase__backdrop{position:absolute;inset:0;background-position:center;background-size:cover;filter:none;transform:none;opacity:0;animation:food-staircase-backdrop-in 700ms ease both}
  .food-staircase__backdrop[data-out]{animation:food-staircase-backdrop-out 700ms ease both}
  .food-staircase__backdrops::after{content:"";position:absolute;inset:0;background:linear-gradient(35deg,color-mix(in srgb,var(--BG,#fbfbf9) 96%,transparent) 0%,color-mix(in srgb,var(--BG,#fbfbf9) 76%,transparent) 24%,color-mix(in srgb,var(--BG,#fbfbf9) 36%,transparent) 58%,color-mix(in srgb,var(--BG,#fbfbf9) 14%,transparent) 100%)}
  @keyframes food-staircase-backdrop-in{from{opacity:0}to{opacity:1}}
  @keyframes food-staircase-backdrop-out{from{opacity:1}to{opacity:0}}
  .food-staircase__titles{position:absolute;left:100%;top:0;bottom:0;margin-left:24px;z-index:-1;pointer-events:none}
  .food-staircase__title{position:absolute;left:0;top:0;bottom:0;display:flex;align-items:center;white-space:nowrap;font-family:'Fraunces',Georgia,serif;font-size:clamp(24px,2.3vw,38px);font-weight:700;letter-spacing:-.035em;transform-origin:0 50%}
  .food-staircase__title span{display:block;max-width:min(28vw,380px);white-space:normal;line-height:1.06}
  .food-staircase__title small{display:block;margin-bottom:10px;color:var(--A,#0097b2);font-family:'Inter',sans-serif;font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase}
  .food-staircase__controls{position:absolute;bottom:var(--food-hero-control-bottom,28px);left:50%;transform:translateX(-50%) scale(var(--food-hero-scale,1));transform-origin:50% 100%;z-index:3;display:flex;align-items:center;gap:14px;padding:6px;border-radius:999px;color:var(--FG,#0f0f0f);background:color-mix(in srgb,var(--S,#f3f3f1) 82%,transparent);border:1px solid var(--B,#e6e6e3);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:0 8px 28px rgba(15,15,15,.1)}
  .food-staircase__button{display:grid;place-items:center;margin:0;padding:8px;border:0;border-radius:999px;background:transparent;color:inherit;cursor:pointer;transition:opacity .2s,transform .2s,background .2s}
  .food-staircase__button:not(:disabled):hover{background:var(--AL,rgba(0,151,178,.08));color:var(--A,#0097b2)}
  .food-staircase__button:disabled{opacity:.28;cursor:default}
  .food-staircase__button:not(:disabled):active{transform:scale(.88)}
  .food-staircase__button:focus-visible,.food-staircase__dot:focus-visible{outline:2px solid var(--A,#0097b2);outline-offset:2px}
  .food-staircase__dots{min-width:150px;display:flex;justify-content:center;align-items:center;gap:7px}
  .food-staircase__dot{position:relative;width:7px;height:7px;margin:0;padding:0;border:0;border-radius:999px;background:var(--FG,#0f0f0f);opacity:.25;cursor:pointer;transition:width .3s,opacity .3s,background .3s}
  .food-staircase__dot::after{content:"";position:absolute;inset:-10px -4px}
  .food-staircase__dot[aria-current]{width:26px;opacity:1;background:var(--A,#0097b2)}
  .food-staircase__count{padding:0 18px;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:.08em}
  .food-staircase__sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  @media(max-width:640px){.food-staircase{padding:82px 0 220px}.food-staircase__controls{display:none}.food-staircase__dots{min-width:112px}}
`;

function Chevron({ direction }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

export default function StaircaseCarousel({
  items = [],
  height = "100svh",
  slideWidth = "clamp(150px, 18vw, 230px)",
  slidePitch = slideWidth,
  slideAspectRatio = "4 / 3",
  inactiveScale = 0.8,
  sideOffset = 0,
  step = 0.58,
  radius = 26,
  bounce = 0.12,
  duration = 0.8,
  titles = false,
  controls = true,
  autoPlay = false,
  autoPlayInterval = 2800,
  loop = true,
  index,
  defaultIndex = 0,
  onIndexChange,
  onSelect,
  ariaLabel = "Food gallery",
  className = "",
}) {
  const length = items.length;
  const initialIndex = clampIndex(index ?? defaultIndex, length);
  const [active, setActive] = useState(initialIndex);
  const [stopped, setStopped] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(true);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const slideRefs = useRef([]);
  const callbacks = useRef({ active, onIndexChange });
  callbacks.current = { active, onIndexChange };

  const engine = useRef({
    slide: initialIndex,
    slideVelocity: 0,
    target: initialIndex,
    frame: 0,
    last: 0,
    size: 300,
    drag: null,
    blockClick: false,
  }).current;

  const config = useRef({ length, loop, step, inactiveScale, sideOffset, bounce, duration });
  config.current = { length, loop, step, inactiveScale, sideOffset, bounce, duration };

  const [shown, setShown] = useState([{ key: 0, i: active, out: false }]);
  const sequence = useRef(0);

  // Backdrop sync
  useEffect(() => {
    setShown((list) => {
      const currentTitle = list.find((t) => !t.out);
      if (currentTitle && currentTitle.i === active) return list;
      sequence.current += 1;
      return [...list.map((t) => ({ ...t, out: true })), { key: sequence.current, i: active, out: false }];
    });
    const timer = window.setTimeout(() => setShown((list) => list.filter((t) => !t.out)), 700);
    return () => window.clearTimeout(timer);
  }, [active]);

  // Transform calculation for a given slide at current slidePosition
  const transformFor = (slideIndex, slidePosition) => {
    const current = config.current;
    if (!current.length) return { transform: "", zIndex: 0, hidden: true };

    const offset = offsetOf(slideIndex, slidePosition, current.length, current.loop);
    const absOffset = Math.abs(offset);

    // Continuous forward staircase step positioning
    // Cards smoothly interpolate into top row (offset < 0) or bottom row (offset > 0)
    const stepProgress = Math.max(-1, Math.min(1, offset * 1.5));
    const translateY = stepProgress * current.step * 100;
    const translateX = offset;
    const horizontalSide = current.sideOffset ? stepProgress * current.sideOffset : 0;
    const scale = scaleAt(absOffset, current.inactiveScale);

    return {
      transform: `translate3d(calc(${translateX.toFixed(4)} * var(--food-staircase-pitch) + ${horizontalSide.toFixed(2)}px), ${translateY.toFixed(3)}%, 0) scale(${scale.toFixed(4)})`,
      zIndex: 100 - Math.round(absOffset * 10),
      hidden: absOffset > 3.2,
      isCurrent: absOffset < 0.45,
    };
  };

  const paint = () => {
    slideRefs.current.forEach((element, i) => {
      if (!element) return;
      const next = transformFor(i, engine.slide);
      element.style.transform = next.transform;
      element.style.zIndex = String(next.zIndex);
      element.style.visibility = next.hidden ? "hidden" : "";
      if (next.isCurrent) {
        element.setAttribute("aria-current", "true");
        element.tabIndex = 0;
      } else {
        element.removeAttribute("aria-current");
        element.tabIndex = -1;
      }
    });
  };

  const runFrame = (now) => {
    const delta = Math.min((now - (engine.last || now)) / 1000, 1 / 20);
    engine.last = now;
    const current = config.current;
    const spring = springOf(current.bounce, current.duration);

    if (!engine.drag) {
      [engine.slide, engine.slideVelocity] = springStep(
        engine.slide,
        engine.slideVelocity,
        engine.target,
        spring.omega,
        spring.damping,
        delta
      );
    }

    paint();

    const settled =
      !engine.drag &&
      Math.abs(engine.slide - engine.target) < 0.001 &&
      Math.abs(engine.slideVelocity) < 0.01;

    if (settled) {
      engine.slide = engine.target;
      engine.slideVelocity = 0;
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
    const nextIndex = wrapIndex(Math.round(engine.target), current.length);
    if (nextIndex !== callbacks.current.active) {
      setActive(nextIndex);
      callbacks.current.onIndexChange?.(nextIndex);
    }
    kick();
  };

  // Continuous loop movement: goTo finds the nearest forward/backward step seamlessly
  const goTo = (targetIdx) => setTarget(targetFor(targetIdx, engine.target, config.current.length, config.current.loop));
  // Continuous forward infinite progression
  const stepBy = (amount) => setTarget(Math.round(engine.target) + amount);

  // Sync when items load or change
  const itemsSignature = useMemo(
    () => `${length}:${defaultIndex}:${items.map((it) => it.src || it).join(",")}`,
    [length, defaultIndex, items]
  );
  const prevSignature = useRef(itemsSignature);

  useEffect(() => {
    if (prevSignature.current !== itemsSignature && length > 0) {
      prevSignature.current = itemsSignature;
      const targetIdx = clampIndex(index ?? defaultIndex, length);
      engine.slide = targetIdx;
      engine.target = targetIdx;
      engine.slideVelocity = 0;
      setActive(targetIdx);
      paint();
      kick();
    }
  }, [itemsSignature, length, defaultIndex, index]);

  // Controlled index support
  useEffect(() => {
    if (index != null && length > 0) {
      goTo(index);
    }
  }, [index, length]);

  useEffect(() => {
    paint();
  }, [length, loop, step, inactiveScale, sideOffset]);

  useEffect(() => () => cancelAnimationFrame(engine.frame), [engine]);

  // Intersection observer for autoPlay
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !autoPlay) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && !document.hidden));
    observer.observe(root);
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [autoPlay]);

  // Infinite Forward AutoPlay (Endless forward motion, no rewinding)
  const isPlaying = autoPlay && length > 1 && !stopped && !dragging && visible;

  useEffect(() => {
    if (!stopped || !autoPlay) return undefined;
    const timer = window.setTimeout(() => setStopped(false), Math.max(autoPlayInterval, 2500));
    return () => window.clearTimeout(timer);
  }, [stopped, autoPlay, autoPlayInterval]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setTimeout(() => {
      const current = config.current;
      if (!current.loop && Math.round(engine.target) >= current.length - 1) {
        goTo(0);
      } else {
        stepBy(1); // Endless forward step
      }
    }, autoPlayInterval);
    return () => window.clearTimeout(timer);
  }, [isPlaying, active, autoPlayInterval]);

  // Pointer & Drag handling
  const onPointerDown = (event) => {
    if (event.button !== 0 || !length || event.target.closest(".food-staircase__controls")) return;
    const stage = stageRef.current;
    const width = stage ? stage.offsetWidth || 300 : 300;
    engine.drag = {
      id: event.pointerId,
      origin: event.clientX,
      slideStart: engine.slide,
      time: performance.now(),
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
    setStopped(true);
    kick();
  };

  const onPointerMove = (event) => {
    if (!engine.drag || engine.drag.id !== event.pointerId) return;
    const delta = event.clientX - engine.drag.origin;
    if (Math.abs(delta) > 6) {
      engine.drag.moved = true;
      engine.blockClick = true;
    }
    const stageWidth = stageRef.current ? stageRef.current.offsetWidth || 300 : 300;
    const slideDelta = -delta / (stageWidth * 0.75);
    engine.slide = engine.drag.slideStart + slideDelta;
    engine.target = engine.slide;
    paint();
  };

  const onPointerUp = (event) => {
    if (!engine.drag || engine.drag.id !== event.pointerId) return;
    const moved = engine.drag.moved;
    const durationMs = performance.now() - engine.drag.time;
    const delta = event.clientX - engine.drag.origin;
    engine.drag = null;
    setDragging(false);

    if (moved) {
      const stageWidth = stageRef.current ? stageRef.current.offsetWidth || 300 : 300;
      const velocity = -delta / Math.max(durationMs, 10);
      const impulse = velocity * 4.5;
      const target = Math.round(engine.slide + impulse);
      setTarget(target);
    } else {
      setTarget(Math.round(engine.slide));
    }

    window.setTimeout(() => {
      engine.blockClick = false;
    }, 50);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setStopped(true);
      stepBy(1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setStopped(true);
      stepBy(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(length - 1);
    }
  };

  const current = items[active];

  return (
    <div
      ref={rootRef}
      className={`food-staircase ${className}`}
      style={{ height }}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <style>{STYLES}</style>

      {/* Dynamic Ambient Backdrop */}
      <div className="food-staircase__backdrops" aria-hidden="true">
        {shown.map((bg) => {
          const src = items[bg.i]?.src || items[0]?.src;
          return src ? (
            <div
              key={bg.key}
              className="food-staircase__backdrop"
              data-out={bg.out ? "" : undefined}
              style={{ backgroundImage: `url(${JSON.stringify(src)})` }}
            />
          ) : null;
        })}
      </div>

      {/* Continuous Infinite Staircase Stage */}
      <div
        ref={stageRef}
        className="food-staircase__stage"
        style={{
          width: slideWidth,
          height: "100%",
          "--food-staircase-width": slideWidth,
          "--food-staircase-pitch": slidePitch,
          "--food-staircase-ratio": slideAspectRatio,
        }}
      >
        {items.map((item, i) => {
          const isActive = i === active;
          return (
            <button
              key={`${item.src}-${i}`}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              type="button"
              className="food-staircase__slide"
              aria-label={`${i + 1} of ${length}: ${item.title}`}
              aria-current={isActive ? "true" : undefined}
              tabIndex={isActive ? 0 : -1}
              style={{ borderRadius: radius }}
              onClick={() => {
                if (engine.blockClick) return;
                if (isActive) {
                  onSelect?.(item, i);
                } else {
                  setStopped(true);
                  goTo(i);
                }
              }}
            >
              <img
                src={item.src}
                alt={item.alt || item.title}
                draggable={false}
                decoding="async"
                onError={(event) => {
                  const fallback = items.find((candidate) => candidate.src && candidate.src !== item.src)?.src;
                  if (fallback && event.currentTarget.dataset.fallback !== "true") {
                    event.currentTarget.dataset.fallback = "true";
                    event.currentTarget.src = fallback;
                  }
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Controls */}
      {controls && length > 1 ? (
        <div className="food-staircase__controls" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="food-staircase__button"
            aria-label="Previous photo"
            disabled={!loop && active <= 0}
            onClick={() => {
              setStopped(true);
              stepBy(-1);
            }}
          >
            <Chevron direction={-1} />
          </button>
          <div className="food-staircase__dots">
            {length > 10 ? (
              <span className="food-staircase__count">
                {pad(active + 1)} / {pad(length)}
              </span>
            ) : (
              items.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  className="food-staircase__dot"
                  aria-label={`Go to photo ${i + 1}: ${item.title}`}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => {
                    setStopped(true);
                    goTo(i);
                  }}
                />
              ))
            )}
          </div>
          <button
            type="button"
            className="food-staircase__button"
            aria-label="Next photo"
            disabled={!loop && active >= length - 1}
            onClick={() => {
              setStopped(true);
              stepBy(1);
            }}
          >
            <Chevron direction={1} />
          </button>
        </div>
      ) : null}

      <div className="food-staircase__sr" aria-live="polite" aria-atomic="true">
        {current ? `Photo ${active + 1} of ${length}: ${current.title}` : ""}
      </div>
    </div>
  );
}
