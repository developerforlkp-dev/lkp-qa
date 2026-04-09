"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { createEventOrder, getEventDetails } from '../../../utils/api';

const formatTimeLabel = (timeValue) => {
    if (!timeValue) return '';
    const [hoursRaw, minutesRaw = '00'] = String(timeValue).split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return String(timeValue);
    }

    const suffix = hours >= 12 ? 'PM' : 'AM';
    const normalizedHours = hours % 12 || 12;
    return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

const formatLongDate = (dateValue) => {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return dateValue;
    return parsed.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const getNumericPrice = (price) => {
    const num = parseFloat(price);
    return Number.isFinite(num) ? num : 0;
};

const asNumber = (value) => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : null;
};

const normalizeGuestSelection = (guests = {}) => ({
    adults: Math.max(0, Number(guests?.adults ?? 1) || 0),
    children: Math.max(0, Number(guests?.children ?? 0) || 0),
    infants: Math.max(0, Number(guests?.infants ?? 0) || 0),
    pets: Math.max(0, Number(guests?.pets ?? 0) || 0),
});

const parseBookingLimit = (...values) => {
    for (const value of values) {
        if (value === undefined || value === null || value === '') continue;
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value > 0 ? value : undefined;
        }

        if (typeof value === 'string') {
            const numericMatch = value.match(/\d+/);
            if (numericMatch) {
                const parsed = Number(numericMatch[0]);
                if (Number.isFinite(parsed) && parsed > 0) {
                    return parsed;
                }
            }
        }
    }

    return undefined;
};

