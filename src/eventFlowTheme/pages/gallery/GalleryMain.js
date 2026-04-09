"use client";
import { Link } from 'react-router-dom'; // Use react-router-dom for routing.
import GalleryImg1 from '../../assets/images/gallery/gallery-1-1.jpg'
import GalleryImg2 from '../../assets/images/gallery/gallery-1-2.jpg'
import GalleryImg3 from '../../assets/images/gallery/gallery-1-3.jpg'
import GalleryImg4 from '../../assets/images/gallery/gallery-1-4.jpg'
import GalleryImg5 from '../../assets/images/gallery/gallery-1-5.jpg'
import GalleryImg6 from '../../assets/images/gallery/gallery-1-6.jpg'
import GalleryImg7 from '../../assets/images/gallery/gallery-1-7.jpg'
import GalleryImg8 from '../../assets/images/gallery/gallery-1-9.jpg'
const galleryItems = [
  {
    src: GalleryImg1,
    alt: "Gallery 1",
    title: "Dream Makers Event Planning",
    subtitle: "Gala Affairs",
    href: "/gallery-details",
  },
  {
    src: GalleryImg2,
    alt: "Gallery 2",
    title: "Dream Makers Event Planning",
    subtitle: "Gala Affairs",
    href: "/gallery-details",
  },
  {
    src: GalleryImg3,
    alt: "Gallery 3",
    title: "Dream Makers Event Planning",
    subtitle: "Gala Affairs",
    href: "/gallery-details",
  },
  {
    src: GalleryImg4,
    alt: "Gallery 4",
    title: "Dream Makers Event Planning",
    subtitle: "Gala Affairs",
    href: "/gallery-details",
  },
  {
    src: GalleryImg5,
    alt: "Gallery 5",
    title: "Dream Makers Event Planning",
    subtitle: "Gala Affairs",
    href: "/gallery-details",
  },
  {
    src: GalleryImg6,
    alt: "Gallery 6",
    title: "Dream Makers Event Planning",
    subtitle: "Gala Affairs",
    href: "/gallery-details",
  },
  {
    src: GalleryImg7,
    alt: "Gallery 7",
    title: "Dream Makers Event Planning",
    subtitle: "Gala Affairs",
    href: "/gallery-details",
  },
  {
    src: GalleryImg8,
    alt: "Gallery 9",
    title: "Dream Makers Event Planning",
    subtitle: "Gala Affairs",
    href: "/gallery-details",
  },
];
export default function Home() {
  return (

          <section className="gallery-one">
            <div className="container">
              <div className="row masonary-layout">
                {galleryItems.map((item, index) => (
                  <div
                    key={index}
                    className={`col-xl-${
                      index === 8 ? 3 : 3
                    } col-lg-6 col-md-6`}
                  >
                    <div className="gallery-one__single">
                      <div className="gallery-one__img">
                        <img src={item.src} alt={item.alt} />
                        <div className="gallery-one__content">
                          <div className="gallery-one__sub-title-box">
                            <div className="gallery-one__sub-title-shape"></div>
                            <p className="gallery-one__sub-title">
                              {item.subtitle}
                            </p>
                          </div>
                          <h4 className="gallery-one__title">
                            <Link to={item.href}>{item.title}</Link>
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>


  );
}
