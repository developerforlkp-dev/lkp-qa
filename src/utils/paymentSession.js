import { initializePayment, normalizeOrderPaymentSession } from "./api";

const PENDING_PAYMENT_KEY = "pendingPayment";
const PENDING_ORDER_ID_KEY = "pendingOrderId";
const PENDING_BOOKING_KEY = "pendingBooking";
const CHECKOUT_BOOKING_KEY = "checkoutBooking";

const safeStorage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage failures and let callers continue with in-memory state.
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Ignore storage failures and let callers continue with in-memory state.
    }
  },
};

const readJson = (key) => {
  const raw = safeStorage.get(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const isValidDate = (value) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

export const getCachedRazorpayKey = () => {
  const pendingPayment = readJson(PENDING_PAYMENT_KEY);
  return (
    pendingPayment?.razorpayKeyId ||
    safeStorage.get("lastRazorpayKeyId") ||
    process.env.REACT_APP_RAZORPAY_KEY_ID ||
    null
  );
};

export const isSuccessfulPaymentStatus = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "PAID" || normalized === "SUCCESS" || normalized === "CAPTURED";
};

export const isFailedPaymentStatus = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "FAILED" || normalized === "FAILURE";
};

export const isSuccessfulOrderStatus = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "COMPLETED" || normalized === "CONFIRMED";
};

export const isActiveHold = (holdExpiresAt) => {
  if (!isValidDate(holdExpiresAt)) return false;
  return new Date(holdExpiresAt).getTime() > Date.now();
};

export const isExpiredHold = (holdExpiresAt) => {
  if (!isValidDate(holdExpiresAt)) return false;
  return new Date(holdExpiresAt).getTime() <= Date.now();
};

export const isPendingCheckoutComplete = (session) => (
  isSuccessfulPaymentStatus(session?.paymentStatus) || isSuccessfulOrderStatus(session?.orderStatus)
);

export const serializePendingPayment = (session, extras = {}) => {
  const normalized = normalizeOrderPaymentSession(session, extras);
  const amount = Number(normalized?.payment?.amount);

  return {
    ...(readJson(PENDING_PAYMENT_KEY) || {}),
    ...extras,
    orderId: normalized?.orderId || extras?.orderId || null,
    paymentMethod: extras?.paymentMethod || "razorpay",
    razorpayOrderId: normalized?.payment?.razorpayOrderId || extras?.razorpayOrderId || null,
    razorpayKeyId: normalized?.payment?.razorpayKeyId || extras?.razorpayKeyId || getCachedRazorpayKey(),
    amount: Number.isFinite(amount) && amount > 0 ? amount : (extras?.amount ?? null),
    currency: normalized?.payment?.currency || extras?.currency || "INR",
    holdExpiresAt: normalized?.holdExpiresAt || extras?.holdExpiresAt || null,
    seatHoldExpiresAt: normalized?.seatHoldExpiresAt || extras?.seatHoldExpiresAt || normalized?.holdExpiresAt || null,
    paymentStatus: normalized?.paymentStatus || extras?.paymentStatus || null,
    orderStatus: normalized?.orderStatus || extras?.orderStatus || null,
  };
};

export const persistPendingPayment = (session, extras = {}) => {
  const serialized = serializePendingPayment(session, extras);
  safeStorage.set(PENDING_PAYMENT_KEY, JSON.stringify(serialized));

  if (serialized.orderId != null && serialized.orderId !== "") {
    safeStorage.set(PENDING_ORDER_ID_KEY, String(serialized.orderId));
  }
  if (serialized.razorpayKeyId) {
    safeStorage.set("lastRazorpayKeyId", serialized.razorpayKeyId);
  }

  return serialized;
};

export const persistPendingCheckout = ({ bookingData, session, extras = {}, saveCheckoutBooking = false }) => {
  if (bookingData) {
    safeStorage.set(PENDING_BOOKING_KEY, JSON.stringify(bookingData));
    if (saveCheckoutBooking) {
      safeStorage.set(CHECKOUT_BOOKING_KEY, JSON.stringify(bookingData));
    }
  }

  if (session || Object.keys(extras).length > 0) {
    return persistPendingPayment(session || extras, extras);
  }

  return null;
};

export const clearPendingPaymentSession = () => {
  safeStorage.remove(PENDING_PAYMENT_KEY);
};

export const clearPendingCheckoutState = ({ keepCheckoutBooking = false, keepActualPaidAmount = false } = {}) => {
  safeStorage.remove(PENDING_PAYMENT_KEY);
  safeStorage.remove(PENDING_ORDER_ID_KEY);
  safeStorage.remove("razorpayPaymentSuccess");
  safeStorage.remove("paymentFailed");
  safeStorage.remove("paymentFailureOrderId");
  if (!keepActualPaidAmount) {
    safeStorage.remove("actualPaidAmount");
  }

  if (!keepCheckoutBooking) {
    safeStorage.remove(CHECKOUT_BOOKING_KEY);
  }
};

export const getPendingOrderId = () => safeStorage.get(PENDING_ORDER_ID_KEY);

export const getPendingPayment = () => readJson(PENDING_PAYMENT_KEY);

export const hydratePendingPaymentFromOrder = (orderPayload, extras = {}) => {
  const normalized = normalizeOrderPaymentSession(orderPayload, extras);
  return persistPendingPayment(normalized, extras);
};

export const initializePendingOrderPayment = async (orderId, extras = {}) => {
  const initResponse = await initializePayment(orderId);
  const normalized = normalizeOrderPaymentSession(initResponse, { orderId, ...extras });
  if (!normalized?.payment?.razorpayOrderId || !normalized?.payment?.razorpayKeyId || !normalized?.payment?.amount) {
    throw new Error("Payment initialization response is missing required Razorpay session fields.");
  }
  const persisted = persistPendingPayment(normalized, { orderId, ...extras });
  return { ...normalized, persistedPayment: persisted };
};

export const getInitializePaymentErrorMessage = (error) => {
  const code = String(
    error?.response?.data?.code ||
    error?.response?.data?.errorCode ||
    ""
  ).trim().toUpperCase();
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to initialize payment right now.";

  if (code.includes("INVENTORY") || code.includes("UNAVAILABLE")) {
    return "This slot or room is no longer available. Please recheck availability.";
  }
  if (code.includes("HOLD") || /hold expired/i.test(message)) {
    return "Hold expired, recheck availability.";
  }
  return message;
};
