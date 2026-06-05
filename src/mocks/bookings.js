export const bookingsByStatus = {
  upcoming: [
    {
      id: "bk-up-001",
      title: "Aurora Ridge Eco Lodge",
      type: "Experience",
      category: "Glamping retreat",
      location: "Wanaka, New Zealand",
      startDate: "Fri, 21 Nov 2025",
      endDate: "Mon, 24 Nov 2025",
      status: "Upcoming",
      statusTone: "upcoming",
      thumbnail: {
        src: "",
        srcSet: "",
        alt: "",
      },
    },
    {
      id: "bk-up-002",
      title: "Santorini Sunset Sailing",
      type: "Experience",
      category: "Catamaran cruise",
      location: "Santorini, Greece",
      startDate: "Thu, 05 Dec 2025",
      endDate: "Thu, 05 Dec 2025",
      status: "Upcoming",
      statusTone: "upcoming",
      thumbnail: {
        src: "",
        srcSet: "",
        alt: "",
      },
    },
    {
      id: "bk-up-003",
      title: "Aurora Borealis Photography Hike",
      type: "Experience",
      category: "Guided night tour",
      location: "Tromsø, Norway",
      startDate: "Sat, 11 Jan 2026",
      endDate: "Sat, 11 Jan 2026",
      status: "Upcoming",
      statusTone: "upcoming",
      thumbnail: {
        src: "",
        srcSet: "",
        alt: "",
      },
    },
  ],
  completed: [
    {
      id: "bk-co-001",
      title: "Lisbon Chef-Led Food Walk",
      type: "Experience",
      category: "Culinary discovery",
      location: "Lisbon, Portugal",
      startDate: "Sat, 21 Sep 2025",
      endDate: "Sat, 21 Sep 2025",
      status: "Completed",
      statusTone: "completed",
      thumbnail: {
        src: "",
        srcSet: "",
        alt: "",
      },
    },
    {
      id: "bk-co-002",
      title: "Skyline Loft Weekender",
      type: "Experience",
      category: "City boutique experience",
      location: "Barcelona, Spain",
      startDate: "Fri, 12 Jul 2025",
      endDate: "Mon, 15 Jul 2025",
      status: "Completed",
      statusTone: "completed",
      thumbnail: {
        src: "",
        srcSet: "",
        alt: "",
      },
    },
  ],
  cancelled: [
    {
      id: "bk-ca-001",
      title: "Desert Stargazing Camp",
      type: "Experience",
      category: "Overnight desert camp",
      location: "Wadi Rum, Jordan",
      startDate: "Wed, 17 Apr 2025",
      endDate: "Thu, 18 Apr 2025",
      status: "Cancelled",
      statusTone: "cancelled",
      thumbnail: {
        src: "",
        srcSet: "",
        alt: "",
      },
    },
    {
      id: "bk-ca-002",
      title: "Coastal Kayak Expedition",
      type: "Experience",
      category: "Guided sea kayaking",
      location: "Big Sur, United States",
      startDate: "Sun, 02 Mar 2025",
      endDate: "Sun, 02 Mar 2025",
      status: "Cancelled",
      statusTone: "cancelled",
      thumbnail: {
        src: "",
        srcSet: "",
        alt: "",
      },
    },
  ],
};

export const emptyStateCopy = {
  upcoming: {
    title: "You have no upcoming adventures",
    description:
      "Ready for your next journey? Save an experience and it will show up here the moment you confirm.",
    illustration: "",
    illustrationSet: "",
    illustrationAlt: "",
  },
  completed: {
    title: "Nothing completed yet",
    description:
      "Once you wrap an experience, you'll find receipts, highlights, and rebooking options in this tab.",
    illustration: "",
    illustrationSet: "",
    illustrationAlt: "",
  },
  cancelled: {
    title: "No cancelled bookings",
    description:
      "Great news—everything is on track. If plans change, you can review cancellation details right here.",
    illustration: "",
    illustrationSet: "",
    illustrationAlt: "",
  },
};

