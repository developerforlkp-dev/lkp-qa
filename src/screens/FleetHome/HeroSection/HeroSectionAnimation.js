import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { gsap } from 'gsap';
import cn from 'classnames';
import styles from './HeroSectionAnimation.module.sass';

// Constants
const CARD_WIDTH = 60;
const CARD_HEIGHT = 60;
const CARD_GAP = 12;
const SIDE_MARGIN_DESKTOP = 60;
const SIDE_MARGIN_MOBILE = 20;
const MOBILE_BREAKPOINT = 768;
const ANIMATION_DURATION = 3100;
const RESIZE_DEBOUNCE = 250;
const EASE_TYPE = "sine.inOut";

// Card selectors (module-level, no hooks needed)
const getCard = (index) => `#hero-card-${index}`;
const getCardContent = (index) => `#hero-card-content-${index}`;

const HeroSectionAnimation = ({ containerRef, destinations = [] }) => {
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
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
    }

    async function loadAllImages() {
      return Promise.allSettled(destinations.map(({ image }) => loadImage(image)));
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

        if (activeElement && destinations[newOrder[0]]) activeElement.textContent = destinations[newOrder[0]].title;
        if (activeDesc && destinations[newOrder[0]]) activeDesc.textContent = destinations[newOrder[0]].description;
        if (activeButton && destinations[newOrder[0]]) {
          activeButton.textContent = destinations[newOrder[0]].buttonText;
          if (destinations[newOrder[0]].buttonLink) {
            activeButton.setAttribute('data-button-link', destinations[newOrder[0]].buttonLink);
          } else {
            activeButton.removeAttribute('data-button-link');
          }
          currentActiveIndexRef.current = newOrder[0];
        }

        const { width: containerWidth, height: containerHeight } = getContainerDimensions();
        const sideMargin = containerWidth <= MOBILE_BREAKPOINT ? SIDE_MARGIN_MOBILE : SIDE_MARGIN_DESKTOP;
        const totalCardsHeight = (newOrder.length - 1) * CARD_HEIGHT + (newOrder.length - 2) * CARD_GAP;
        const cardX = containerWidth - CARD_WIDTH - sideMargin;
        const offsetTop = Math.max(10, (containerHeight - totalCardsHeight) / 2);
        const [active, ...rest] = newOrder;
        const prv = rest[rest.length - 1];

        gsap.set(detailsActive, { zIndex: 22, yPercent: -50 });
        gsap.to(detailsActive, { opacity: 1, yPercent: -50, delay: 0.4, ease: EASE_TYPE });
        gsap.to(`${detailsActive} .hero-title-1`, { y: 0, opacity: 1, delay: 0.15, duration: 0.7, ease: EASE_TYPE, force3D: true, immediateRender: false });
        gsap.to(`${detailsActive} .hero-desc`, { y: 0, opacity: 1, delay: 0.15, duration: 0.7, ease: EASE_TYPE, force3D: true, immediateRender: false });
        gsap.to(`${detailsActive} .hero-button`, {
          y: 0, opacity: 1, delay: 0.15, duration: 0.7, ease: EASE_TYPE, force3D: true, immediateRender: false,
          onComplete: function () { gsap.set(this.targets(), { y: 0, clearProps: "will-change" }); }
        });
        gsap.set(detailsInactive, { zIndex: 12 });

        gsap.set(getCard(prv), { zIndex: 10 });
        gsap.set(getCard(active), { zIndex: 20 });
        gsap.to(getCard(prv), { scale: 1.5, ease: EASE_TYPE });
        gsap.to(getCardContent(active), { y: offsetTop + CARD_HEIGHT - 10, opacity: 0, duration: 0.3, ease: EASE_TYPE });

        gsap.to(getCard(active), {
          x: 0, y: 0, ease: EASE_TYPE, width: containerWidth, height: containerHeight, borderRadius: 0,
          onComplete: () => {
            const yNew = offsetTop + (rest.length - 1) * (CARD_HEIGHT + CARD_GAP);
            const boundedY = Math.max(10, Math.min(yNew, containerHeight - CARD_HEIGHT - 10));
            gsap.set(getCard(prv), { x: cardX, y: boundedY, width: CARD_WIDTH, height: CARD_HEIGHT, zIndex: 30, borderRadius: 10, scale: 1 });
            gsap.set(getCardContent(prv), { x: cardX, y: boundedY + CARD_HEIGHT - 50, opacity: 1, zIndex: 40 });
            gsap.set(detailsInactive, { opacity: 0, yPercent: -50 });
            gsap.set(`${detailsInactive} .hero-title-1`, { y: 50, opacity: 0 });
            gsap.set(`${detailsInactive} .hero-desc`, { y: 50, opacity: 0 });
            gsap.set(`${detailsInactive} .hero-button`, { y: 50, opacity: 0 });
            isAnimatingRef.current = false;
            resolve();
          },
        });

        rest.forEach((cardIndex, index) => {
          if (cardIndex !== prv) {
            const cardY = offsetTop + index * (CARD_HEIGHT + CARD_GAP);
            const boundedY = Math.max(10, Math.min(cardY, containerHeight - CARD_HEIGHT - 10));
            gsap.set(getCard(cardIndex), { zIndex: 30 });
            gsap.to(getCard(cardIndex), { x: cardX, y: boundedY, width: CARD_WIDTH, height: CARD_HEIGHT, ease: EASE_TYPE, delay: 0.1 * (index + 1) });
            gsap.to(getCardContent(cardIndex), { x: cardX, y: boundedY + CARD_HEIGHT - 50, opacity: 1, zIndex: 40, ease: EASE_TYPE, delay: 0.1 * (index + 1) });
          }
        });
      });
    }

    // ── Animation loop ────────────────────────────────────────────────────────

    async function loop() {
      await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION));
      if (!isMountedRef.current || !orderRef.current) return;

      const newOrder = [...orderRef.current];
      newOrder.push(newOrder.shift());
      const newDetailsEven = !detailsEvenRef_state.current;

      orderRef.current = newOrder;
      detailsEvenRef_state.current = newDetailsEven;

      await step(newOrder, newDetailsEven);
      if (!isMountedRef.current || !orderRef.current) return;

      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && orderRef.current) loop();
      }, 0);
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
      const sideMargin = containerWidth <= MOBILE_BREAKPOINT ? SIDE_MARGIN_MOBILE : SIDE_MARGIN_DESKTOP;
      const totalCardsHeight = rest.length * CARD_HEIGHT + (rest.length - 1) * CARD_GAP;
      const cardX = containerWidth - CARD_WIDTH - sideMargin;
      const offsetTop = Math.max(10, (containerHeight - totalCardsHeight) / 2);

      gsap.set(getCard(active), { x: 0, y: 0, width: containerWidth, height: containerHeight, borderRadius: 0, zIndex: 20, opacity: 1, scale: 1 });
      gsap.set(getCardContent(active), { x: 0, y: 0, opacity: 0, zIndex: 40 });

      rest.forEach((cardIndex, index) => {
        const cardY = offsetTop + index * (CARD_HEIGHT + CARD_GAP);
        const boundedY = Math.max(10, Math.min(cardY, containerHeight - CARD_HEIGHT - 10));
        gsap.set(getCard(cardIndex), { x: cardX, y: boundedY, width: CARD_WIDTH, height: CARD_HEIGHT, zIndex: 30, borderRadius: 10, opacity: 1, scale: 1 });
        gsap.set(getCardContent(cardIndex), { x: cardX, zIndex: 40, y: boundedY + CARD_HEIGHT - 50, opacity: 1 });
      });

      const detailsActive = detailsEven ? "#details-even" : "#details-odd";
      const detailsInactive = detailsEven ? "#details-odd" : "#details-even";

      const activeElement = document.querySelector(`${detailsActive} .hero-title-1`);
      const activeDesc = document.querySelector(`${detailsActive} .hero-desc`);
      const activeButton = document.querySelector(`${detailsActive} .hero-button`);

      if (activeElement && destinations[active]) activeElement.textContent = destinations[active].title;
      if (activeDesc && destinations[active]) activeDesc.textContent = destinations[active].description;
      if (activeButton && destinations[active]) {
        activeButton.textContent = destinations[active].buttonText;
        currentActiveIndexRef.current = active;
      }

      gsap.set(detailsActive, { opacity: 1, zIndex: 22, yPercent: -50 });
      gsap.set(`${detailsActive} .hero-title-1`, { y: 0, opacity: 1 });
      gsap.set(`${detailsActive} .hero-desc`, { y: 0, opacity: 1 });
      gsap.set(`${detailsActive} .hero-button`, { y: 0, opacity: 1 });
      gsap.set(detailsInactive, { opacity: 0, zIndex: 12, yPercent: -50 });
      gsap.set(`${detailsInactive} .hero-title-1`, { y: 50, opacity: 0 });
      gsap.set(`${detailsInactive} .hero-desc`, { y: 50, opacity: 0 });
      gsap.set(`${detailsInactive} .hero-button`, { y: 50, opacity: 0 });

      setTimeout(() => {
        if (!isMountedRef.current || !orderRef.current) return;
        step(order, detailsEven).then(() => {
          setTimeout(() => {
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
    if (demoRef.current) demoRef.current.innerHTML = cardsHTML + cardContentsHTML;

    // ── Show static first card immediately ────────────────────────────────────

    function showInitialStaticCard() {
      if (!demoRef.current || !containerRef?.current || !orderRef.current) return;
      const { width: containerWidth, height: containerHeight } = getContainerDimensions();
      if (containerWidth === 0 || containerHeight === 0) return;

      const [active] = orderRef.current;
      const detailsActive = detailsEvenRef_state.current ? "#details-even" : "#details-odd";
      const detailsInactive = detailsEvenRef_state.current ? "#details-odd" : "#details-even";

      gsap.set(getCard(active), { x: 0, y: 0, width: containerWidth, height: containerHeight, borderRadius: 0, zIndex: 20, opacity: 1 });
      gsap.set(getCardContent(active), { x: 0, y: 0, opacity: 0, zIndex: 40 });
      gsap.set(detailsActive, { opacity: 1, zIndex: 22, yPercent: -50, x: 0 });
      gsap.set(`${detailsActive} .hero-title-1`, { y: 0, opacity: 1 });
      gsap.set(`${detailsActive} .hero-desc`, { y: 0, opacity: 1 });
      gsap.set(`${detailsActive} .hero-button`, { y: 0, opacity: 1 });

      const initialButton = document.querySelector(`${detailsActive} .hero-button`);
      if (initialButton && destinations[active]) {
        if (destinations[active].buttonLink) initialButton.setAttribute('data-button-link', destinations[active].buttonLink);
        currentActiveIndexRef.current = active;
      }

      gsap.set(detailsInactive, { opacity: 0, zIndex: 12, yPercent: -50 });
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
          }
        }, 300);
      } catch (error) {
        console.error("Hero section: Error loading images", error);
        setTimeout(() => {
          if (orderRef.current && containerRef?.current && isMountedRef.current) {
            init(orderRef.current, detailsEvenRef_state.current);
          }
        }, 500);
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
          <div className={cn(styles.title1, "hero-title-1")}>{destinations[0]?.title}</div>
        </div>
        <div className={cn(styles.desc, "hero-desc")}>{destinations[0]?.description}</div>
        <button className={cn(styles.button, "hero-button")} data-button-link={destinations[0]?.buttonLink || ''}>
          {destinations[0]?.buttonText}
        </button>
      </div>

      <div className={cn(styles.details, "details")} id="details-odd" ref={detailsOddRef}>
        <div className={styles.titleBox1}>
          <div className={cn(styles.title1, "hero-title-1")}>{destinations[0]?.title}</div>
        </div>
        <div className={cn(styles.desc, "hero-desc")}>{destinations[0]?.description}</div>
        <button className={cn(styles.button, "hero-button")} data-button-link={destinations[0]?.buttonLink || ''}>
          {destinations[0]?.buttonText}
        </button>
      </div>
    </>
  );
};

export default HeroSectionAnimation;
