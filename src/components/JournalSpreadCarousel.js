"use client"

import * as React from "react"

// #region pose
const OPEN = 5 // the centre spread's slight V at the spine, degrees
const SIDE = 80 // how far a stacked page turns towards the middle
const FOLD = 174 // a page folding shut over its partner

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v
}

/** Spread shape for a stage: 5:4 on wide stages, taller pages on a portrait phone. */
export function spreadAspect(stageW, stageH) {
  return stageW < 640 && stageH > stageW ? 0.92 : 1.35
}

/** Spread width for a stage, keeping room for the side stacks. */
export function spreadWidth(stageW, stageH) {
  if (stageW <= 0 || stageH <= 0) return 0
  const narrow = stageW < 640
  return Math.round(Math.min(stageW * (narrow ? 0.90 : 0.74), stageH * 0.88 * spreadAspect(stageW, stageH), 820))
}

/**
 * Where spread `p` steps from the centre sits. 0 is open in the middle; ±1 is the first
 * page of each stack, and further ones step outwards and back.
 */
export function poseFor(p, w) {
  const d = Math.abs(p)
  const a = d < 1 ? d : 1
  const s = p < 0 ? -1 : 1
  const out = d > 1 ? d - 1 : 0
  const x = s * (a * (w * 0.5 + w * 0.03) + out * w * 0.055)
  const z = -(a * w * 0.42 + out * w * 0.06)
  // Pages on the side they stack to turn edge-on; the other page folds shut over them.
  // The fold eases in (a * a) so the leaving and arriving spreads overlap mid-turn.
  const fold = a * a
  const left = p > 0 ? OPEN + (FOLD - OPEN) * fold : OPEN + (SIDE - OPEN) * a
  const right = p < 0 ? -(OPEN + (FOLD - OPEN) * fold) : -(OPEN + (SIDE - OPEN) * a)
  const shade = (deg) => clamp((Math.abs(deg) - OPEN) / 95, 0, 0.62)
  return {
    x,
    z,
    left,
    right,
    shadeLeft: shade(left),
    shadeRight: shade(right),
    opacity: clamp(7.2 - d, 0, 1),
    hidden: d > 7.2,
  }
}

/** Where a drag lets go: the nearest spread, nudged by the flick. */
export function settle(pos, velocity, n) {
  return clamp(Math.round(pos + clamp(velocity * 0.18, -1.5, 1.5)), 0, Math.max(0, n - 1))
}

/** Tween length for a jump of `steps` spreads; longer jumps riffle faster per page. */
export function durationFor(steps) {
  return steps <= 0 ? 0 : Math.round(560 * Math.sqrt(Math.min(steps, 12)))
}

export function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function easeOut(t) {
  return 1 - Math.pow(1 - t, 3)
}
// #endregion

const FONT =
  "@font-face{font-family:JSC Hand;font-style:normal;font-weight:600;font-display:swap;" +
  "src:url(data:font/woff2;base64,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) format(\"woff2\")}"

