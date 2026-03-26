import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { gsap } from 'gsap';
import cn from 'classnames';
import styles from './HeroSectionAnimation.module.sass';

// Constants
const CARD_WIDTH = 60;
const CARD_HEIGHT = 60;
const CARD_GAP = 12;
// Side margins matching the details panel (title/description)
const SIDE_MARGIN_DESKTOP = 60;
const SIDE_MARGIN_MOBILE = 20;
const MOBILE_BREAKPOINT = 768;
const ANIMATION_DURATION = 3100; // 3.1 seconds
const RESIZE_DEBOUNCE = 250;
const EASE_TYPE = "sine.inOut";

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
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Get container dimensions helper
  const getContainerDimensions = useCallback(() => {
    if (!containerRef?.current) {
      return { width: 0, height: 0 };
    }
    const rect = containerRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }, [containerRef]);

  // Validate image URL
  const validateImageUrl = (url) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return url.startsWith('/');
    }
  };

  // Preload images
  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      if (!validateImageUrl(src)) {
        reject(new Error(`Invalid image URL: ${src}`));
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }, []);

  // Load all images
  const loadAllImages = useCallback(async () => {
    const promises = destinations.map(({ image }) => loadImage(image));
    return Promise.allSettled(promises);
  }, [destinations, loadImage]);

  // Get card selector
  const getCard = (index) => `#hero-card-${index}`;
  const getCardContent = (index) => `#hero-card-content-${index}`;

  // Initialize animation - set up initial state, then use step() for first cycle (exactly like all others)
  const init = useCallback((order, detailsEven) => {
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

    // Calculate positions for vertical stacking on the right side
    // Use same side margin as details panel (title/description)
    const sideMargin = containerWidth <= MOBILE_BREAKPOINT ? SIDE_MARGIN_MOBILE : SIDE_MARGIN_DESKTOP;
    const totalCardsHeight = rest.length * CARD_HEIGHT + (rest.length - 1) * CARD_GAP;
    const cardX = containerWidth - CARD_WIDTH - sideMargin;
    const offsetTop = Math.max(10, (containerHeight - totalCardsHeight) / 2);

    // Set up initial state to match what step() expects BEFORE it rotates:
    // - Active card (first in order) should be full-size
    // - Rest cards should be in stack positions
    
    // Position active card as full-size (matches static display)
    gsap.set(getCard(active), {
      x: 0,
      y: 0,
      width: containerWidth,
      height: containerHeight,
      borderRadius: 0,
      zIndex: 20,
      opacity: 1,
      scale: 1,
    });

    gsap.set(getCardContent(active), {
      x: 0,
      y: 0,
      opacity: 0, // Content hidden initially (matches step behavior)
      zIndex: 40,
    });

    // Position rest cards in vertical stack on the right side
    rest.forEach((cardIndex, index) => {
      const cardY = offsetTop + index * (CARD_HEIGHT + CARD_GAP);
      const boundedY = Math.max(10, Math.min(cardY, containerHeight - CARD_HEIGHT - 10));

      gsap.set(getCard(cardIndex), {
        x: cardX,
        y: boundedY,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        zIndex: 30,
        borderRadius: 10,
        opacity: 1,
        scale: 1,
      });

      gsap.set(getCardContent(cardIndex), {
        x: cardX,
        zIndex: 40,
        y: boundedY + CARD_HEIGHT - 50,
        opacity: 1,
      });
    });

    // Set up details panels initial state
    const detailsActive = detailsEven ? "#details-even" : "#details-odd";
    const detailsInactive = detailsEven ? "#details-odd" : "#details-even";
    
    // Update details content for active card
    const activeElement = document.querySelector(`${detailsActive} .hero-title-1`);
    const activeDesc = document.querySelector(`${detailsActive} .hero-desc`);
    const activeButton = document.querySelector(`${detailsActive} .hero-button`);

    if (activeElement && destinations[active]) {
      activeElement.textContent = destinations[active].title;
    }
    if (activeDesc && destinations[active]) {
      activeDesc.textContent = destinations[active].description;
    }
    if (activeButton && destinations[active]) {
      activeButton.textContent = destinations[active].buttonText;
      // Store current active index for button click handler
      currentActiveIndexRef.current = active;
    }

    gsap.set(detailsActive, { 
      opacity: 1, 
      zIndex: 22, 
      yPercent: -50
    });
    gsap.set(`${detailsActive} .hero-title-1`, { y: 0, opacity: 1 });
    gsap.set(`${detailsActive} .hero-desc`, { y: 0, opacity: 1 });
    gsap.set(`${detailsActive} .hero-button`, { y: 0, opacity: 1 });
    
    gsap.set(detailsInactive, { 
      opacity: 0, 
      zIndex: 12,
      yPercent: -50
    });
    gsap.set(`${detailsInactive} .hero-title-1`, { y: 50, opacity: 0 });
    gsap.set(`${detailsInactive} .hero-desc`, { y: 50, opacity: 0 });
    gsap.set(`${detailsInactive} .hero-button`, { y: 50, opacity: 0 });

    // Wait ANIMATION_DURATION before first step() call, matching loop() timing
    // This ensures the first cycle has the same timing and pacing as all subsequent cycles
    setTimeout(() => {
      if (!isMountedRef.current || !orderRef.current) return;
      
      // Use step function exactly - this ensures first cycle matches all others perfectly
      step(order, detailsEven).then(() => {
        // Start the animation loop after first step completes
        setTimeout(() => {
          if (isMountedRef.current && orderRef.current) {
            loop();
          }
        }, ANIMATION_DURATION);
      });
    }, ANIMATION_DURATION); // Match loop() timing - wait ANIMATION_DURATION before first step
  // eslint-disable-next-line no-use-before-define
  }, [getContainerDimensions, containerRef, demoRef, destinations, loop, step]);

  // Animation step
  const step = useCallback((order, detailsEven) => {
    return new Promise((resolve) => {
      if (isAnimatingRef.current) {
        resolve();
        return;
      }

      isAnimatingRef.current = true;
      
      // Rotate order for next card
      const newOrder = [...order];
      newOrder.push(newOrder.shift());
      const newDetailsEven = !detailsEven;

      const detailsActive = newDetailsEven ? "#details-even" : "#details-odd";
      const detailsInactive = newDetailsEven ? "#details-odd" : "#details-even";

      // Update details content - use global class names
      const activeElement = document.querySelector(`${detailsActive} .hero-title-1`);
      const activeDesc = document.querySelector(`${detailsActive} .hero-desc`);
      const activeButton = document.querySelector(`${detailsActive} .hero-button`);

      if (activeElement && destinations[newOrder[0]]) {
        activeElement.textContent = destinations[newOrder[0]].title;
      }
      if (activeDesc && destinations[newOrder[0]]) {
        activeDesc.textContent = destinations[newOrder[0]].description;
      }
      if (activeButton && destinations[newOrder[0]]) {
        activeButton.textContent = destinations[newOrder[0]].buttonText;
        // Store button link in data attribute for click handler
        if (destinations[newOrder[0]].buttonLink) {
          activeButton.setAttribute('data-button-link', destinations[newOrder[0]].buttonLink);
        } else {
          activeButton.removeAttribute('data-button-link');
        }
        // Store current active index for button click handler
        currentActiveIndexRef.current = newOrder[0];
      }

      const { width: containerWidth, height: containerHeight } = getContainerDimensions();
      // Use same side margin as details panel (title/description)
      const sideMargin = containerWidth <= MOBILE_BREAKPOINT ? SIDE_MARGIN_MOBILE : SIDE_MARGIN_DESKTOP;
      const totalCardsHeight = (newOrder.length - 1) * CARD_HEIGHT + (newOrder.length - 2) * CARD_GAP;
      const cardX = containerWidth - CARD_WIDTH - sideMargin;
      const offsetTop = Math.max(10, (containerHeight - totalCardsHeight) / 2);

      const [active, ...rest] = newOrder;
      const prv = rest[rest.length - 1];

      // Animate details - use global class names (all elements use identical timing)
      gsap.set(detailsActive, { zIndex: 22, yPercent: -50 });
      gsap.to(detailsActive, { opacity: 1, yPercent: -50, delay: 0.4, ease: EASE_TYPE });
      gsap.to(`${detailsActive} .hero-title-1`, {
        y: 0,
        opacity: 1,
        delay: 0.15,
        duration: 0.7,
        ease: EASE_TYPE,
        force3D: true,
        immediateRender: false,
      });
      gsap.to(`${detailsActive} .hero-desc`, {
        y: 0,
        opacity: 1,
        delay: 0.15,
        duration: 0.7,
        ease: EASE_TYPE,
        force3D: true,
        immediateRender: false,
      });
      gsap.to(`${detailsActive} .hero-button`, {
        y: 0,
        opacity: 1,
        delay: 0.15,
        duration: 0.7,
        ease: EASE_TYPE,
        force3D: true,
        immediateRender: false,
        onComplete: function() {
          // Ensure transform is properly set to final state
          gsap.set(this.targets(), { y: 0, clearProps: "will-change" });
        }
      });
      gsap.set(detailsInactive, { zIndex: 12 });

      // Animate cards
      gsap.set(getCard(prv), { zIndex: 10 });
      gsap.set(getCard(active), { zIndex: 20 });
      gsap.to(getCard(prv), { scale: 1.5, ease: EASE_TYPE });

      gsap.to(getCardContent(active), {
        y: offsetTop + CARD_HEIGHT - 10,
        opacity: 0,
        duration: 0.3,
        ease: EASE_TYPE,
      });

      gsap.to(getCard(active), {
        x: 0,
        y: 0,
        ease: EASE_TYPE,
        width: containerWidth,
        height: containerHeight,
        borderRadius: 0,
        onComplete: () => {
          const yNew = offsetTop + (rest.length - 1) * (CARD_HEIGHT + CARD_GAP);
          const boundedY = Math.max(10, Math.min(yNew, containerHeight - CARD_HEIGHT - 10));

          gsap.set(getCard(prv), {
            x: cardX,
            y: boundedY,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            zIndex: 30,
            borderRadius: 10,
            scale: 1,
          });

          gsap.set(getCardContent(prv), {
            x: cardX,
            y: boundedY + CARD_HEIGHT - 50,
            opacity: 1,
            zIndex: 40,
          });

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
          gsap.to(getCard(cardIndex), {
            x: cardX,
            y: boundedY,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            ease: EASE_TYPE,
            delay: 0.1 * (index + 1),
          });

          gsap.to(getCardContent(cardIndex), {
            x: cardX,
            y: boundedY + CARD_HEIGHT - 50,
            opacity: 1,
            zIndex: 40,
            ease: EASE_TYPE,
            delay: 0.1 * (index + 1),
          });
        }
      });
    });
  }, [getContainerDimensions, destinations]);

  // Animation loop - update refs and continue
  const loop = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATION));
    
    // Check if component is still mounted and initialized
    if (!isMountedRef.current || !orderRef.current) {
      return;
    }
    
    const newOrder = [...orderRef.current];
    newOrder.push(newOrder.shift());
    const newDetailsEven = !detailsEvenRef_state.current;
    
    // Update refs
    orderRef.current = newOrder;
    detailsEvenRef_state.current = newDetailsEven;
    
    await step(newOrder, newDetailsEven);
    
    // Check again before scheduling next loop
    if (!isMountedRef.current || !orderRef.current) {
      return;
    }
    
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
    }
    loopTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && orderRef.current) {
        loop();
      }
    }, 0);
  }, [step]);

  // Handle resize - get current values from refs
  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      if (!isAnimatingRef.current && isInitialized && orderRef.current) {
        init(orderRef.current, detailsEvenRef_state.current);
      }
    }, RESIZE_DEBOUNCE);
  }, [isInitialized, init]);

  useEffect(() => {
    // Check GSAP availability
    if (typeof gsap === 'undefined') {
      console.error('GSAP is not loaded');
      return;
    }

    // Check container ref
    if (!containerRef?.current) {
      console.warn('Hero section: containerRef is required');
      return;
    }

    // Mark component as mounted
    isMountedRef.current = true;
    
    // Reset state on mount/remount
    setIsInitialized(false);
    isAnimatingRef.current = false;
    
    // Clear any existing timeouts
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }
    
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }

    // Kill all existing GSAP animations for this component's elements
    if (demoRef.current) {
      const cards = demoRef.current.querySelectorAll('.hero-card, .hero-card-content');
      cards.forEach(card => {
        gsap.killTweensOf(card);
      });
    }
    gsap.killTweensOf("#details-even, #details-odd");
    
    // Clear any existing HTML content
    if (demoRef.current) {
      demoRef.current.innerHTML = '';
    }

    // Initialize order and detailsEven in refs for proper closure handling
    orderRef.current = destinations.map((_, index) => index);
    detailsEvenRef_state.current = true;

    // Generate cards HTML - use global class names for GSAP selectors
    const cardsHTML = destinations.map((dest, index) => 
      `<div class="hero-card" id="hero-card-${index}" style="background-image:url(${dest.image})"></div>`
    ).join('');

    const cardContentsHTML = destinations.map((dest, index) => 
      `<div class="hero-card-content" id="hero-card-content-${index}">
      </div>`
    ).join('');

    if (demoRef.current) {
      demoRef.current.innerHTML = cardsHTML + cardContentsHTML;
    }

    // Show static first card immediately (before animation starts)
    const showInitialStaticCard = () => {
      if (!demoRef.current || !containerRef?.current || !orderRef.current) return;
      
      const { width: containerWidth, height: containerHeight } = getContainerDimensions();
      if (containerWidth === 0 || containerHeight === 0) return;

      const [active] = orderRef.current;
      const detailsActive = detailsEvenRef_state.current ? "#details-even" : "#details-odd";

      // Show first card as static full-size image immediately
      gsap.set(getCard(active), {
        x: 0,
        y: 0,
        width: containerWidth,
        height: containerHeight,
        borderRadius: 0,
        zIndex: 20,
        opacity: 1,
      });

      gsap.set(getCardContent(active), {
        x: 0,
        y: 0,
        opacity: 0, // Content hidden initially (matches step behavior)
        zIndex: 40,
      });

      // Show details panel immediately with correct content
      gsap.set(detailsActive, { 
        opacity: 1, 
        zIndex: 22, 
        yPercent: -50,
        x: 0
      });
      gsap.set(`${detailsActive} .hero-title-1`, { y: 0, opacity: 1 });
      gsap.set(`${detailsActive} .hero-desc`, { y: 0, opacity: 1 });
      gsap.set(`${detailsActive} .hero-button`, { y: 0, opacity: 1 });
      
      // Set button link data attribute
      const initialButton = document.querySelector(`${detailsActive} .hero-button`);
      if (initialButton && destinations[active]) {
        if (destinations[active].buttonLink) {
          initialButton.setAttribute('data-button-link', destinations[active].buttonLink);
        }
        currentActiveIndexRef.current = active;
      }

      // Hide inactive details panel
      const detailsInactive = detailsEvenRef_state.current ? "#details-odd" : "#details-even";
      gsap.set(detailsInactive, { 
        opacity: 0, 
        zIndex: 12,
        yPercent: -50
      });

      // Hide side cards initially
      const rest = orderRef.current.slice(1);
      rest.forEach((cardIndex) => {
        gsap.set(getCard(cardIndex), {
          opacity: 0,
          zIndex: 0,
        });
        gsap.set(getCardContent(cardIndex), {
          opacity: 0,
          zIndex: 0,
        });
      });
    };

    // Show static card immediately
    showInitialStaticCard();

    // Load images and initialize animation after everything is ready
    const start = async () => {
      try {
        await loadAllImages();
        // Small delay to ensure DOM is ready and images are loaded
        setTimeout(() => {
          if (orderRef.current && containerRef?.current && isMountedRef.current) {
            init(orderRef.current, detailsEvenRef_state.current);
            setIsInitialized(true);
          }
        }, 300); // Give time for images to render
      } catch (error) {
        console.error("Hero section: Error loading images", error);
        // Still initialize even if some images fail, but wait a bit longer
        setTimeout(() => {
          if (orderRef.current && containerRef?.current && isMountedRef.current) {
            init(orderRef.current, detailsEvenRef_state.current);
            setIsInitialized(true);
          }
        }, 500);
      }
    };

    start();

    const demoRefCurrent = demoRef.current;

    // Setup resize handler
    const resizeHandler = () => {
      handleResize();
    };
    window.addEventListener('resize', resizeHandler);

    // Cleanup function
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
      
      // Stop all animations
      isAnimatingRef.current = false;
      
      // Remove event listeners
      window.removeEventListener('resize', resizeHandler);
      
      // Clear timeouts
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
      
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
      
      // Kill all GSAP animations for this component's elements
      if (demoRefCurrent) {
        const cards = demoRefCurrent.querySelectorAll('.hero-card, .hero-card-content');
        cards.forEach(card => {
          gsap.killTweensOf(card);
        });
      }
      gsap.killTweensOf("#details-even, #details-odd");
      
      // Reset refs
      orderRef.current = null;
      detailsEvenRef_state.current = true;
      
      // Clear HTML content
      if (demoRefCurrent) {
        demoRefCurrent.innerHTML = '';
      }
    };
  }, [containerRef, destinations, getContainerDimensions, handleResize, init, loadAllImages]);

  // Handle button click navigation using event delegation
  useEffect(() => {
    const handleButtonClick = (e) => {
      // Check if clicked element is a button or inside a button
      const button = e.target.closest('.hero-button');
      if (!button) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Get button link from data attribute or current active destination
      const buttonLink = button.getAttribute('data-button-link');
      const activeIndex = currentActiveIndexRef.current;
      const activeDestination = destinations[activeIndex];
      const link = buttonLink || (activeDestination && activeDestination.buttonLink);
      
      if (link) {
        // Check if it's an external URL
        if (link.startsWith('http://') || link.startsWith('https://')) {
          window.open(link, '_blank', 'noopener,noreferrer');
        } else {
          // Internal route navigation
          history.push(link);
        }
      }
    };

    // Use event delegation on the document or container
    document.addEventListener('click', handleButtonClick);
    
    return () => {
      document.removeEventListener('click', handleButtonClick);
    };
  }, [destinations, history]);

  if (!destinations || destinations.length === 0) {
    return null;
  }

  return (
    <>
      <div ref={demoRef} className={styles.cardsContainer}></div>

      <div className={cn(styles.details, "details")} id="details-even" ref={detailsEvenRef}>
        <div className={styles.titleBox1}>
          <div className={cn(styles.title1, "hero-title-1")}>
            {destinations[0]?.title}
          </div>
        </div>
        <div className={cn(styles.desc, "hero-desc")}>
          {destinations[0]?.description}
        </div>
        <button 
          className={cn(styles.button, "hero-button")}
          data-button-link={destinations[0]?.buttonLink || ''}
        >
          {destinations[0]?.buttonText}
        </button>
      </div>

      <div className={cn(styles.details, "details")} id="details-odd" ref={detailsOddRef}>
        <div className={styles.titleBox1}>
          <div className={cn(styles.title1, "hero-title-1")}>
            {destinations[0]?.title}
          </div>
        </div>
        <div className={cn(styles.desc, "hero-desc")}>
          {destinations[0]?.description}
        </div>
        <button 
          className={cn(styles.button, "hero-button")}
          data-button-link={destinations[0]?.buttonLink || ''}
        >
          {destinations[0]?.buttonText}
        </button>
      </div>
    </>
  );
};

export default HeroSectionAnimation;


