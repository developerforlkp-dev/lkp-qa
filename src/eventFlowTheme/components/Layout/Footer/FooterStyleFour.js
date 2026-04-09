import { Link } from 'react-router-dom';
import footerLogo from '../../../assets/images/resources/footer-logo-4.png'


// Example footer data (replace with actual dynamic data)
const footerData = {
  logo: footerLogo,
  socialLinks: [
    { to: '#', icon: 'icon-facebook-f', name: 'Facebook' },
    { to: '#', icon: 'icon-twitter', name: 'Twitter' },
    { to: '#', icon: 'icon-linkedin-in', name: 'Linkedin' },
    { to: '#', icon: 'icon-pinterest', name: 'Pinterest' },
  ],
  contact: {
    email: 'debra.holt@example.com',
    phones: ['01245789321', '012457895146'],
  },
  services: [
    { to: '/skyline-roofing-solutions', text: 'Roof Renewal' },
    { to: '/peak-performance-roofing', text: 'Peak Protection' },
    { to: '/skyline-roofing-solutions', text: 'Skyline Roof Care' },
    { to: '/sure-guard-roofing-services', text: 'Guardian Roof' },
  ],
  pages: [
    { to: '/about', text: 'About Us' },
    { to: '/services', text: 'Service' },
    { to: '/project', text: 'Portfolio' },
    { to: '/contact', text: 'Contact' },
    { to: '/testimonials', text: 'Testimonial' },
  ],
  bottomMenu: [
    { to: '/terms', text: 'Terms & Conditions' },
    { to: '/privacy-policy', text: 'Privacy Policy' },
    { to: '/contact', text: 'Contact Us' },
  ],
};

export default function FooterFour() {
  return (
    <>
      {/* Site Footer Four Start */}
      <footer className="site-footer-four">
        <div className="site-footer-four__top">
          <div className="container">
            <div className="site-footer-four__top-inner">
              <div className="site-footer-four__logo">
                <Link to="/">
                  <img src={footerData.logo} alt="Footer Logo" />
                </Link>
              </div>
              <div className="site-footer-four__social">
                {footerData.socialLinks.map((social, index) => (
                  <Link to={social.href} key={index}>
                    <span className={social.icon}></span>
                    {social.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="site-footer-four__middle">
          <div className="container">
            <div className="site-footer-four__middle-inner">
              <div className="row">
                <div className="col-xl-7 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="100ms">
                  <div className="footer-widget-four__column footer-widget-four__contact">
                    <h3 className="footer-widget-four__contact-title">Let`s Work <br /> Together</h3>
                    <ul className="footer-widget-four__contact-list list-unstyled">
                      <li>
                        <div className="icon">
                          <span className="icon-envelope"></span>
                        </div>
                        <div className="text">
                          <p><a href={`mailto:${footerData.contact.email}`}>{footerData.contact.email}</a></p>
                        </div>
                      </li>
                      <li>
                        <div className="icon">
                          <span className="icon-call"></span>
                        </div>
                        <div className="text">
                          {footerData.contact.phones.map((phone, index) => (
                            <p key={index}>
                              <a href={`tel:${phone}`}>{phone}</a>
                              {index < footerData.contact.phones.length - 1 && ', '}
                            </p>
                          ))}
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-3 col-md-3 wow fadeInUp" data-wow-delay="200ms">
                  <div className="footer-widget-four__column footer-widget-four__services">
                    <div className="footer-widget-four__title-box">
                      <h3 className="footer-widget-four__title">Services</h3>
                    </div>
                    <ul className="footer-widget-four__services-list list-unstyled">
                      {footerData.services.map((service, index) => (
                        <li key={index}>
                          <Link to={service.href}>
                            <span className="icon-angle-left"></span>{service.text}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="col-xl-2 col-lg-3 col-md-3 wow fadeInUp" data-wow-delay="200ms">
                  <div className="footer-widget-four__column footer-widget-four__page">
                    <div className="footer-widget-four__title-box">
                      <h3 className="footer-widget-four__title">Page</h3>
                    </div>
                    <ul className="footer-widget-four__page-list list-unstyled">
                      {footerData.pages.map((page, index) => (
                        <li key={index}>
                          <Link to={page.href}>{page.text}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="site-footer-four__bottom">
          <div className="container">
            <div className="site-footer-four__bottom-inner">
              <p className="site-footer-four__bottom-text">© themehealer 2024 | All Rights Reserved</p>
              <ul className="list-unstyled site-footer-four__bottom-menu">
                {footerData.bottomMenu.map((menu, index) => (
                  <li key={index}>
                    <Link to={menu.href}>{menu.text}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
      {/* Site Footer Four End */}
    </>
  );
}