const CSS =
  FONT +
  ".jsc-root{position:relative;width:100%;height:100%;min-height:420px;display:flex;flex-direction:column;overflow:hidden;" +
  "background:transparent;color:inherit;" +
  "font-family:inherit;outline:none;user-select:none;-webkit-user-select:none;container-type:inline-size}" +
  ".jsc-root:focus-visible{box-shadow:inset 0 0 0 2px rgba(0,151,178,.45)}" +
  ".jsc-top{position:relative;padding:max(14px,1.6cqi) max(14px,1.8cqi) 0;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0}" +
  ".jsc-group{display:flex;gap:max(8px,.8cqi)}" +
  ".jsc-chip{display:grid;place-items:center;width:clamp(34px,3.4cqi,46px);height:clamp(34px,3.4cqi,46px);border-radius:50%;border:0;padding:0;cursor:pointer;" +
  "color:inherit;background:rgba(0,0,0,.06);box-shadow:inset 0 0 0 1px rgba(0,0,0,.08);transition:background .2s}" +
  ".jsc-chip:hover{background:rgba(0,0,0,.12)}" +
  ".jsc-chip[aria-pressed=true]{box-shadow:inset 0 0 0 1.5px #0097B2}" +
  ".jsc-chip svg{width:46%;height:46%}" +
  ".jsc-head{position:absolute;left:50%;top:max(20px,2.5cqi);transform:translateX(-50%);text-align:center;white-space:nowrap;pointer-events:none;z-index:15}" +
  ".jsc-title{margin:0;font-weight:700;font-size:clamp(20px,2.6cqi,36px);letter-spacing:-.01em;line-height:1.1}" +
  ".jsc-meta{display:inline-flex;align-items:center;gap:.45em;margin-top:.35em;font-size:clamp(11px,1cqi,14px);font-weight:600;opacity:.85}" +
  ".jsc-meta svg{width:1.15em;height:1.15em}" +
  ".jsc-stage{position:relative;flex:1;width:100%;height:100%;min-height:360px;touch-action:pan-y;cursor:grab}" +
  ".jsc-stage[data-drag]{cursor:grabbing}" +
  ".jsc-floor{display:none}" +
  ".jsc-view{position:absolute;inset:0;perspective:calc(var(--jsc-w) * 2.3);perspective-origin:50% 46%}" +
  ".jsc-scene{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d}" +
  ".jsc-item{position:absolute;left:0;top:0;transform-style:preserve-3d;visibility:hidden}" +
  ".jsc-page{position:absolute;top:calc(var(--jsc-h) * -.5);width:calc(var(--jsc-w) * .5);height:var(--jsc-h);overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;" +
  "background:#efebe3;box-shadow:0 1px 0 rgba(255,255,255,.35) inset}" +
  ".jsc-page[data-side=l]{left:calc(var(--jsc-w) * -.5);transform-origin:100% 50%;border-radius:calc(var(--jsc-w) * .034) 0 0 calc(var(--jsc-w) * .034)}" +
  ".jsc-page[data-side=r]{left:0;transform-origin:0 50%;border-radius:0 calc(var(--jsc-w) * .034) calc(var(--jsc-w) * .034) 0}" +
  ".jsc-sheet{position:absolute;top:0;width:var(--jsc-w);height:var(--jsc-h);pointer-events:none}" +
  ".jsc-page[data-side=l]>.jsc-sheet{left:0}" +
  ".jsc-page[data-side=r]>.jsc-sheet{left:calc(var(--jsc-w) * -.5)}" +
  ".jsc-bg{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block}" +
  ".jsc-gutter{position:absolute;inset:0}" +
  ".jsc-page[data-side=l] .jsc-gutter{background:linear-gradient(90deg,rgba(255,255,255,0) 82%,rgba(20,18,30,.08) 93%,rgba(20,18,30,.26))}" +
  ".jsc-page[data-side=r] .jsc-gutter{background:linear-gradient(270deg,rgba(255,255,255,0) 82%,rgba(20,18,30,.08) 93%,rgba(20,18,30,.26))}" +
  ".jsc-shade{position:absolute;inset:0;background:#141729;opacity:var(--jsc-s,0)}" +
  ".jsc-print{position:absolute;margin:0;background:#fbfaf6;padding:3.5% 3.5% 0;box-shadow:0 .4em 1em rgba(18,16,30,.28),0 .1em .2em rgba(18,16,30,.2);font-size:calc(var(--jsc-w) * .01)}" +
  ".jsc-print img{display:block;width:100%;height:auto;max-width:none;aspect-ratio:4/5;object-fit:cover}" +
  ".jsc-print figcaption{font-family:'JSC Hand',cursive;font-weight:600;color:#2a2c3e;text-align:center;font-size:calc(var(--jsc-w) * .024);line-height:1;padding:.32em 0 .4em}" +
  ".jsc-print[data-tape]{padding:0;background:none}" +
  ".jsc-print[data-tape]::before{content:'';position:absolute;left:50%;top:-6%;width:46%;height:11%;transform:translateX(-50%) rotate(-3deg);background:rgba(236,226,196,.78);box-shadow:0 1px 2px rgba(0,0,0,.12)}" +
  ".jsc-print[data-tape] figcaption{position:absolute;left:0;right:0;bottom:-1.1em;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.55)}" +
  ".jsc-note{position:absolute;font-family:'JSC Hand',cursive;font-weight:600;line-height:1.02;color:#272a3f}" +
  ".jsc-note[data-style=card]{background:#f6f1e6;padding:.7em .85em .8em;box-shadow:0 .3em .9em rgba(18,16,30,.25);clip-path:polygon(0 3%,7% 0,18% 2%,31% 0,46% 2%,60% 0,74% 2%,88% 0,100% 2%,99% 100%,84% 98%,69% 100%,52% 98%,37% 100%,21% 98%,6% 100%,1% 97%)}" +
  ".jsc-note[data-style=ink]{color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.45),0 0 12px rgba(0,0,0,.25)}" +
  ".jsc-note b{display:block;font-weight:600;font-size:calc(var(--jsc-w) * .048);margin-bottom:.12em}" +
  ".jsc-note span{display:block;font-size:calc(var(--jsc-w) * .028)}" +
  ".jsc-bar{display:flex;justify-content:center;gap:clamp(12px,1.4cqi,20px);padding:clamp(14px,1.8cqi,28px) 0 clamp(22px,3cqi,44px);position:relative;z-index:2}" +
  ".jsc-btn{display:grid;place-items:center;width:clamp(40px,3.6cqi,52px);height:clamp(40px,3.6cqi,52px);border-radius:50%;border:0;padding:0;cursor:pointer;color:#262a40;background:#fff;" +
  "box-shadow:0 4px 14px rgba(10,12,28,.28);transition:transform .2s cubic-bezier(.2,.7,.2,1)}" +
  ".jsc-btn:hover{transform:translateY(-2px)}" +
  ".jsc-btn:active{transform:scale(.94)}" +
  ".jsc-btn svg{width:44%;height:44%}" +
  ".jsc-chip:focus-visible,.jsc-btn:focus-visible{outline:2px solid #fff;outline-offset:3px}" +
  ".jsc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}" +
  "@media (prefers-reduced-motion:reduce){.jsc-btn,.jsc-chip{transition:none}}"

