import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { gsap } from 'gsap';
import cn from 'classnames';
import styles from './HeroSectionAnimation.module.sass';

// Constants
const THUMB_CONFIGS = [
  { size: 56, opacity: 1, zIndex: 33 },
  { size: 44, opacity: 0.75, zIndex: 32 },
  { size: 32, opacity: 0.5, zIndex: 31 },
];
const MOBILE_THUMB_CONFIGS = [
  { size: 48, opacity: 1, zIndex: 31 },
  { size: 48, opacity: 1, zIndex: 32 },
  { size: 48, opacity: 1, zIndex: 33 },
];
const OVERLAP_GAP = -16;
const SIDE_MARGIN_DESKTOP = 60;
const SIDE_MARGIN_MOBILE = 20;
const MOBILE_BREAKPOINT = 768;
const ANIMATION_DURATION = 5000;
const RESIZE_DEBOUNCE = 250;
const EASE_TYPE = "sine.inOut";

// Card selectors (module-level, no hooks needed)
const getCard = (index) => `#hero-card-${index}`;
const getCardContent = (index) => `#hero-card-content-${index}`;

const HeroSectionAnimation = ({ containerRef, destinations = [], onReady }) => {
  const history = useHistory();
  const demoRef = useRef(null);
  const detailsEvenRef = useRef(null);
  const detailsOddRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const loopTimeoutRef = useRef(null);
  const isAnimatingRef = useRef(false);
  const orderRef = useRef(null);
  const detailsEvenRef_state = useRef(true);
  const isMountedRef = useRef(true);
  const currentActiveIndexRef = useRef(0);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (typeof gsap === 'undefined') {
      console.error('GSAP is not loaded');
      return;
    }

    if (!containerRef?.current) {
      console.warn('Hero section: containerRef is required');
      return;
    }

    isMountedRef.current = true;
    isAnimatingRef.current = false;

    if (resizeTimeoutRef.current) { clearTimeout(resizeTimeoutRef.current); resizeTimeoutRef.current = null; }
    if (loopTimeoutRef.current) { clearTimeout(loopTimeoutRef.current); loopTimeoutRef.current = null; }

    if (demoRef.current) {
      demoRef.current.querySelectorAll('.hero-card, .hero-card-content').forEach(card => gsap.killTweensOf(card));
    }
    gsap.killTweensOf("#details-even, #details-odd");
    if (demoRef.current) demoRef.current.innerHTML = '';

    orderRef.current = destinations.map((_, index) => index);
    detailsEvenRef_state.current = true;

    // ── Helpers ───────────────────────────────────────────────────────────────

    function getContainerDimensions() {
      if (!containerRef?.current) return { width: 0, height: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }

    function validateImageUrl(url) {
      if (!url) return false;
      try { new URL(url); return true; } catch { return url.startsWith('/'); }
    }

    function loadImage(src) {
      return new Promise((resolve, reject) => {
        if (!validateImageUrl(src)) { reject(new Error(`Invalid image URL: ${src}`)); return; }
        const img = new Image();
        img.onload = () => {
          if (img.decode) {
            img.decode().then(() => resolve(img)).catch(() => resolve(img));
          } else {
            resolve(img);
          }
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
    }

    async function loadAllImages() {
      if (!destinations || destinations.length === 0) return;

      const activeIndex = orderRef.current ? orderRef.current[0] : 0;
      const activeDest = destinations[activeIndex];

      // Wait ONLY for the active image to load completely before revealing the hero section
      try {
        if (activeDest && activeDest.image) {
          await loadImage(activeDest.image);
        }
      } catch (e) {
        console.warn("Failed to load active hero image", e);
      }

      // Preload remaining images in the background without blocking the initial render
      destinations.forEach((dest, i) => {
        if (i !== activeIndex && dest.image) {
          loadImage(dest.image).catch(() => { });
        }
      });

      return true;
    }

    // ── Animation step ────────────────────────────────────────────────────────

    function step(order, detailsEven) {
      return new Promise((resolve) => {
        if (isAnimatingRef.current) { resolve(); return; }
        isAnimatingRef.current = true;

        const newOrder = [...order];
        newOrder.push(newOrder.shift());
        const newDetailsEven = !detailsEven;
        const detailsActive = newDetailsEven ? "#details-even" : "#details-odd";
        const detailsInactive = newDetailsEven ? "#details-odd" : "#details-even";

        const activeElement = document.querySelector(`${detailsActive} .hero-title-1`);
        const activeDesc = document.querySelector(`${detailsActive} .hero-desc`);
        const activeButton = document.querySelector(`${detailsActive} .hero-button`);

        const formatTitleWithAccent = (title) => {
          if (!title) return '';
          const words = title.trim().split(/\s+/);
          if (words.length >= 4) {
            const lastWord = words.pop();
            return `${words.join(' ')} <span class="hero-accent-word">${lastWord}</span>`;
          }
          return title;
        };

        if (activeElement && destinations[newOrder[0]]) activeElement.innerHTML = formatTitleWithAccent(destinations[newOrder[0]].title);
        if (activeDesc && destinations[newOrder[0]]) activeDesc.textContent = destinations[newOrder[0]].description;
        if (activeButton && destinations[newOrder[0]]) {
          const btnSpan = activeButton.querySelector('span');
          if (btnSpan) btnSpan.textContent = destinations[newOrder[0]].buttonText;
          if (destinations[newOrder[0]].buttonLink) {
            activeButton.setAttribute('data-button-link', destinations[newOrder[0]].buttonLink);
          } else {
            activeButton.removeAttribute('data-button-link');
          }
          currentActiveIndexRef.current = newOrder[0];
        }

        const { width: containerWidth, height: containerHeight } = getContainerDimensions();
        const isMobile = containerWidth <= MOBILE_BREAKPOINT;
        const currentThumbConfigs = isMobile ? MOBILE_THUMB_CONFIGS : THUMB_CONFIGS;
        const currentOverlap = isMobile ? 8 : OVERLAP_GAP;

        const sideMargin = isMobile ? SIDE_MARGIN_MOBILE : SIDE_MARGIN_DESKTOP;
        const thumbnailsY = isMobile 
          ? containerHeight - currentThumbConfigs[0].size - 55
          : containerHeight - THUMB_CONFIGS[0].size - 16; // Bottom of the hero section

        const getThumbX = (index) => {
          const startX = sideMargin;
          if (index === 2) return startX;
          if (index === 1) return startX + currentThumbConfigs[2].size + currentOverlap;
          if (index === 0) return startX + currentThumbConfigs[2].size + currentOverlap + currentThumbConfigs[1].size + currentOverlap;
          return startX;
        };
        
        const [active, ...rest] = newOrder;
        const prv = rest[rest.length - 1];

        gsap.set(detailsActive, { zIndex: 22 });
        gsap.to(detailsActive, { opacity: 1, delay: 0.4, ease: EASE_TYPE });
        gsap.to(`${detailsActive} .hero-title-1`, { y: 0, opacity: 1, delay: 0.15, duration: 0.7, ease: EASE_TYPE, force3D: true, immediateRender: false });
        gsap.to(`${detailsActive} .hero-desc`, { y: 0, opacity: 1, delay: 0.15, duration: 0.7, ease: EASE_TYPE, force3D: true, immediateRender: false });
        gsap.to(`${detailsActive} .hero-button`, {
          y: 0, opacity: 1, delay: 0.15, duration: 0.7, ease: EASE_TYPE, force3D: true, immediateRender: false,
          onComplete: function () { gsap.set(this.targets(), { y: 0, clearProps: "will-change" }); }
        });
        gsap.set(detailsInactive, { zIndex: 12 });

        gsap.set(getCard(prv), { zIndex: 10 });
        gsap.set(getCard(active), { zIndex: 20 });
        gsap.to(getCard(prv), { scale: 1.1, ease: EASE_TYPE });
        gsap.to(getCardContent(active), { y: thumbnailsY + 100, opacity: 0, duration: 0.3, ease: EASE_TYPE });

        const imageLeft = isMobile ? 0 : containerWidth * 0.2;
        const imageWidth = isMobile ? containerWidth : containerWidth * 0.8;

        gsap.to(getCard(active), {
          x: imageLeft, y: 0, ease: EASE_TYPE, width: imageWidth, height: "100%", borderRadius: 0, scale: 1,
          onComplete: () => {
            const prvIndexInRest = rest.length - 1;
            const config = currentThumbConfigs[Math.min(prvIndexInRest, 2)];
            const prvCardX = getThumbX(Math.min(prvIndexInRest, 2));
            const yOffset = isMobile ? 0 : (THUMB_CONFIGS[0].size - config.size) / 2; // vertically center smaller thumbnails
            gsap.set(getCard(prv), { x: prvCardX, y: thumbnailsY + yOffset, width: config.size, height: config.size, zIndex: config.zIndex, borderRadius: isMobile ? '50%' : 12, border: isMobile ? '1px solid #fff' : 'none', scale: isMobile ? 1 : 0.9 });
            gsap.set(getCardContent(prv), { x: prvCardX, y: thumbnailsY + yOffset + config.size + 10, opacity: 1, zIndex: 40 });
            gsap.set(detailsInactive, { opacity: 0 });
            gsap.set(`${detailsInactive} .hero-title-1`, { y: 50, opacity: 0 });
            gsap.set(`${detailsInactive} .hero-desc`, { y: 50, opacity: 0 });
            gsap.set(`${detailsInactive} .hero-button`, { y: 50, opacity: 0 });
            isAnimatingRef.current = false;
            resolve();
          },
        });

        rest.forEach((cardIndex, index) => {
          if (cardIndex !== prv) {
            const visualIndex = Math.min(index, 2);
            const config = currentThumbConfigs[visualIndex];
            const cardX = getThumbX(visualIndex);
            const yOffset = isMobile ? 0 : (THUMB_CONFIGS[0].size - config.size) / 2;
            gsap.set(getCard(cardIndex), { zIndex: config.zIndex });
            gsap.to(getCard(cardIndex), { 
              x: cardX, 
              y: thumbnailsY + yOffset, 
              width: config.size, 
              height: config.size, 
              opacity: config.opacity,
              borderRadius: isMobile ? '50%' : 12,
              border: isMobile ? '1px solid #fff' : 'none',
              scale: isMobile ? 1 : (index === 0 ? 1.1 : 0.9), // Active thumbnail (index 0) scales up
              ease: EASE_TYPE, 
              delay: 0.1 * (index + 1) 
            });
            gsap.to(getCardContent(cardIndex), { x: cardX, y: thumbnailsY + yOffset + config.size + 10, opacity: 1, zIndex: 40, ease: EASE_TYPE, delay: 0.1 * (index + 1) });
          }
        });
      });
    }

    // ── Animation loop ────────────────────────────────────────────────────────

    function loop() {
      if (!isMountedRef.current || !orderRef.current) return;

      const newOrder = [...orderRef.current];
      newOrder.push(newOrder.shift());
      const newDetailsEven = !detailsEvenRef_state.current;

      orderRef.current = newOrder;
      detailsEvenRef_state.current = newDetailsEven;

      step(newOrder, newDetailsEven).then(() => {
        if (!isMountedRef.current || !orderRef.current) return;
        if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && orderRef.current) loop();
        }, ANIMATION_DURATION);
      });
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    function init(order, detailsEven) {
      if (!demoRef.current || !containerRef?.current) {
        console.warn('Hero section: Container or demo ref not available');
        return;
      }
      const { width: containerWidth, height: containerHeight } = getContainerDimensions();
      if (containerWidth === 0 || containerHeight === 0) {
        console.warn('Hero section: Container has zero dimensions');
        return;
      }

      const [active, ...rest] = order;
      const isMobile = containerWidth <= MOBILE_BREAKPOINT;
      const currentThumbConfigs = isMobile ? MOBILE_THUMB_CONFIGS : THUMB_CONFIGS;
      const currentOverlap = isMobile ? -12 : OVERLAP_GAP;

      const sideMargin = isMobile ? SIDE_MARGIN_MOBILE : SIDE_MARGIN_DESKTOP;
      const thumbnailsY = isMobile 
        ? containerHeight - currentThumbConfigs[0].size - 30
        : containerHeight - THUMB_CONFIGS[0].size - 16; // Bottom of the hero section

      const getThumbX = (index) => {
        const startX = sideMargin;
        if (index === 2) return startX;
        if (index === 1) return startX + currentThumbConfigs[2].size + currentOverlap;
        if (index === 0) return startX + currentThumbConfigs[2].size + currentOverlap + currentThumbConfigs[1].size + currentOverlap;
        return startX;
      };

      const imageLeft = isMobile ? 0 : containerWidth * 0.2;
      const imageWidth = isMobile ? containerWidth : containerWidth * 0.8;

      gsap.set(getCard(active), { x: imageLeft, y: 0, width: imageWidth, height: "100%", borderRadius: 0, zIndex: 20, opacity: 1, scale: 1 });
      gsap.set(getCardContent(active), { x: 0, y: 0, opacity: 0, zIndex: 40 });

      rest.forEach((cardIndex, index) => {
        const visualIndex = Math.min(index, 2);
        const config = currentThumbConfigs[visualIndex];
        const cardX = getThumbX(visualIndex);
        const yOffset = isMobile ? 0 : (THUMB_CONFIGS[0].size - config.size) / 2; // Center vertically
        
        // Hide anything beyond the 3rd thumbnail completely
        if (index > 2) {
            gsap.set(getCard(cardIndex), { opacity: 0, scale: 0, x: cardX, y: thumbnailsY + yOffset });
            gsap.set(getCardContent(cardIndex), { opacity: 0 });
            return;
        }

        gsap.set(getCard(cardIndex), { 
            x: cardX, 
            y: thumbnailsY + yOffset, 
            width: config.size, 
            height: config.size, 
            zIndex: config.zIndex, 
            borderRadius: isMobile ? '50%' : 12,
            border: isMobile ? '1px solid #fff' : 'none',
            opacity: config.opacity, 
            scale: isMobile ? 1 : (index === 0 ? 1.1 : 0.9) // active is 1.1, inactive is 0.9
        });
        gsap.set(getCardContent(cardIndex), { x: cardX, zIndex: 40, y: thumbnailsY + yOffset + config.size + 10, opacity: 1 });
      });

      const detailsActive = detailsEven ? "#details-even" : "#details-odd";
      const detailsInactive = detailsEven ? "#details-odd" : "#details-even";

      const activeElement = document.querySelector(`${detailsActive} .hero-title-1`);
      const activeDesc = document.querySelector(`${detailsActive} .hero-desc`);
      const activeButton = document.querySelector(`${detailsActive} .hero-button`);

      const formatTitleWithAccent = (title) => {
        if (!title) return '';
        const words = title.trim().split(/\s+/);
        if (words.length >= 4) {
          const lastWord = words.pop();
          return `${words.join(' ')} <span class="hero-accent-word">${lastWord}</span>`;
        }
        return title;
      };

      if (activeElement && destinations[active]) activeElement.innerHTML = formatTitleWithAccent(destinations[active].title);
      if (activeDesc && destinations[active]) activeDesc.textContent = destinations[active].description;
      if (activeButton && destinations[active]) {
        const btnSpan = activeButton.querySelector('span');
        if (btnSpan) btnSpan.textContent = destinations[active].buttonText;
        if (destinations[active].buttonLink) {
          activeButton.setAttribute('data-button-link', destinations[active].buttonLink);
        } else {
          activeButton.removeAttribute('data-button-link');
        }
        currentActiveIndexRef.current = active;
      }

      gsap.set(detailsActive, { opacity: 1, zIndex: 22 });
      gsap.set(`${detailsActive} .hero-title-1`, { y: 0, opacity: 1 });
      gsap.set(`${detailsActive} .hero-desc`, { y: 0, opacity: 1 });
      gsap.set(`${detailsActive} .hero-button`, { y: 0, opacity: 1 });
      gsap.set(detailsInactive, { opacity: 0, zIndex: 12 });
      gsap.set(`${detailsInactive} .hero-title-1`, { y: 50, opacity: 0 });
      gsap.set(`${detailsInactive} .hero-desc`, { y: 50, opacity: 0 });
      gsap.set(`${detailsInactive} .hero-button`, { y: 50, opacity: 0 });

      if (loopTimeoutRef.current) { clearTimeout(loopTimeoutRef.current); }
      loopTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current || !orderRef.current) return;
        step(order, detailsEven).then(() => {
          if (loopTimeoutRef.current) { clearTimeout(loopTimeoutRef.current); }
          loopTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && orderRef.current) loop();
          }, ANIMATION_DURATION);
        });
      }, ANIMATION_DURATION);
    }

    // ── Build DOM ─────────────────────────────────────────────────────────────

    const cardsHTML = destinations.map((dest, index) =>
      `<div class="hero-card" id="hero-card-${index}" style="background-image:url(${dest.image})"></div>`
    ).join('');
    const cardContentsHTML = destinations.map((_, index) =>
      `<div class="hero-card-content" id="hero-card-content-${index}"></div>`
    ).join('');
    const svgOverlay = `
      <div class="hero-curve-overlay ${styles.curveOverlay}" style="
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 21;
        pointer-events: none;
      ">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <!-- Primary Solid Fill -->
          <path 
            class="hero-curve-fill"
            d="M0 0 L320 0 C 370 350, 320 700, 240 1000 L0 1000 Z" 
          />

          <!-- Random Stroke Effect 1 -->
          <path 
            d="M320 0 C 370 350, 320 700, 240 1000" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.4)" 
            stroke-width="1.5" 
          />
          
          <!-- Random Stroke Effect 2 -->
          <path 
            d="M310 0 C 350 300, 310 550, 250 800" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.3)" 
            stroke-width="4" 
            stroke-linecap="round"
          />
          
          <!-- Random Stroke Effect 3 -->
          <path 
            d="M300 0 C 340 280, 305 600, 235 900" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.4)" 
            stroke-width="1" 
            stroke-linecap="round"
          />

        </svg>
      </div>
    `;
    if (demoRef.current) demoRef.current.innerHTML = cardsHTML + cardContentsHTML + svgOverlay;

    // ── Show static first card immediately ────────────────────────────────────

    function showInitialStaticCard() {
      if (!demoRef.current || !containerRef?.current || !orderRef.current) return;
      const { width: containerWidth, height: containerHeight } = getContainerDimensions();
      if (containerWidth === 0 || containerHeight === 0) return;

      const [active] = orderRef.current;
      const detailsActive = detailsEvenRef_state.current ? "#details-even" : "#details-odd";
      const detailsInactive = detailsEvenRef_state.current ? "#details-odd" : "#details-even";

      const isMobile = containerWidth <= MOBILE_BREAKPOINT;
      const imageLeft = isMobile ? 0 : containerWidth * 0.2;
      const imageWidth = isMobile ? containerWidth : containerWidth * 0.8;

      // Smoothly fade in active banner image once fully decoded to mask progressive loading sliced states
      gsap.set(getCard(active), { x: imageLeft, y: 0, width: imageWidth, height: containerHeight, borderRadius: 0, zIndex: 20, opacity: 0 });
      loadImage(destinations[active].image).then(() => {
        if (isMountedRef.current) {
          gsap.to(getCard(active), { opacity: 1, duration: 0.6, ease: "power2.out" });
        }
      }).catch(() => {
        if (isMountedRef.current) {
          gsap.to(getCard(active), { opacity: 1, duration: 0.3 });
        }
      });

      gsap.set(getCardContent(active), { x: 0, y: 0, opacity: 0, zIndex: 40 });
      gsap.set(detailsActive, { opacity: 1, zIndex: 22, x: 0 });
      gsap.set(`${detailsActive} .hero-title-1`, { y: 0, opacity: 1 });
      gsap.set(`${detailsActive} .hero-desc`, { y: 0, opacity: 1 });
      gsap.set(`${detailsActive} .hero-button`, { y: 0, opacity: 1 });

      const initialButton = document.querySelector(`${detailsActive} .hero-button`);
      if (initialButton && destinations[active]) {
        if (destinations[active].buttonLink) initialButton.setAttribute('data-button-link', destinations[active].buttonLink);
        currentActiveIndexRef.current = active;
      }

      gsap.set(detailsInactive, { opacity: 0, zIndex: 12 });
      orderRef.current.slice(1).forEach((cardIndex) => {
        gsap.set(getCard(cardIndex), { opacity: 0, zIndex: 0 });
        gsap.set(getCardContent(cardIndex), { opacity: 0, zIndex: 0 });
      });
    }

    showInitialStaticCard();

    // ── Start ─────────────────────────────────────────────────────────────────

    async function start() {
      try {
        await loadAllImages();
        setTimeout(() => {
          if (orderRef.current && containerRef?.current && isMountedRef.current) {
            init(orderRef.current, detailsEvenRef_state.current);
            if (typeof onReadyRef.current === "function") {
              requestAnimationFrame(() => onReadyRef.current());
            }
          }
        }, 350);
      } catch (error) {
        console.error("Hero section: Error loading images", error);
        setTimeout(() => {
          if (orderRef.current && containerRef?.current && isMountedRef.current) {
            init(orderRef.current, detailsEvenRef_state.current);
            if (typeof onReadyRef.current === "function") {
              requestAnimationFrame(() => onReadyRef.current());
            }
          }
        }, 350);
      }
    }

    start();

    const demoRefCurrent = demoRef.current;

    // ── Resize ────────────────────────────────────────────────────────────────

    function handleResize() {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        if (!isAnimatingRef.current && orderRef.current) {
          init(orderRef.current, detailsEvenRef_state.current);
        }
      }, RESIZE_DEBOUNCE);
    }

    window.addEventListener('resize', handleResize);

    // ── Cleanup ───────────────────────────────────────────────────────────────

    return () => {
      isMountedRef.current = false;
      isAnimatingRef.current = false;
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) { clearTimeout(resizeTimeoutRef.current); resizeTimeoutRef.current = null; }
      if (loopTimeoutRef.current) { clearTimeout(loopTimeoutRef.current); loopTimeoutRef.current = null; }
      if (demoRefCurrent) {
        demoRefCurrent.querySelectorAll('.hero-card, .hero-card-content').forEach(card => gsap.killTweensOf(card));
      }
      gsap.killTweensOf("#details-even, #details-odd");
      orderRef.current = null;
      detailsEvenRef_state.current = true;
      if (demoRefCurrent) demoRefCurrent.innerHTML = '';
    };
  }, [containerRef, destinations]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Button click navigation ───────────────────────────────────────────────

  useEffect(() => {
    const handleButtonClick = (e) => {
      const button = e.target.closest('.hero-button');
      if (!button) return;
      e.preventDefault();
      e.stopPropagation();

      const buttonLink = button.getAttribute('data-button-link');
      const activeDestination = destinations[currentActiveIndexRef.current];
      const link = buttonLink || (activeDestination && activeDestination.buttonLink);

      if (link) {
        if (link.startsWith('http://') || link.startsWith('https://')) {
          window.open(link, '_blank', 'noopener,noreferrer');
        } else {
          history.push(link);
        }
      }
    };

    document.addEventListener('click', handleButtonClick);
    return () => document.removeEventListener('click', handleButtonClick);
  }, [destinations, history]);

  if (!destinations || destinations.length === 0) return null;

  return (
    <>
      <div ref={demoRef} className={styles.cardsContainer}></div>

      <div className={cn(styles.details, "details")} id="details-even" ref={detailsEvenRef}>
        <div className={styles.titleBox1}>
          <div className={cn(styles.title1, "hero-title-1")} dangerouslySetInnerHTML={{ __html: destinations[0]?.title ? destinations[0].title.split(/\s+/).length >= 4 ? `${destinations[0].title.split(/\s+/).slice(0, -1).join(' ')} <span class="hero-accent-word">${destinations[0].title.split(/\s+/).pop()}</span>` : destinations[0].title : '' }}></div>
        </div>
        <div className={cn(styles.desc, "hero-desc")}>{destinations[0]?.description}</div>
        <button className={cn(styles.button, "hero-button")} data-button-link={destinations[0]?.buttonLink || ''}>
          <span>{destinations[0]?.buttonText}</span>
          <div className={styles.buttonIcon}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      </div>

      <div className={cn(styles.details, "details")} id="details-odd" ref={detailsOddRef}>
        <div className={styles.titleBox1}>
          <div className={cn(styles.title1, "hero-title-1")} dangerouslySetInnerHTML={{ __html: destinations[0]?.title ? destinations[0].title.split(/\s+/).length >= 4 ? `${destinations[0].title.split(/\s+/).slice(0, -1).join(' ')} <span class="hero-accent-word">${destinations[0].title.split(/\s+/).pop()}</span>` : destinations[0].title : '' }}></div>
        </div>
        <div className={cn(styles.desc, "hero-desc")}>{destinations[0]?.description}</div>
        <button className={cn(styles.button, "hero-button")} data-button-link={destinations[0]?.buttonLink || ''}>
          <span>{destinations[0]?.buttonText}</span>
          <div className={styles.buttonIcon}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      </div>
    </>
  );
};

export default HeroSectionAnimation;
