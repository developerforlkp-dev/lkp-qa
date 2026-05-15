import React from "react";
import { Link } from "react-router-dom";
import cn from "classnames";
import styles from "./PageList.module.sass";

const PageList = () => {
  return (
    <div className={styles.page}>
      <div className={cn("container", styles.container)}>
        <p>
          <Link to="/">Experience</Link>
        </p>
        <p>
          <Link to="/experience-category">Experience Category</Link>
        </p>
        <p>
          <Link to="/experience-product">Experience Product Details</Link>
        </p>
        <p>
          <Link to="/experience-checkout">Experience Checkout</Link>
        </p>
        <p>
          <Link to="/experience-checkout-complete">Experience Checkout Complete</Link>
        </p>
        <p>
          <Link to="/full-photo">Full Photo Grid</Link>
        </p>
        <p style={{ marginTop: 40 }}>
          <Link to="/flights">Flights</Link>
        </p>
        <p>
          <Link to="/flights-category">Flights category</Link>
        </p>
        <p style={{ marginTop: 40 }}>
          <Link to="/things-to-do">Things to do</Link>
        </p>
        <p>
          <Link to="/category">Category</Link>
        </p>
        <p>
          <Link to="/product">Product</Link>
        </p>
        <p>
          <Link to="/checkout">Checkout</Link>
        </p>
        <p>
          <Link to="/checkout-complete">Checkout Complete</Link>
        </p>
        <p style={{ marginTop: 40 }}>
          <Link to="/cars">Cars</Link>
        </p>
        <p>
          <Link to="/cars-category">Cars category</Link>
        </p>
        <p>
          <Link to="/cars-category-2">Cars category 2</Link>
        </p>
        <p>
          <Link to="/cars-product">Cars Product Details</Link>
        </p>
        <p>
          <Link to="/cars-checkout">Cars Checkout</Link>
        </p>
        <p>
          <Link to="/cars-checkout-complete">Cars Checkout Complete</Link>
        </p>
        <p style={{ marginTop: 40 }}>
          <Link to="/support">Support</Link>
        </p>
        <p>
          <Link to="/host-profile">Host profile</Link>
        </p>
        <p>
          <Link to="/profile">User profile</Link>
        </p>
        <p>
          <Link to="/account-settings">Account Settings</Link>
        </p>
        <p>
          <Link to="/messages">Message Center</Link>
        </p>
        <p>
          <Link to="/wishlists">Wishlists</Link>
        </p>
        <p>
          <Link to="/your-trips">Your Bookings</Link>
        </p>
        <p>
          <Link to="/bookings">Bookings</Link>
        </p>
        <p>
          <Link to="/list-your-property">List your property</Link>
        </p>
      </div>
    </div>
  );
};

export default PageList;
