import React from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./CheckoutComplete.module.sass";
import Icon from "../Icon";

const CheckoutComplete = ({ className, title, parameters, options, items, paymentFailed = false, onRetryPayment, isStay, isEvent, hostName, avatarUrl, rating, reviews }) => {
  const bookedMessage = isStay
    ? "Your stay has been booked!"
    : isEvent
      ? "Your event has been booked!"
      : "Your trip has been booked!";

  return (
    <div className={cn(className, styles.complete)}>
      <div className={styles.head}>
        {paymentFailed ? (
          <>
            <div className={cn("h2", styles.title)} style={{ color: "#0097B2" }}>Payment Failed</div>
            <div className={styles.info} style={{ color: "#0097B2" }}>
              Your payment could not be processed. Please try again.
            </div>
          </>
        ) : (
          <>
            <div className={cn("h2", styles.title)}>Congratulation!</div>
            <div className={styles.info}>
              {bookedMessage}{" "}
              <span role="img" aria-label="firework">
                🎉
              </span>
            </div>
          </>
        )}
        <div className={styles.subtitle}>{title}</div>
        {hostName && (
          <div className={styles.author}>
            <div className={styles.text}>Hosted by</div>
            <div className={styles.avatar}>
              <img src={avatarUrl || "/images/content/avatar.jpg"} alt="Avatar" />
            </div>
            <div className={styles.man}>{hostName}</div>
          </div>
        )}
      </div>
      <div className={styles.line}>
        {rating && (
          <div className={styles.rating}>
            <Icon name="star" size="20" />
            <div className={styles.number}>{rating}</div>
            {reviews && <div className={styles.reviews}>({reviews} reviews)</div>}
          </div>
        )}
        {parameters && (
          <div className={styles.parameters}>
            {parameters.map((x, index) => (
              <div className={styles.parameter} key={index}>
                {x.icon && <Icon name={x.icon} size="16" />}
                {x.title}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.list}>
        {items.map((x, index) => (
          <div className={styles.item} key={index}>
            {x.icon && (
              <div className={styles.icon} style={{ borderColor: x.color }}>
                <Icon name={x.icon} size="24" />
              </div>
            )}
            <div className={styles.details}>
              <div className={styles.category}>{x.title}</div>
              <div className={styles.value}>{x.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.stage}>Booking details</div>
      <div className={styles.table}>
        {options.map((x, index) => (
          <div className={styles.row} key={index}>
            <div className={styles.cell}>
              <Icon name={x.icon} size="20" />
              {x.title}
            </div>
            <div className={styles.cell}>{x.content}</div>
          </div>
        ))}
      </div>
      <div className={styles.btns}>
        {paymentFailed ? (
          <>
            <Link className={cn("button-stroke", styles.button)} to="/bookings">
              Your trips
            </Link>
            {onRetryPayment && (
              <button
                type="button"
                className={cn("button", styles.button)}
                onClick={onRetryPayment}
              >
                Retry Payment
              </button>
            )}
          </>
        ) : (
          <>
            <Link className={cn("button-stroke", styles.button)} to="/bookings">
              Your trips
            </Link>
            <Link className={cn("button", styles.button)} to={isStay ? "/stays" : "/things-to-do"}>
              Explore {isStay ? "places to stay" : "things to do"}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutComplete;