const ScheduleGuestPicker = ({ visible, guests, maxGuests, onGuestChange, onClose }) => {
    const pickerRef = useRef(null);
    const normalizedGuests = normalizeGuestSelection(guests);
    const maxAllowed = parseBookingLimit(maxGuests);
    const totalGuests = normalizedGuests.adults + normalizedGuests.children;
    const guestCountLabel = totalGuests === 1 ? '1 guest' : `${totalGuests} guests`;

    useEffect(() => {
        if (!visible) return undefined;

        const handleDocumentMouseDown = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose?.();
            }
        };

        document.addEventListener('mousedown', handleDocumentMouseDown);
        return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
    }, [visible, onClose]);

    if (!visible) return null;

    const updateGuests = (updater) => {
        const nextGuests = normalizeGuestSelection(typeof updater === 'function' ? updater(normalizedGuests) : updater);
        onGuestChange?.(nextGuests);
    };

    const updateCategory = (type, delta) => {
        updateGuests((currentGuests) => {
            const nextGuests = { ...currentGuests };
            const currentValue = nextGuests[type] || 0;
            let nextValue = Math.max(0, currentValue + delta);

            if (type === 'adults') {
                const adultMin = currentGuests.infants > 0 ? 1 : 0;
                nextValue = Math.max(adultMin, nextValue);
                const nextTotal = nextValue + currentGuests.children;
                if (maxAllowed !== undefined && nextTotal > maxAllowed) {
                    nextValue = Math.max(adultMin, maxAllowed - currentGuests.children);
                }
                nextGuests.adults = nextValue;
                if (nextGuests.infants > nextValue) {
                    nextGuests.infants = nextValue;
                }
            } else if (type === 'children') {
                const nextTotal = currentGuests.adults + nextValue;
                if (maxAllowed !== undefined && nextTotal > maxAllowed) {
                    nextValue = Math.max(0, maxAllowed - currentGuests.adults);
                }
                nextGuests.children = nextValue;
            } else if (type === 'infants') {
                nextValue = Math.min(nextValue, currentGuests.adults);
                nextGuests.infants = nextValue;
            }

            return nextGuests;
        });
    };

    const categories = [
        {
            key: 'adults',
            label: 'Guests',
            subtitle: 'Age 13+',
            value: normalizedGuests.adults,
            min: normalizedGuests.infants > 0 ? 1 : 0,
            max: maxAllowed !== undefined ? Math.max(0, maxAllowed - normalizedGuests.children) : undefined,
        },
        {
            key: 'children',
            label: 'Children',
            subtitle: 'Ages 2-12',
            value: normalizedGuests.children,
            min: 0,
            max: maxAllowed !== undefined ? Math.max(0, maxAllowed - normalizedGuests.adults) : undefined,
        },
        {
            key: 'infants',
            label: 'Infants',
            subtitle: 'Under 2',
            value: normalizedGuests.infants,
            min: 0,
            max: normalizedGuests.adults,
        },
    ];

    return (
        <div
            ref={pickerRef}
            className="schedule-one__local-picker"
            onMouseDown={(event) => {
                event.stopPropagation();
            }}
        >
            <div className="schedule-one__local-picker-header">
                <div>
                    <div className="schedule-one__local-picker-label">GUESTS</div>
                    <div className="schedule-one__local-picker-value">{guestCountLabel}</div>
                </div>
                <button type="button" className="schedule-one__local-picker-collapse" onClick={onClose}>
                    <span className="icon-up-arrow"></span>
                </button>
            </div>
            <div className="schedule-one__local-picker-content">
                {categories.map((category) => {
                    const isMinusDisabled = category.value <= category.min;
                    const isPlusDisabled = category.max !== undefined && category.value >= category.max;

                    return (
                        <div key={category.key} className="schedule-one__local-picker-row">
                            <div className="schedule-one__local-picker-copy">
                                <div className="schedule-one__local-picker-row-title">{category.label}</div>
                                <div className="schedule-one__local-picker-row-subtitle">{category.subtitle}</div>
                            </div>
                            <div className="schedule-one__local-picker-controls">
                                <button
                                    type="button"
                                    className="schedule-one__local-picker-btn"
                                    disabled={isMinusDisabled}
                                    onClick={() => updateCategory(category.key, -1)}
                                >
                                    -
                                </button>
                                <span className="schedule-one__local-picker-count">{category.value}</span>
                                <button
                                    type="button"
                                    className="schedule-one__local-picker-btn"
                                    disabled={isPlusDisabled}
                                    onClick={() => updateCategory(category.key, 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="schedule-one__local-picker-footer">
                {maxAllowed !== undefined && (
                    <div className="schedule-one__local-picker-note">
                        This place has a maximum of {maxAllowed} guests, not including infants. Pets aren't allowed.
                    </div>
                )}
                <button type="button" className="schedule-one__local-picker-close" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

const getSlotIdentifier = (slot, fallbackIndex = '') => {
    if (slot && typeof slot === 'object') {
        return String(slot.slotId || slot.id || slot.eventSlotId || fallbackIndex);
    }

    if (typeof slot === 'number' || typeof slot === 'string') {
        return String(slot);
    }

    return String(fallbackIndex);
};

const ScheduleOne = () => {
    const history = useHistory();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const eventId = queryParams.get('id') || '3';

    const [ticketTypes, setTicketTypes] = useState([]);
    const [eventInfo, setEventInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');
    const [openGuestPickerFor, setOpenGuestPickerFor] = useState(null);
    const [readyToConfirmFor, setReadyToConfirmFor] = useState(null);
    const [bookingTicketKey, setBookingTicketKey] = useState(null);
    const [selectedGuestsByTicket, setSelectedGuestsByTicket] = useState({});

    useEffect(() => {
        let mounted = true;

        const fetchEventData = async () => {
            try {
                const data = await getEventDetails(eventId);
                if (!mounted) return;
                setEventInfo(data);
                setTicketTypes(Array.isArray(data?.ticketTypes) ? data.ticketTypes : []);
            } catch (err) {
                console.error('Failed to fetch event for schedule:', err);
                if (mounted) {
                    setTicketTypes([]);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchEventData();
        return () => {
            mounted = false;
        };
    }, [eventId]);

    const getSlotSource = (ticket) => {
        if (Array.isArray(ticket?.applicableSlots) && ticket.applicableSlots.length > 0) {
            return ticket.applicableSlots;
        }

        const eventSlots = Array.isArray(eventInfo?.slots) ? eventInfo.slots : [];
        const ticketSlotIds = new Set(
            [
                ...(Array.isArray(ticket?.slotIds) ? ticket.slotIds : []),
                ...(Array.isArray(ticket?.slots) ? ticket.slots : []),
            ]
                .map((slot, index) => getSlotIdentifier(slot, index))
                .filter(Boolean)
        );

        if (ticketSlotIds.size > 0 && eventSlots.length > 0) {
            return eventSlots.filter((slot, index) => ticketSlotIds.has(getSlotIdentifier(slot, index)));
        }

        if (Array.isArray(ticket?.slots) && ticket.slots.length > 0) {
            return ticket.slots;
        }

        if (eventSlots.length > 0) {
            return eventSlots;
        }

        return [];
    };

    const getAvailableSlots = (ticket) => {
        const slotSource = getSlotSource(ticket);

        if (slotSource.length > 0) {
            return slotSource
                .map((slot) => {
                    if (typeof slot === 'number') return slot;
                    if (typeof slot === 'string') {
                        const parsed = Number(slot);
                        return Number.isFinite(parsed) ? parsed : null;
                    }
                    if (slot && typeof slot === 'object') {
                        return (
                            slot.availableTickets ??
                            slot.available_slots ??
                            slot.availableSlots ??
                            slot.remainingTickets ??
                            slot.remainingCapacity ??
                            slot.capacity ??
                            slot.totalTickets ??
                            null
                        );
                    }
                    return null;
                })
                .filter((count) => count != null);
        }

        if (ticket?.totalTickets != null) {
            return [ticket.totalTickets];
        }

        return [];
    };

    const getSlotDetails = (ticket) => {
        return getSlotSource(ticket)
            .map((slot, index) => {
                if (!slot || typeof slot !== 'object') {
                    if (typeof slot === 'string' && Number.isNaN(Number(slot))) {
                        return {
                            id: `slot-${index}`,
                            name: slot,
                            timeLabel: '',
                            dateValue: null,
                        };
                    }
                    return null;
                }

                const startTime = slot.startTime || slot.slotStartTime || slot.time || '';
                const endTime = slot.endTime || slot.slotEndTime || '';

                return {
                    id: String(slot.slotId || slot.id || slot.eventSlotId || index),
                    name: slot.slotName || slot.name || slot.title || slot.slot_name || slot.label || `Slot ${index + 1}`,
                    timeLabel: [formatTimeLabel(startTime), formatTimeLabel(endTime)].filter(Boolean).join(' - '),
                    dateValue: slot.slotStartDate || slot.slotDate || slot.date || slot.eventDate || null,
                };
            })
            .filter(Boolean);
    };

    const getTicketKey = (ticket, index) => String(ticket?.ticketTypeId || ticket?.id || ticket?.name || index);

    const getCustomerDetailsForBooking = () => {
        const userInfoRaw = localStorage.getItem('userInfo');
        const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : {};

        return {
            firstName: userInfo?.firstName || localStorage.getItem('firstName') || '',
            lastName: userInfo?.lastName || localStorage.getItem('lastName') || '',
            email: userInfo?.email || localStorage.getItem('email') || '',
            phone:
                userInfo?.customerPhone ||
                userInfo?.phoneNumber ||
                userInfo?.phone ||
                localStorage.getItem('phone') ||
                localStorage.getItem('phoneNumber') ||
                '',
        };
    };

    const hasValidJwtToken = () => {
        const raw = localStorage.getItem('jwtToken');
        const token = typeof raw === 'string' ? raw.trim() : '';
        return !!token && token !== 'undefined' && token !== 'null' && token !== 'NaN';
    };

    const formatPrice = (price) => {
        if (price == null || price === '') return null;
        const num = parseFloat(price);
        if (Number.isNaN(num)) return price;
        return `₹${num.toLocaleString('en-IN')}`;
    };

    const scheduleTabs = useMemo(() => {
        const uniqueDates = [];
        const seenDates = new Set();

        const addDate = (dateValue) => {
            if (!dateValue || seenDates.has(dateValue)) return;
            seenDates.add(dateValue);
            uniqueDates.push(dateValue);
        };

        const startDate = eventInfo?.startDate;
        const endDate = eventInfo?.endDate || eventInfo?.startDate;

        if (startDate) {
            const current = new Date(startDate);
            const end = new Date(endDate);
            if (!Number.isNaN(current.getTime()) && !Number.isNaN(end.getTime())) {
                while (current <= end) {
                    addDate(current.toISOString().slice(0, 10));
                    current.setDate(current.getDate() + 1);
                }
            } else {
                addDate(startDate);
            }
        }

        const slotSource = [
            ...(Array.isArray(eventInfo?.slots) ? eventInfo.slots : []),
            ...ticketTypes.flatMap((ticket) => (Array.isArray(ticket?.applicableSlots) ? ticket.applicableSlots : [])),
        ];

        slotSource.forEach((slot) => {
            if (slot && typeof slot === 'object') {
                addDate(slot.slotStartDate || slot.slotDate || slot.date || slot.eventDate);
            }
        });

        return uniqueDates.map((dateValue, index) => ({
            id: `day-${index + 1}`,
            title: `Day ${String(index + 1).padStart(2, '0')}`,
            dateValue,
            label: formatLongDate(dateValue),
        }));
    }, [eventInfo, ticketTypes]);

    useEffect(() => {
        if (scheduleTabs.length > 0 && !scheduleTabs.some((tab) => tab.id === activeTab)) {
            setActiveTab(scheduleTabs[0].id);
        }
    }, [activeTab, scheduleTabs]);

    const activeScheduleTab = scheduleTabs.find((tab) => tab.id === activeTab) || scheduleTabs[0] || null;

    const getGuestsForTicket = (ticketKey) => {
        return normalizeGuestSelection(selectedGuestsByTicket[ticketKey] || {
            adults: 1,
            children: 0,
            infants: 0,
            pets: 0,
        });
    };

    const handleScheduleBooking = async (ticket, slotDetail, bookingDate, ticketKey) => {
        const selectedGuests = getGuestsForTicket(ticketKey);
        const totalGuests = selectedGuests.adults + selectedGuests.children;
        if (totalGuests < 1 || bookingTicketKey) return;

        if (!hasValidJwtToken()) {
            alert('Please log in to continue with booking.');
            return;
        }

        const eventIdNum = asNumber(eventInfo?.eventId ?? eventInfo?.event_id ?? eventInfo?.id ?? eventId) ?? 0;
        const eventSlotIdNum = asNumber(slotDetail?.id);
        const ticketTypeId = asNumber(ticket?.ticketTypeId ?? ticket?.ticket_type_id ?? ticket?.typeId ?? ticket?.id) ?? 0;
        const quantity = totalGuests;
        const pricePerTicket = getNumericPrice(ticket?.price);
        const ticketTypeName = ticket?.name || ticket?.ticketTypeName || 'General Admission';
        const customerDetails = getCustomerDetailsForBooking();

        if (!eventSlotIdNum || eventSlotIdNum <= 0) {
            alert('Unable to continue: no valid slot is available for this ticket on the selected day.');
            return;
        }

        const payload = {
            eventId: eventIdNum,
            eventSlotId: eventSlotIdNum,
            bookingDate: bookingDate || eventInfo?.startDate,
            numberOfGuests: quantity,
            customerDetails,
            tickets: [
                {
                    ticketTypeId,
                    ticketTypeName,
                    quantity,
                    pricePerTicket: Number(pricePerTicket.toFixed(2)),
                },
            ],
            appliedDiscountCode: null,
            notes: null,
        };

        try {
            setBookingTicketKey(ticketKey);

            const res = await createEventOrder(payload);
            const order = res?.order || res;
            const payment =
                res?.payment ||
                res?.data?.payment ||
                res?.order?.payment ||
                order?.payment ||
                null;

            const orderId = order?.orderId || order?.id || res?.orderId || res?.id;
            const razorpayOrderId =
                payment?.razorpayOrderId ||
                order?.razorpayOrderId ||
                res?.razorpayOrderId ||
                order?.razorpay_order_id ||
                res?.razorpay_order_id;
            const razorpayKeyId =
                payment?.razorpayKeyId ||
                payment?.razorpay_key_id ||
                payment?.keyId ||
                order?.razorpayKeyId ||
                res?.razorpayKeyId ||
                order?.razorpay_key_id ||
                res?.razorpay_key_id ||
                order?.razorpayKey ||
                res?.razorpayKey ||
                order?.keyId ||
                res?.keyId ||
                process.env.REACT_APP_RAZORPAY_KEY_ID ||
                localStorage.getItem('lastRazorpayKeyId') ||
                'rzp_test_RaBjdu0Ed3p1gN';

            if (!orderId || !razorpayOrderId || !razorpayKeyId) {
                throw new Error('Missing payment information from event order response.');
            }

            localStorage.setItem('lastRazorpayKeyId', razorpayKeyId);

            const currency = payment?.currency || eventInfo?.currency || 'INR';
            const totalAmount = quantity * pricePerTicket;
            const amountInPaise = payment?.amount || Math.round(totalAmount * 100);

            const bookingDataForCheckout = {
                eventId: eventIdNum,
                eventSlotId: eventSlotIdNum,
                listingTitle: eventInfo?.title || 'Event Booking',
                listingImage: eventInfo?.coverImageUrl || eventInfo?.coverImage || eventInfo?.gallery?.[0] || null,
                returnTo: `${location.pathname}${location.search}`,
                bookingSummary: {
                    date: formatLongDate(bookingDate || eventInfo?.startDate),
                    time: slotDetail?.timeLabel || formatTimeLabel(eventInfo?.startTime),
                    guestCount: quantity,
                },
                guests: selectedGuests,
                priceDetails: {
                    pricePerPerson: pricePerTicket,
                    totalPrice: totalAmount,
                },
                receipt: [
                    {
                        title: `${currency} ${pricePerTicket.toFixed(2)} x ${quantity} ${quantity === 1 ? 'ticket' : 'tickets'}`,
                        content: `${currency} ${totalAmount.toFixed(2)}`,
                    },
                    {
                        title: 'Total',
                        content: `${currency} ${totalAmount.toFixed(2)}`,
                    },
                ],
                currency,
                finalTotal: totalAmount,
                ticketType: ticketTypeName,
                ticketTypeId,
            };

            const paymentData = {
                orderId,
                razorpayOrderId,
                razorpayKeyId,
                amount: amountInPaise,
                currency,
                paymentMethod: 'razorpay',
                eventId: eventIdNum,
                eventSlotId: eventSlotIdNum,
                discount: payment?.discount || res?.discount || 0,
                finalAmount: payment?.finalAmount || amountInPaise,
            };

            localStorage.setItem('pendingBooking', JSON.stringify(bookingDataForCheckout));
            localStorage.setItem('pendingPayment', JSON.stringify(paymentData));
            localStorage.setItem('pendingOrderId', String(orderId));
            localStorage.removeItem('razorpayPaymentSuccess');
            localStorage.removeItem('paymentFailed');

            history.replace('/experience-checkout', {
                bookingData: bookingDataForCheckout,
                paymentData,
            });
        } catch (error) {
            console.error('Failed to create event order from schedule:', error?.response?.data || error?.message || error);
            alert(error?.response?.data?.message || error?.response?.data?.error || 'Unable to continue to payment. Please try again.');
        } finally {
            setBookingTicketKey(null);
        }
    };

    return (
        <section id="th-event" className="schedule-one">
            <div className="container">
                <div className="schedule-one__inner">
                    <div className="schedule-one__top">
                        <div className="section-title text-left">
                            <div className="section-title__tagline-box">
                                <span className="section-title__tagline">Event Schedule</span>
                            </div>
                            <h2 className="section-title__title">Follow event schedule</h2>
                        </div>

                        {scheduleTabs.length > 0 && (
                            <div className="schedule-one__main-tab-box schedule-one__main-tab-box--top tabs-box">
                                <ul className="tab-buttons schedule-one__tab-buttons--scroll clearfix list-unstyled">
                                    {scheduleTabs.map((tab) => (
                                        <li
                                            key={tab.id}
                                            className={`tab-btn ${activeTab === tab.id ? 'active-btn' : ''}`}
                                            onClick={() => setActiveTab(tab.id)}
                                        >
                                            <h3>{tab.title}</h3>
                                            <p>{tab.label}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <p style={{ color: '#aaa', padding: '20px 0' }}>Loading ticket types...</p>
                    ) : ticketTypes.length === 0 ? (
                        <p style={{ color: '#aaa', padding: '20px 0' }}>No ticket types available.</p>
                    ) : (
                        <div className="schedule-one__main-tab-box tabs-box">
                            <div className="tabs-content">
                                {(scheduleTabs.length > 0 ? scheduleTabs : [{ id: 'default-day', dateValue: eventInfo?.startDate, label: eventInfo?.startDate }]).map((tab) => (
                                    <div
                                        key={tab.id}
                                        className={`tab ${activeTab === tab.id || (!activeTab && tab.id === 'default-day') ? 'active-tab' : ''}`}
                                        id={tab.id}
                                    >
                                        <div className="schedule-one__tab-content-box">
                                            {ticketTypes.map((ticket, index) => {
                                                const ticketKey = getTicketKey(ticket, index);
                                                const selectedGuests = getGuestsForTicket(ticketKey);
                                                const totalGuests = selectedGuests.adults + selectedGuests.children;
                                                const guestCountLabel = totalGuests === 1 ? '1 guest' : `${totalGuests} guests`;
                                                const guestLimit = parseBookingLimit(
                                                    ticket?.maxPerBooking,
                                                    ticket?.max_per_booking,
                                                    ticket?.maxGuests,
                                                    eventInfo?.totalCapacity
                                                );
                                                const unitPrice = getNumericPrice(ticket?.price);
                                                const totalPrice = Math.max(1, totalGuests) * unitPrice;
                                                const price = formatPrice(totalPrice);
                                                const perGuestPrice = formatPrice(unitPrice);
                                                const isPickerOpen = openGuestPickerFor === ticketKey;
                                                const isReadyToConfirm = readyToConfirmFor === ticketKey;
                                                const isBookingCurrentTicket = bookingTicketKey === ticketKey;
                                                const slotDetails = getSlotDetails(ticket);
                                                const availableSlots = getAvailableSlots(ticket);
                                                const selectedDateValue = tab.dateValue || activeScheduleTab?.dateValue || eventInfo?.startDate;
                                                const filteredSlotDetails = slotDetails.filter((slot) => {
                                                    if (!selectedDateValue) return true;
                                                    return !slot.dateValue || slot.dateValue === selectedDateValue;
                                                });

                                                if (slotDetails.length > 0 && filteredSlotDetails.length === 0) {
                                                    return null;
                                                }

                                                const visibleSlotDetails = filteredSlotDetails;
                                                const slotSummary = visibleSlotDetails.length > 0
                                                    ? visibleSlotDetails
                                                        .map((slot) => (slot.timeLabel ? `${slot.name} (${slot.timeLabel})` : slot.name))
                                                        .join(', ')
                                                    : 'Slots unavailable';
                                                const primarySlotTime = visibleSlotDetails[0]?.timeLabel || formatTimeLabel(eventInfo?.startTime);
                                                const displayDate = selectedDateValue;

                                                return (
                                                    <div
                                                        className={`schedule-one__single${isPickerOpen ? ' schedule-one__single--active' : ''}`}
                                                        key={ticketKey}
                                                    >
                                                        <div className="schedule-one__left">
                                                            <h3 className="schedule-one__title">
                                                                <strong>{ticket?.name}</strong>
                                                            </h3>
                                                            <p className="schedule-one__text">
                                                                {price && (
                                                                    <span style={{ fontWeight: 700, color: '#fff', display: 'block', marginBottom: 4 }}>
                                                                        {price}
                                                                    </span>
                                                                )}
                                                                {perGuestPrice && (
                                                                    <span style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 2 }}>
                                                                        {perGuestPrice} per guest
                                                                    </span>
                                                                )}
                                                                <span style={{ display: 'block', fontSize: 13, color: ticket?.isActive ? '#a0e0a0' : '#e09090' }}>
                                                                    {ticket?.isActive ? '● Active' : '● Inactive'}
                                                                </span>
                                                                <span style={{ display: 'block', marginTop: 6, color: '#ccc' }}>
                                                                    {availableSlots.length > 0
                                                                        ? availableSlots.length === 1
                                                                            ? `${availableSlots[0]} slots available`
                                                                            : availableSlots.map((slot, slotIndex) => `Slot ${slotIndex + 1}: ${slot} available`).join(' · ')
                                                                        : 'Slots unavailable'}
                                                                </span>
                                                                {visibleSlotDetails.length > 0 && (
                                                                    <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: '#aaa' }}>
                                                                        Slots: {slotSummary}
                                                                    </span>
                                                                )}
                                                                <span className={`schedule-one__guest-count${isReadyToConfirm ? ' schedule-one__guest-count--active' : ''}`}>
                                                                    Guests: {guestCountLabel}
                                                                </span>
                                                                {guestLimit && (
                                                                    <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: '#aaa' }}>
                                                                        Max {guestLimit} per booking
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="schedule-one__address-and-btn-box">
                                                            <ul className="list-unstyled schedule-one__address">
                                                                {displayDate && (
                                                                    <li>
                                                                        <div className="icon">
                                                                            <span className="icon-clock"></span>
                                                                        </div>
                                                                        <div className="text">
                                                                            <p>{primarySlotTime ? `${primarySlotTime} · ${displayDate}` : displayDate}</p>
                                                                        </div>
                                                                    </li>
                                                                )}
                                                                {eventInfo?.venueFullAddress && (
                                                                    <li>
                                                                        <div className="icon">
                                                                            <span className="icon-pin"></span>
                                                                        </div>
                                                                        <div className="text">
                                                                            <p>{eventInfo.venueFullAddress}</p>
                                                                        </div>
                                                                    </li>
                                                                )}
                                                            </ul>
                                                            <div className="schedule-one__btn-box">
                                                                <button
                                                                    type="button"
                                                                    className="schedule-one__guest-selector"
                                                                    onClick={() => {
                                                                        setReadyToConfirmFor(ticketKey);
                                                                        setOpenGuestPickerFor(ticketKey);
                                                                    }}
                                                                >
                                                                    <span className="schedule-one__guest-selector-label">Guests</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="schedule-one__btn thm-btn schedule-one__book-trigger"
                                                                    onMouseDown={(event) => {
                                                                        event.stopPropagation();
                                                                    }}
                                                                    onClick={() => {
                                                                        if (isReadyToConfirm) {
                                                                            handleScheduleBooking(ticket, visibleSlotDetails[0], displayDate, ticketKey);
                                                                            return;
                                                                        }
                                                                        setReadyToConfirmFor(ticketKey);
                                                                        setOpenGuestPickerFor(ticketKey);
                                                                    }}
                                                                    disabled={isBookingCurrentTicket}
                                                                >
                                                                    {isBookingCurrentTicket ? 'Processing...' : isReadyToConfirm ? 'Confirm' : 'Buy Ticket'}
                                                                    <span className="icon-arrow-right"></span>
                                                                </button>
                                                                {isPickerOpen && (
                                                                    <div
                                                                        className="schedule-one__guest-picker-wrap"
                                                                        onMouseDown={(event) => {
                                                                            event.stopPropagation();
                                                                        }}
                                                                    >
                                                                        <ScheduleGuestPicker
                                                                            visible={true}
                                                                            guests={selectedGuests}
                                                                            maxGuests={guestLimit}
                                                                            onClose={() => setOpenGuestPickerFor(null)}
                                                                            onGuestChange={(guestData) => {
                                                                                const normalizedGuests = normalizeGuestSelection(guestData);
                                                                                setSelectedGuestsByTicket((prev) => ({
                                                                                    ...prev,
                                                                                    [ticketKey]: normalizedGuests,
                                                                                }));
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {readyToConfirmFor && (() => {
                        const readyGuests = getGuestsForTicket(readyToConfirmFor);
                        const readyGuestTotal = readyGuests.adults + readyGuests.children;
                        return readyGuestTotal < 1;
                    })() && (
                        <div className="schedule-one__selection-note">Please select at least 1 guest to continue.</div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ScheduleOne;
