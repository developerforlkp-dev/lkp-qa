import React, { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import styles from "./StaysCheckoutComplete.module.sass";
import Control from "../../components/Control";
import CheckoutSlider from "./CheckoutSlider";
import CheckoutComplete from "../../components/CheckoutComplete";

const breadcrumbs = [
  {
    title: "Spectacular views of Queenstown",
    url: "/stays-product",
  },
  {
    title: "Confirm and pay",
    url: "/stays-checkout",
  },
  {
    title: "Checkout completed",
  },
];

const StaysCheckoutComplete = () => {
  const [booking, setBooking] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  useEffect(() => {
    try {
      const b = localStorage.getItem("checkoutBooking");
      if (b) setBooking(JSON.parse(b));
    } catch {}
    try {
      const p = localStorage.getItem("razorpayPaymentSuccess");
      if (p) setPaymentSuccess(JSON.parse(p));
    } catch {}
  }, []);

  const title = booking?.listingTitle || "Your booking is confirmed";

  const gallery = useMemo(() => {
    const img = booking?.listingImage || "/images/content/slider-pic-1.jpg";
    return [
      { src: img, srcSet: img },
      { src: img, srcSet: img },
      { src: img, srcSet: img },
    ];
  }, [booking]);

  const parameters = useMemo(() => {
    const guestsCount =
      (booking?.guests?.adults || 0) + (booking?.guests?.children || 0);
    return [
      { title: `${guestsCount} ${guestsCount === 1 ? "guest" : "guests"}` },
    ];
  }, [booking]);

  const options = useMemo(() => {
    const totalRow =
      booking?.receipt?.find?.((r) => r.title?.toLowerCase() === "total")
        ?.content || "";

    return [
      {
        title: "Booking code:",
        content:
          paymentSuccess?.razorpay_payment_id ||
          paymentSuccess?.payment_id ||
          "—",
        icon: "hand-cart",
      },
      {
        title: "Date:",
        content:
          booking?.bookingSummary?.date ||
          booking?.selectedDate ||
          "—",
        icon: "calendar",
      },
      {
        title: "Total:",
        content: totalRow || "—",
        icon: "receipt",
      },
      {
        title: "Payment method:",
        content: "Razorpay",
        icon: "wallet",
      },
    ];
  }, [booking, paymentSuccess]);

  const items = useMemo(() => {
    const guestsCount =
      (booking?.guests?.adults || 0) + (booking?.guests?.children || 0);
    return [
      {
        title: "Date",
        content:
          booking?.bookingSummary?.date ||
          booking?.selectedDate ||
          "—",
      },
      {
        title: "Time",
        content: booking?.bookingSummary?.time || "—",
      },
      {
        title: "Guests",
        content: guestsCount ? `${guestsCount} guests` : "—",
      },
    ];
  }, [booking]);

  return (
    <div className={cn("section-mb80", styles.section)}>
      <div className={cn("container", styles.container)}>
        <Control
          className={styles.control}
          urlHome="/"
          breadcrumbs={breadcrumbs}
        />
        <div className={styles.row}>
          <div className={styles.col}>
            <CheckoutSlider className={styles.slider} gallery={gallery} />
          </div>
          <div className={styles.col}>
            <CheckoutComplete
              className={styles.complete}
              title={title}
              parameters={parameters}
              options={options}
              items={items}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaysCheckoutComplete;