const bookingDetails = {
  "bk-up-001": {
    title: "Aurora Ridge Eco Lodge",
    bookingId: "LKP-2025-11-21-001",
    status: "Upcoming",
    startDate: "Fri, 21 Nov 2025",
    endDate: "Mon, 24 Nov 2025",
    guestCount: 2,
    bannerImage: {
      src: "",
      srcSet: "",
      alt: "",
    },
    location: {
      address: "142 Mountain View Road",
      city: "Wanaka",
      country: "New Zealand",
      mapImage: "",
      directionsUrl: "https://maps.google.com/?q=Wanaka+New+Zealand",
    },
    guest: {
      name: "Sarah Johnson",
      phone: "+1 (555) 123-4567",
      email: "sarah.johnson@example.com",
    },
    pricing: {
      basePrice: "$600",
      serviceFee: "$48",
      taxes: "$72",
      total: "$720",
    },
    paymentMethod: "Visa ending in 4242",
    notes: {
      cancellationPolicy: [
        "Free cancellation up to 7 days before check-in",
        "50% refund if cancelled 3-7 days before check-in",
        "No refund if cancelled less than 3 days before check-in",
      ],
      hostInstructions: [
        "Check-in time is 3:00 PM. Early check-in may be available upon request",
        "Key will be available in the lockbox. Code will be sent 24 hours before arrival",
        "Please respect the quiet hours from 10 PM to 7 AM",
        "Parking is available on-site for one vehicle",
      ],
      requirements: [
        "Valid government-issued ID required at check-in",
        "No smoking or pets allowed",
        "Maximum occupancy: 2 guests",
      ],
    },
  },
  "bk-up-002": {
    title: "Santorini Sunset Sailing",
    bookingId: "LKP-2025-12-05-002",
    status: "Upcoming",
    startDate: "Thu, 05 Dec 2025",
    endDate: "Thu, 05 Dec 2025",
    guestCount: 4,
    bannerImage: {
      src: "",
      srcSet: "",
      alt: "",
    },
    location: {
      address: "Old Port of Fira",
      city: "Santorini",
      country: "Greece",
      mapImage: "",
      directionsUrl: "https://maps.google.com/?q=Santorini+Greece",
    },
    guest: {
      name: "Sarah Johnson",
      phone: "+1 (555) 123-4567",
      email: "sarah.johnson@example.com",
    },
    pricing: {
      basePrice: "$320",
      serviceFee: "$26",
      taxes: "$38",
      total: "$384",
    },
    paymentMethod: "Visa ending in 4242",
    notes: {
      cancellationPolicy: [
        "Free cancellation up to 48 hours before the experience",
        "50% refund if cancelled 24-48 hours before",
        "No refund if cancelled less than 24 hours before",
      ],
      hostInstructions: [
        "Meet at the Old Port of Fira at 4:30 PM sharp",
        "Please arrive 15 minutes early for safety briefing",
        "Bring sunscreen, hat, and camera",
        "Snorkeling equipment will be provided",
      ],
      requirements: [
        "Minimum age: 12 years",
        "Swimming ability required",
        "Maximum 12 guests per sailing",
      ],
    },
  },
  "bk-up-003": {
    title: "Aurora Borealis Photography Hike",
    bookingId: "LKP-2026-01-11-003",
    status: "Upcoming",
    startDate: "Sat, 11 Jan 2026",
    endDate: "Sat, 11 Jan 2026",
    guestCount: 3,
    bannerImage: {
      src: "",
      srcSet: "",
      alt: "",
    },
    location: {
      address: "Tromsø Wilderness Center",
      city: "Tromsø",
      country: "Norway",
      mapImage: "",
      directionsUrl: "https://maps.google.com/?q=Tromsø+Norway",
    },
    guest: {
      name: "Sarah Johnson",
      phone: "+1 (555) 123-4567",
      email: "sarah.johnson@example.com",
    },
    pricing: {
      basePrice: "$450",
      serviceFee: "$36",
      taxes: "$54",
      total: "$540",
    },
    paymentMethod: "Visa ending in 4242",
    notes: {
      cancellationPolicy: [
        "Free cancellation up to 14 days before the experience",
        "50% refund if cancelled 7-14 days before",
        "No refund if cancelled less than 7 days before",
      ],
      hostInstructions: [
        "Meet at Tromsø Wilderness Center at 7:15 PM",
        "Winter gear will be provided (warm clothing, boots, gloves)",
        "Bring your camera and tripod if you have one",
        "Hot beverages and snacks included",
      ],
      requirements: [
        "Good physical fitness required",
        "Minimum age: 16 years",
        "Dress in warm layers",
      ],
    },
  },
  "bk-co-001": {
    title: "Lisbon Chef-Led Food Walk",
    bookingId: "LKP-2025-09-21-004",
    status: "Completed",
    startDate: "Sat, 21 Sep 2025",
    endDate: "Sat, 21 Sep 2025",
    guestCount: 2,
    bannerImage: {
      src: "",
      srcSet: "",
      alt: "",
    },
    location: {
      address: "Praça do Comércio",
      city: "Lisbon",
      country: "Portugal",
      mapImage: "",
      directionsUrl: "https://maps.google.com/?q=Lisbon+Portugal",
    },
    guest: {
      name: "Sarah Johnson",
      phone: "+1 (555) 123-4567",
      email: "sarah.johnson@example.com",
    },
    pricing: {
      basePrice: "$180",
      serviceFee: "$14",
      taxes: "$22",
      total: "$216",
    },
    paymentMethod: "Visa ending in 4242",
    notes: {
      cancellationPolicy: [
        "Free cancellation up to 48 hours before the experience",
      ],
      hostInstructions: [
        "Meet at Praça do Comércio at 10:00 AM",
        "Tour duration: 4 hours",
        "Includes 6 tasting stops",
      ],
      requirements: [
        "Comfortable walking shoes required",
        "Dietary restrictions must be communicated in advance",
      ],
    },
  },
  "bk-co-002": {
    title: "Skyline Loft Weekender",
    bookingId: "LKP-2025-07-12-005",
    status: "Completed",
    startDate: "Fri, 12 Jul 2025",
    endDate: "Mon, 15 Jul 2025",
    guestCount: 2,
    bannerImage: {
      src: "",
      srcSet: "",
      alt: "",
    },
    location: {
      address: "Carrer de la Marina, 245",
      city: "Barcelona",
      country: "Spain",
      mapImage: "",
      directionsUrl: "https://maps.google.com/?q=Barcelona+Spain",
    },
    guest: {
      name: "Sarah Johnson",
      phone: "+1 (555) 123-4567",
      email: "sarah.johnson@example.com",
    },
    pricing: {
      basePrice: "$480",
      serviceFee: "$38",
      taxes: "$58",
      total: "$576",
    },
    paymentMethod: "Visa ending in 4242",
    notes: {
      cancellationPolicy: [
        "Free cancellation up to 7 days before check-in",
      ],
      hostInstructions: [
        "Check-in: 3:00 PM, Check-out: 11:00 AM",
        "Late checkout applied until 1:00 PM",
        "Rooftop access available 24/7",
      ],
      requirements: [
        "Valid ID required",
        "No parties or events",
      ],
    },
  },
  "bk-ca-001": {
    title: "Desert Stargazing Camp",
    bookingId: "LKP-2025-04-17-006",
    status: "Cancelled",
    startDate: "Wed, 17 Apr 2025",
    endDate: "Thu, 18 Apr 2025",
    guestCount: 4,
    bannerImage: {
      src: "",
      srcSet: "",
      alt: "",
    },
    location: {
      address: "Wadi Rum Protected Area",
      city: "Wadi Rum",
      country: "Jordan",
      mapImage: "",
      directionsUrl: "https://maps.google.com/?q=Wadi+Rum+Jordan",
    },
    guest: {
      name: "Sarah Johnson",
      phone: "+1 (555) 123-4567",
      email: "sarah.johnson@example.com",
    },
    pricing: {
      basePrice: "$280",
      serviceFee: "$22",
      taxes: "$34",
      total: "$336",
    },
    paymentMethod: "Visa ending in 4242",
    notes: {
      cancellationPolicy: [
        "Cancelled 48 hours before check-in",
        "Full refund processed to original payment method",
      ],
      hostInstructions: [],
      requirements: [],
    },
  },
  "bk-ca-002": {
    title: "Coastal Kayak Expedition",
    bookingId: "LKP-2025-03-02-007",
    status: "Cancelled",
    startDate: "Sun, 02 Mar 2025",
    endDate: "Sun, 02 Mar 2025",
    guestCount: 2,
    bannerImage: {
      src: "",
      srcSet: "",
      alt: "",
    },
    location: {
      address: "Big Sur State Park",
      city: "Big Sur",
      country: "United States",
      mapImage: "",
      directionsUrl: "https://maps.google.com/?q=Big+Sur+United+States",
    },
    guest: {
      name: "Sarah Johnson",
      phone: "+1 (555) 123-4567",
      email: "sarah.johnson@example.com",
    },
    pricing: {
      basePrice: "$160",
      serviceFee: "$13",
      taxes: "$19",
      total: "$192",
    },
    paymentMethod: "Visa ending in 4242",
    notes: {
      cancellationPolicy: [
        "Cancelled due to weather conditions",
        "Weather credit issued for future booking",
        "Credit valid for 12 months",
      ],
      hostInstructions: [],
      requirements: [],
    },
  },
};

export const getBookingDetails = (bookingId) => {
  return bookingDetails[bookingId] || null;
};



