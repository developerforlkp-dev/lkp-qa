'use client'
import React from 'react';
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import brandImg1 from '../../assets/images/brand/brand-2-1.png';
import brandImg2 from '../../assets/images/brand/brand-2-2.png';
import brandImg3 from '../../assets/images/brand/brand-2-3.png';
import brandImg4 from '../../assets/images/brand/brand-2-4.png';
import brandImg5 from '../../assets/images/brand/brand-2-5.png';

const swiperOptions = {
    modules: [Autoplay, Pagination, Navigation],
    spaceBetween: 100,
    slidesPerView: 5,
    loop: true,
    navigation: {
        nextEl: "#brand-one__swiper-button-next",
        prevEl: "#brand-one__swiper-button-prev"
    },
    autoplay: { delay: 5000 },

   breakpoints: {
            0: {
                  spaceBetween: 30,
                  slidesPerView: 1
              },
              375: {
                  spaceBetween: 30,
                  slidesPerView: 1
              },
              575: {
                  spaceBetween: 30,
                  slidesPerView: 2
              },
              767: {
                  spaceBetween: 50,
                  slidesPerView: 3
              },
              991: {
                  spaceBetween: 50,
                  slidesPerView: 4
              },
              1199: {
                  spaceBetween: 100,
                  slidesPerView: 5
              },
          
    }
}

export default function BrandSlider2() {
    return (
        <>

            <Swiper {...swiperOptions} className="thm-swiper__slider swiper-container">
                <div className="swiper-wrapper">
                    <SwiperSlide className="swiper-slide">
                        <img src={brandImg1} alt="" />
                    </SwiperSlide>
                    {/* /.swiper-slide */}
                    <SwiperSlide className="swiper-slide">
                        <img src={brandImg2} alt="" />
                    </SwiperSlide>
                    {/* /.swiper-slide */}
                    <SwiperSlide className="swiper-slide">
                        <img src={brandImg3} alt="" />
                    </SwiperSlide>
                    {/* /.swiper-slide */}
                    <SwiperSlide className="swiper-slide">
                        <img src={brandImg4} alt="" />
                    </SwiperSlide>
                    {/* /.swiper-slide */}
                    <SwiperSlide className="swiper-slide">
                        <img src={brandImg5} alt="" />
                    </SwiperSlide>
                    {/* /.swiper-slide */}
                    <SwiperSlide className="swiper-slide">
                        <img src={brandImg1} alt="" />
                    </SwiperSlide>
                    {/* /.swiper-slide */}
                    <SwiperSlide className="swiper-slide">
                        <img src={brandImg2} alt="" />
                    </SwiperSlide>
                    {/* /.swiper-slide */}
                    <SwiperSlide className="swiper-slide">
                        <img src={brandImg3} alt="" />
                    </SwiperSlide>
                    {/* /.swiper-slide */}
                    <SwiperSlide className="swiper-slide">
                        <img src={brandImg4} alt="" />
                    </SwiperSlide>
                    {/* /.swiper-slide */}
                    <SwiperSlide className="swiper-slide">
                        <img src={brandImg5} alt="" />
                    </SwiperSlide>
                    {/* /.swiper-slide */}
                </div>
            </Swiper>
        </>
    )
}
