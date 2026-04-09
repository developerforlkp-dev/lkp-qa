// src/components/BrandOne.js
import React from 'react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Import local images
import BrandImg1 from '../../assets/images/brand/brand-1-1.png';
import BrandImg2 from '../../assets/images/brand/brand-1-2.png';
import BrandImg3 from '../../assets/images/brand/brand-1-3.png';
import BrandImg4 from '../../assets/images/brand/brand-1-4.png';
import BrandImg5 from '../../assets/images/brand/brand-1-5.png';

// Swiper options
const swiperOptions = {
  modules: [Autoplay, Pagination, Navigation],
  slidesPerView: 2,
  spaceBetween: 30,
  speed: 2000,
  autoplay: {
    delay: 9000,
    disableOnInteraction: false,
  },
  loop: true,
  navigation: {
    nextEl: '.swiper-button-next1',
    prevEl: '.swiper-button-prev1',
  },
  pagination: {
    el: '.swiper-dot-style1',
    type: 'bullets',
    clickable: true,
  },
  breakpoints: {
    0: {
      spaceBetween: 0,
      slidesPerView: 1,
    },
    375: {
      spaceBetween: 30,
      slidesPerView: 1,
    },
    575: {
      spaceBetween: 30,
      slidesPerView: 2,
    },
    768: {
      spaceBetween: 30,
      slidesPerView: 3,
    },
    992: {
      spaceBetween: 30,
      slidesPerView: 4,
    },
    1200: {
      spaceBetween: 30,
      slidesPerView: 5,
    },
    1320: {
      spaceBetween: 30,
      slidesPerView: 5,
    },
  },
};

// Dynamic data array
const brandData = [
  { src: BrandImg1, alt: 'Brand 1' },
  { src: BrandImg2, alt: 'Brand 2' },
  { src: BrandImg3, alt: 'Brand 3' },
  { src: BrandImg4, alt: 'Brand 4' },
  { src: BrandImg5, alt: 'Brand 5' },
  { src: BrandImg1, alt: 'Brand 6' },
  { src: BrandImg2, alt: 'Brand 7' },
  { src: BrandImg3, alt: 'Brand 8' },
  { src: BrandImg4, alt: 'Brand 9' },
  { src: BrandImg5, alt: 'Brand 10' },
];

export default function BrandOne() {
  return (
    <>
      {/* Brand One Start */}
      <section className="brand-one">
        <div className="container">
          {/* Swiper Slider */}
          <Swiper {...swiperOptions}>
            {brandData.map((brand, index) => (
              <SwiperSlide key={index}>
                <div className="brand-one__single">
                  <div className="brand-one__img">
                    <img src={brand.src} alt={brand.alt} />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
      {/* Brand One End */}
    </>
  );
}
