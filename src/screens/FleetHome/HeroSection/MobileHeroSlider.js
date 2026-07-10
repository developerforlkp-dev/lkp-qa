import React from 'react';
import { useHistory } from 'react-router-dom';
import Slider from 'react-slick';
import cn from 'classnames';
import styles from './MobileHeroSlider.module.sass';

const MobileHeroSlider = ({ destinations, onReady }) => {
  const history = useHistory();

  // Preload the first image before calling onReady to maintain the skeleton loader
  React.useEffect(() => {
    if (!destinations || destinations.length === 0 || !destinations[0].image) {
      if (onReady) onReady();
      return;
    }

    let isMounted = true;
    const img = new Image();
    
    const handleReady = () => {
      if (isMounted && onReady) {
        onReady();
      }
    };

    img.onload = handleReady;
    img.onerror = handleReady;
    img.src = destinations[0].image;

    return () => {
      isMounted = false;
    };
  }, [destinations, onReady]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    dotsClass: `slick-dots ${styles.dots}`,
  };

  const handleButtonClick = (e, link) => {
    e.preventDefault();
    e.stopPropagation();
    if (link) {
      if (link.startsWith('http://') || link.startsWith('https://')) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        history.push(link);
      }
    }
  };

  const formatTitleWithAccent = (title) => {
    if (!title) return '';
    const words = title.trim().split(/\s+/);
    if (words.length >= 4) {
      const lastWord = words.pop();
      return `${words.join(' ')} <span class="hero-accent-word">${lastWord}</span>`;
    }
    return title;
  };

  return (
    <div className={styles.sliderContainer}>
      <Slider {...settings} className={styles.slider}>
        {destinations.map((dest, index) => (
          <div key={index} className={styles.slide}>
            <div 
              className={styles.imageBackground}
              style={{ backgroundImage: `url(${dest.image})` }}
            />
            <div className={styles.overlay} />
            <div className={styles.content}>
              <div 
                className={styles.title} 
                dangerouslySetInnerHTML={{ __html: formatTitleWithAccent(dest.title) }} 
              />
              <button 
                className={styles.button} 
                onClick={(e) => handleButtonClick(e, dest.buttonLink)}
              >
                <span>{dest.buttonText}</span>
                <div className={styles.buttonIcon}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default MobileHeroSlider;