const ICON = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", "aria-hidden": true }

function Icon({ name }) {
  switch (name) {
    case "book":
      return (
        <svg {...ICON}>
          <path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
        </svg>
      )
    case "grid":
      return (
        <svg {...ICON}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case "search":
      return (
        <svg {...ICON}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.6-3.6" />
        </svg>
      )
    case "menu":
      return (
        <svg {...ICON}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      )
    case "lock":
      return (
        <svg {...ICON}>
          <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        </svg>
      )
    case "more":
      return (
        <svg {...ICON} strokeWidth={3}>
          <path d="M5 12h.01M12 12h.01M19 12h.01" />
        </svg>
      )
    case "share":
      return (
        <svg {...ICON}>
          <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
        </svg>
      )
    case "delete":
      return (
        <svg {...ICON}>
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
        </svg>
      )
    default:
      return (
        <svg {...ICON}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
  }
}

function Sheet({ spread }) {
  return (
    <div className="jsc-sheet" style={{ background: spread.paper }}>
      {spread.image ? (
        <img className="jsc-bg" src={spread.image} alt="" draggable={false} decoding="async" style={{ maxWidth: "none", objectPosition: spread.imagePosition }} />
      ) : null}
      {spread.prints?.map((p, k) => (
        <figure
          key={k}
          className="jsc-print"
          data-tape={p.tape ? "" : undefined}
          style={{ left: p.x + "%", top: p.y + "%", width: p.w + "%", transform: "rotate(" + (p.rotate ?? 0) + "deg)" }}
        >
          <img src={p.src} alt="" draggable={false} decoding="async" style={{ maxWidth: "none" }} />
          {p.caption ? <figcaption>{p.caption}</figcaption> : null}
        </figure>
      ))}
      {spread.notes?.map((t, k) => (
        <div
          key={k}
          className="jsc-note"
          data-style={t.style ?? "card"}
          style={{ left: t.x + "%", top: t.y + "%", width: t.w + "%", transform: "rotate(" + (t.rotate ?? 0) + "deg)" }}
        >
          {t.title ? <b>{t.title}</b> : null}
          {t.body ? <span>{t.body}</span> : null}
        </div>
      ))}
    </div>
  )
}

const ACTIONS = [
  { id: "more", label: "More options" },
  { id: "share", label: "Share spread" },
  { id: "delete", label: "Delete spread" },
  { id: "add", label: "Add a page" },
]

export default function JournalSpreadCarousel({
  spreads = [],
  title = "Journal",
  meta,
  height = "100svh",
  initialIndex = 0,
  autoPlay = 2600,
  onIndexChange,
  onAction,
  className,
  topSlot,
  barSlot,
}) {
  const n = spreads.length
  const start = clamp(Math.round(initialIndex), 0, Math.max(0, n - 1))
  const [index, setIndex] = React.useState(start)
  const [reduced, setReduced] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const rootRef = React.useRef(null)
  const stageRef = React.useRef(null)
  const items = React.useRef([])
  const pages = React.useRef([])
  const width = React.useRef(0) // cached on resize; the frame loop never measures
  const pos = React.useRef(start)
  const target = React.useRef(start)
  const tween = React.useRef(null)
  const raf = React.useRef(0)
  const drag = React.useRef(null)
  const touched = React.useRef(false)
  const reducedRef = React.useRef(false)
  const onIndexRef = React.useRef(onIndexChange)
  onIndexRef.current = onIndexChange

  const paint = React.useCallback(() => {
    const w = width.current
    if (!w) return
    for (let i = 0; i < items.current.length; i++) {
      const el = items.current[i]
      if (!el) continue
      const q = poseFor(i - pos.current, w)
      if (q.hidden) {
        el.style.visibility = "hidden"
        continue
      }
      el.style.visibility = "visible"
      el.style.opacity = String(q.opacity)
      el.style.transform = "translate3d(" + q.x.toFixed(2) + "px,0," + q.z.toFixed(2) + "px)"
      const l = pages.current[i * 2]
      const r = pages.current[i * 2 + 1]
      if (l) {
        l.style.transform = "rotateY(" + q.left.toFixed(2) + "deg)"
        l.style.setProperty("--jsc-s", q.shadeLeft.toFixed(3))
      }
      if (r) {
        r.style.transform = "rotateY(" + q.right.toFixed(2) + "deg)"
        r.style.setProperty("--jsc-s", q.shadeRight.toFixed(3))
      }
    }
  }, [])

  const frame = React.useCallback(
    (t) => {
      raf.current = 0
      const tw = tween.current
      if (tw) {
        const k = tw.dur > 0 ? clamp((t - tw.t0) / tw.dur, 0, 1) : 1
        pos.current = tw.from + (tw.to - tw.from) * tw.ease(k)
        if (k >= 1) tween.current = null
      }
      paint()
      if (tween.current) raf.current = requestAnimationFrame(frame)
    },
    [paint],
  )

  const kick = React.useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(frame)
  }, [frame])

  const go = React.useCallback(
    (to, ease = easeInOut) => {
      const next = clamp(to, 0, Math.max(0, n - 1))
      if (next !== target.current) {
        target.current = next
        setIndex(next)
        onIndexRef.current?.(next)
      }
      const dur = reducedRef.current ? 0 : durationFor(Math.abs(next - pos.current))
      tween.current = { from: pos.current, to: next, t0: performance.now(), dur, ease }
      kick()
    },
    [n, kick],
  )

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => {
      reducedRef.current = mq.matches
      setReduced(mq.matches)
    }
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  // Measure once per resize and cache it; the per-frame paint reads only the cache.
  React.useEffect(() => {
    const stage = stageRef.current
    const root = rootRef.current
    if (!stage || !root) return

    const updateDimensions = (sw, sh) => {
      const stageW = sw || stage.clientWidth || root.clientWidth || 600
      const stageH = sh || stage.clientHeight || root.clientHeight || 450
      const w = spreadWidth(stageW, stageH)
      width.current = w
      root.style.setProperty("--jsc-w", w + "px")
      root.style.setProperty("--jsc-h", Math.round(w / spreadAspect(stageW, stageH)) + "px")
      paint()
    }

    // Run initial measurement immediately
    updateDimensions(stage.clientWidth, stage.clientHeight)

    const ro = new ResizeObserver(([entry]) => {
      const { width: sw, height: sh } = entry.contentRect
      updateDimensions(sw, sh)
    })
    ro.observe(stage)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [paint])

  React.useEffect(() => {
    if (pos.current > n - 1) go(n - 1)
    else paint()
  }, [n, go, paint])

  // Turns pages on its own until someone touches it; pauses off-screen and in a hidden tab.
  React.useEffect(() => {
    const root = rootRef.current
    if (!autoPlay || reduced || n < 2 || !root) return
    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(root)
    const id = window.setInterval(() => {
      if (touched.current || !visible || document.hidden || drag.current) return
      go(target.current >= n - 1 ? 0 : target.current + 1)
    }, autoPlay)
    return () => {
      window.clearInterval(id)
      io.disconnect()
    }
  }, [autoPlay, reduced, n, go])

  const stop = () => {
    touched.current = true
  }

  const onPointerDown = (e) => {
    if (e.button !== 0 || n < 1) return
    stop()
    tween.current = null
    drag.current = { id: e.pointerId, x: e.clientX, from: pos.current, lastX: e.clientX, lastT: e.timeStamp, v: 0, moved: false }
  }

  const onPointerMove = (e) => {
    const d = drag.current
    const w = width.current
    if (!d || d.id !== e.pointerId || !w) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true
      setDragging(true)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch (_) {}
    }
    if (!d.moved) return
    const dt = Math.max(1, e.timeStamp - d.lastT)
    d.v = d.v * 0.6 + (-(e.clientX - d.lastX) / (w * 0.42) / (dt / 1000)) * 0.4
    d.lastX = e.clientX
    d.lastT = e.timeStamp
    pos.current = clamp(d.from - dx / (w * 0.42), -0.3, n - 0.7)
    kick()
  }

  const onPointerUp = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    setDragging(false)
    if (d.moved) {
      go(settle(pos.current, d.v, n), easeOut)
      return
    }
    const hit = e.target.closest?.("[data-i]")
    const i = hit ? Number(hit.getAttribute("data-i")) : target.current
    go(i)
  }

  const onKeyDown = (e) => {
    const map = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }
    if (e.target !== e.currentTarget) return
    if (e.key in map) go(target.current + map[e.key])
    else if (e.key === "Home") go(0)
    else if (e.key === "End") go(n - 1)
    else return
    e.preventDefault()
    stop()
  }

  // Trackpads swipe sideways; a vertical wheel is left to scroll the page.
  const wheel = React.useRef({ acc: 0, at: 0 })
  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      const w = wheel.current
      w.acc += e.deltaX
      if (Math.abs(w.acc) < 40 || e.timeStamp - w.at < 320) return
      touched.current = true
      w.at = e.timeStamp
      go(target.current + (w.acc > 0 ? 1 : -1))
      w.acc = 0
    }
    stage.addEventListener("wheel", onWheel, { passive: true })
    return () => stage.removeEventListener("wheel", onWheel)
  }, [go])

  const current = spreads[index]
  const pagesLabel = meta ?? n * 2 + " Pages"

  return (
    <div
      ref={rootRef}
      className={"jsc-root" + (className ? " " + className : "")}
      style={{ height }}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={title}
      onKeyDown={onKeyDown}
    >
      <style>{CSS}</style>
      {topSlot !== undefined ? (
        topSlot
      ) : (
        <div className="jsc-top">
          <div className="jsc-group">
            <button type="button" className="jsc-chip" aria-pressed="true" aria-label="Spread view">
              <Icon name="book" />
            </button>
            <button type="button" className="jsc-chip" aria-pressed="false" aria-label="Grid view">
              <Icon name="grid" />
            </button>
          </div>
          <div className="jsc-head">
            <h2 className="jsc-title">{title}</h2>
            <div className="jsc-meta">
              <Icon name="lock" />
              {pagesLabel}
            </div>
          </div>
          <div className="jsc-group">
            <button type="button" className="jsc-chip" aria-label="Search">
              <Icon name="search" />
            </button>
            <button type="button" className="jsc-chip" aria-label="Menu">
              <Icon name="menu" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={stageRef}
        className="jsc-stage"
        data-drag={dragging ? "" : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="jsc-floor" aria-hidden="true" />
        <div className="jsc-view">
          <div className="jsc-scene">
            {spreads.map((s, i) => (
              <div
                key={s.id ?? i}
                ref={(el) => {
                  items.current[i] = el
                }}
                className="jsc-item"
                data-i={i}
                role="group"
                aria-roledescription="spread"
                aria-label={(s.label ?? "Spread " + (i + 1)) + ", " + (i + 1) + " of " + n}
                aria-hidden={i !== index}
              >
                {s.alt ? <span className="jsc-sr">{s.alt}</span> : null}
                {["l", "r"].map((side, k) => (
                  <div
                    key={side}
                    ref={(el) => {
                      pages.current[i * 2 + k] = el
                    }}
                    className="jsc-page"
                    data-side={side}
                  >
                    <Sheet spread={s} />
                    <div className="jsc-gutter" />
                    <div className="jsc-shade" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {barSlot !== undefined ? (
        barSlot
      ) : null}

      <p className="jsc-sr" aria-live="polite">
        {current ? (current.label ?? "Spread " + (index + 1)) + ", " + (index + 1) + " of " + n : ""}
      </p>
    </div>
  )
}

