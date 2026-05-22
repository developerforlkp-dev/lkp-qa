import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ChevronDown, ArrowUp, Maximize2, Minimize2 } from "lucide-react";
import Page from "../../components/Page";

const accordionData = [
  {
    title: "Basic Terminology",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet ("Little Known Planet") is a travel and lifestyle platform that provides Experiences, Events, Stays, Food Services, and Place Discoveries through our website, mobile application, social media pages, third-party booking channels, travel partners, advertisements, referrals, and other communication platforms (collectively referred to as the "Platform").</p>
        <p>These Terms & Conditions are applicable to all users, guests, customers, partners, organizers, vendors, and visitors who access, browse, register, make bookings, purchase services, or use the Platform in any manner.</p>
        <p>Users are advised to carefully read and understand these Terms & Conditions before using the Platform or making any booking through Little Known Planet. By accessing or using the Platform, the User agrees to comply with and be bound by these Terms & Conditions.</p>
        <p>Little Known Planet reserves the right to modify, update, revise, or change these Terms & Conditions at any time without prior notice. Updated Terms shall become effective immediately upon being published on the Platform. Continued use of the Platform after such updates shall constitute acceptance of the revised Terms.</p>
        <p>For the purpose of online as well as offline bookings and usage of services through Little Known Planet, the following terms shall have the meanings assigned below:</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Platform</strong><br/>"Platform" shall mean the Little Known Planet website, mobile application, social media pages, third-party platforms, advertisements, booking channels, partner platforms, and all online or offline mediums through which services are offered.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Services</strong><br/>"Services" shall mean and include Experiences, Events, Stay bookings, Food & Dining services, Place recommendations, tours, activities, workshops, cultural programs, and other offerings available through the Platform.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Experience/Experiences</strong><br/>"Experience/Experiences" means adventure activities, guided tours, local activities, wellness sessions, workshops, cultural activities, nature experiences, and activity-based services listed on the Platform.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Event/Events</strong><br/>"Event/Events" means concerts, festivals, exhibitions, performances, gatherings, meetups, shows, entertainment programs, and ticketed or non-ticketed events listed on the Platform.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Stay/Stays</strong><br/>"Stay/Stays" shall mean hotels, resorts, villas, cottages, homestays, apartments, hostels, serviced accommodations, camp stays, and/or their rooms available for booking through the Platform.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Food Services</strong><br/>"Food Services" means restaurants, cafes, food experiences, reservations, dining offers, culinary activities, and food-related services listed on the Platform.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Place/Places</strong><br/>"Place/Places" means destinations, tourist attractions, landmarks, hidden gems, travel spots, recreational locations, and place-based listings displayed on the Platform.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>User/Users</strong><br/>"User/Users" refers to any individual, company, organization, or entity accessing, browsing, registering, booking, purchasing, or using the Platform or Services. Users may also be referred to as "you", "your", or "guest".</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Partner/Partners</strong><br/>"Partner/Partners" means hosts, organizers, vendors, restaurants, property owners, activity providers, tour guides, event managers, or third-party service providers associated with Little Known Planet.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Booking</strong><br/>"Booking" means any reservation, registration, confirmation, or purchase made by a User for any Service available on the Platform.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Booking Amount</strong><br/>"Booking Amount" shall mean the total amount payable by the User for confirming a Booking including taxes, convenience fees, service charges, deposits, and additional charges wherever applicable.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Booking Confirmation</strong><br/>"Booking Confirmation" means the email, SMS, invoice, ticket, voucher, WhatsApp message, or communication sent by Little Known Planet confirming a successful Booking.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Check-In</strong><br/>"Check-In" means the scheduled date and time from which the User becomes eligible to access or use a booked Stay, Event, or Experience after completing required formalities.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Check-Out</strong><br/>"Check-Out" means the scheduled date and time by which the User must vacate or complete usage of the booked Service.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Booking Period</strong><br/>"Booking Period" means the duration between the scheduled Check-In and Check-Out timings.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Advance Payment</strong><br/>"Advance Payment" refers to the amount paid in advance by the User for confirming or temporarily holding a Booking. Such payments may be non-refundable unless otherwise stated.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Security Deposit</strong><br/>"Security Deposit" means the refundable or non-refundable amount collected against damages, losses, misconduct, policy violations, or additional charges during the Booking Period.</p>
        <p><span style={{ color: "#0097B2", marginRight: "8px", fontSize: "14px" }}>✦</span><strong>Peak Dates</strong><br/>"Peak Dates" include weekends, public holidays, festive seasons, long weekends, New Year, Christmas, Diwali, vacation periods, and other high-demand dates identified by Little Known Planet or its Partners.</p>
      </div>
    )
  },
  {
    title: "Acknowledgement and Express Consent",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>By using the Platform, Users confirm that they have read, understood, and agreed to these Terms & Conditions, Privacy Policy, Cancellation Policy, Refund Policy, and other platform guidelines.</p>
        <p>Users also agree to receive booking confirmations, updates, support communications, and promotional notifications through email, phone calls, SMS, WhatsApp, or app notifications.</p>
        <p>Participation in Experiences, Events, adventure activities, Stays, and Food services is voluntary and Users agree to follow all safety instructions, venue rules, and local laws.</p>
      </div>
    )
  },
  {
    title: "Eligibility",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users must be at least 18 years old to make bookings on the Platform.<br/>Users below 18 years may access Services only under the supervision of a parent or legal guardian.</p>
        <p>Certain Services may require:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Valid ID proof</li>
          <li>Age verification</li>
          <li>Health declarations</li>
          <li>Fitness requirements</li>
        </ul>
        <p>Little Known Planet reserves the right to refuse bookings or access if eligibility requirements are not satisfied.</p>
      </div>
    )
  },
  {
    title: "Access and Interference for Online Bookings",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users agree not to:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Attempt unauthorized access to the Platform;</li>
          <li>Upload harmful software or viruses;</li>
          <li>Create fake bookings or accounts;</li>
          <li>Use bots or automated tools;</li>
          <li>Disrupt Platform operations.</li>
        </ul>
        <p>Any misuse may result in suspension of accounts, cancellation of bookings, or legal action.</p>
      </div>
    )
  },
  {
    title: "Description of Services Provided by Little Known Planet",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet provides and facilitates:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Experiences and activities</li>
          <li>Events and entertainment</li>
          <li>Stay bookings</li>
          <li>Food and dining services</li>
          <li>Place discovery and recommendations</li>
        </ul>
        <p>Certain Services may be independently operated by third-party Partners associated with the Platform.</p>
        <p>All Services are subject to:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Availability</li>
          <li>Operational feasibility</li>
          <li>Weather conditions</li>
          <li>Safety requirements</li>
          <li>Partner policies</li>
        </ul>
      </div>
    )
  },
  {
    title: "Accuracy of Content",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet makes reasonable efforts to ensure that information displayed on the Platform is accurate and updated.</p>
        <p>However, details such as:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Pricing</li>
          <li>Availability</li>
          <li>Images</li>
          <li>Amenities</li>
          <li>Timings</li>
          <li>Descriptions</li>
        </ul>
        <p>may occasionally contain inaccuracies or changes.<br/>Images displayed are for reference purposes only and actual conditions may vary.</p>
      </div>
    )
  },
  {
    title: "Additional Services",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>The Platform may provide additional services including:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Transportation</li>
          <li>Guides</li>
          <li>Photography</li>
          <li>Decorations</li>
          <li>Equipment rentals</li>
          <li>Meal plans</li>
          <li>Customized arrangements</li>
        </ul>
        <p>Additional services may involve extra charges and depend on availability.</p>
      </div>
    )
  },
  {
    title: "Pricing",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Prices displayed on the Platform may vary depending on:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Seasonal demand</li>
          <li>Peak dates</li>
          <li>Availability</li>
          <li>Taxes</li>
          <li>Partner pricing policies</li>
        </ul>
        <p>The final payable amount shall be displayed during checkout or booking confirmation.<br/>Little Known Planet reserves the right to correct pricing errors or revise charges due to technical or operational issues.</p>
      </div>
    )
  },
  {
    title: "Right of Admission and Possession of Property",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet and its Partners reserve the right to deny entry or cancel bookings in cases involving:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Misconduct</li>
          <li>Intoxication</li>
          <li>Violation of rules</li>
          <li>Illegal activities</li>
          <li>Safety concerns</li>
          <li>Possession of prohibited items</li>
        </ul>
        <p>Stay bookings provide temporary access only for the booked duration and do not grant ownership or tenancy rights.</p>
      </div>
    )
  },
  {
    title: "Our Fees",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet may charge:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Convenience fees</li>
          <li>Service charges</li>
          <li>Processing fees</li>
          <li>Booking fees</li>
          <li>Cancellation charges</li>
        </ul>
        <p>Applicable charges shall be shown during booking wherever possible.</p>
        <p>Certain charges may be non-refundable depending on cancellation policies and operational expenses.</p>
      </div>
    )
  },
  {
    title: "User Terms",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users agree to use the Little Known Planet Platform responsibly and only for lawful purposes.</p>
        <p>Users shall not:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Provide false information;</li>
          <li>Create fake bookings or accounts;</li>
          <li>Misuse Services or offers;</li>
          <li>Engage in abusive, harmful, or illegal activities;</li>
          <li>Violate any Platform policies or local laws.</li>
        </ul>
        <p>Users are responsible for maintaining confidentiality of their account credentials and all activities carried out through their account.</p>
        <p>Little Known Planet reserves the right to suspend or terminate accounts found violating these Terms.</p>
      </div>
    )
  },
  {
    title: "Link to Another Websites",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>The Platform may contain links to third-party websites, applications, or external services for user convenience.</p>
        <p>Little Known Planet does not control or guarantee the accuracy, security, or reliability of third-party websites and shall not be responsible for:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>External content;</li>
          <li>Third-party policies;</li>
          <li>Transactions made outside the Platform;</li>
          <li>Damages or losses caused by third-party services.</li>
        </ul>
        <p>Users are advised to review the terms and privacy policies of external websites before using them.</p>
      </div>
    )
  },
  {
    title: "Promotional Offers",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet may provide discounts, coupon codes, cashback offers, referral rewards, seasonal promotions, or limited-time deals.</p>
        <p>All promotional offers:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Are subject to availability;</li>
          <li>May have separate terms and conditions;</li>
          <li>May be withdrawn or modified without prior notice;</li>
          <li>Cannot be combined unless specifically stated.</li>
        </ul>
        <p>Little Known Planet reserves the right to cancel or reject offers in cases of misuse, fraud, or technical errors.</p>
      </div>
    )
  },
  {
    title: "Booking Confirmation",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>A booking shall be considered confirmed only after:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Successful payment;</li>
          <li>Availability confirmation;</li>
          <li>Receipt of booking confirmation communication from Little Known Planet.</li>
        </ul>
        <p>Booking confirmations may be shared through:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Email</li>
          <li>SMS</li>
          <li>WhatsApp</li>
          <li>In-app notifications</li>
        </ul>
        <p>Users must verify all booking details immediately after receiving confirmation.<br/>Little Known Planet shall not be responsible for issues arising from incorrect information provided by Users.</p>
      </div>
    )
  },
  {
    title: "Booking on Hold",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Certain bookings may be temporarily placed on hold upon payment of an advance amount.<br/>Bookings on hold:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Remain valid only for the specified duration;</li>
          <li>May be automatically cancelled if pending payments are not completed within the required timeline.</li>
        </ul>
        <p>Advance payments made for holding bookings may be non-refundable unless otherwise stated.</p>
      </div>
    )
  },
  {
    title: "Check-In (Start of Booking) and Check-Out (End of Booking) Timing",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users must follow the check-in and check-out timings mentioned in the booking confirmation or communicated by the Partner.</p>
        <p>Early check-in or late check-out:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Depends on availability;</li>
          <li>May involve additional charges.</li>
        </ul>
        <p>Users must complete all formalities including ID verification and pending payments before accessing the booked service.</p>
        <p>Failure to vacate within the permitted check-out time may result in penalty charges.</p>
      </div>
    )
  },
  {
    title: "Payment of Advances / Security Deposits by Guests and Damage to Property",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users may be required to pay:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Advance payments;</li>
          <li>Security deposits;</li>
          <li>Damage protection charges.</li>
        </ul>
        <p>Security deposits may be used for:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Property damages;</li>
          <li>Missing items;</li>
          <li>Rule violations;</li>
          <li>Additional cleaning charges;</li>
          <li>Penalty charges.</li>
        </ul>
        <p>Users shall be responsible for any damages caused during the booking period by themselves or accompanying guests.</p>
        <p>Additional recovery charges may apply if damages exceed the collected deposit amount.</p>
      </div>
    )
  },
  {
    title: "Payment Options",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet may accept payments through:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Credit cards</li>
          <li>Debit cards</li>
          <li>UPI</li>
          <li>Net banking</li>
          <li>Digital wallets</li>
          <li>Payment gateways</li>
          <li>Other approved payment methods</li>
        </ul>
        <p>Users agree to provide accurate payment details and authorize transactions for bookings made through the Platform.<br/>Little Known Planet shall not be responsible for payment failures caused by banks, payment gateways, technical issues, or network problems.</p>
      </div>
    )
  },
  {
    title: "Financial Details",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users are responsible for ensuring that all payment information provided during booking is accurate and valid.<br/>Invoices, receipts, and transaction confirmations may be issued electronically.<br/>Users agree to pay all applicable:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Taxes;</li>
          <li>Service charges;</li>
          <li>Convenience fees;</li>
          <li>Additional charges associated with bookings.</li>
        </ul>
        <p>Little Known Planet reserves the right to revise pricing, fees, or charges without prior notice due to operational, legal, or technical reasons.</p>
      </div>
    )
  },
  {
    title: "Pets Policy",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Pets may be allowed only at selected Stays, Experiences, or venues as specified in the listing or communicated by the Partner.<br/>Users bringing pets must:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Inform in advance;</li>
          <li>Maintain cleanliness;</li>
          <li>Ensure pets do not disturb others;</li>
          <li>Follow partner-specific pet rules.</li>
        </ul>
        <p>Users shall be fully responsible for damages, injuries, hygiene issues, or disturbances caused by their pets.<br/>Additional cleaning or damage charges may apply.</p>
      </div>
    )
  },
  {
    title: "Specific and General Breach",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Any violation of these Terms & Conditions, partner policies, local laws, or safety guidelines shall be considered a breach.<br/>In case of breach, Little Known Planet reserves the right to:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Cancel bookings;</li>
          <li>Deny access to services;</li>
          <li>Suspend accounts;</li>
          <li>Retain payments or deposits where applicable;</li>
          <li>Initiate legal action if necessary.</li>
        </ul>
        <p>Users shall remain responsible for losses or damages caused due to such violations.</p>
      </div>
    )
  },
  {
    title: "Cancellations and Refund",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Cancellation and refund policies may vary depending on:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Type of service;</li>
          <li>Partner policies;</li>
          <li>Timing of cancellation;</li>
          <li>Peak dates or special events.</li>
        </ul>
        <p>Refunds, where applicable, may take several business days to process depending on payment providers and banks.</p>
        <p>No refunds may be provided for:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>No-shows;</li>
          <li>Late arrivals;</li>
          <li>Policy violations;</li>
          <li>Non-refundable bookings.</li>
        </ul>
        <p>Little Known Planet reserves the right to deduct applicable cancellation charges, taxes, processing fees, or operational expenses.</p>
      </div>
    )
  },
  {
    title: "Safety and Prohibitions",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users must follow all safety instructions, venue rules, local laws, and operational guidelines while using Services.</p>
        <p>The following activities are strictly prohibited:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Illegal activities;</li>
          <li>Violence or harassment;</li>
          <li>Drug or substance abuse;</li>
          <li>Carrying weapons or prohibited items;</li>
          <li>Property damage;</li>
          <li>Unsafe behavior.</li>
        </ul>
        <p>Little Known Planet and its Partners reserve the right to remove or deny access to Users engaging in prohibited activities.</p>
      </div>
    )
  },
  {
    title: "Confidentials and Personal Data/Information",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet may collect and process personal information including:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Name;</li>
          <li>Contact details;</li>
          <li>Booking information;</li>
          <li>Payment details;</li>
          <li>Usage data.</li>
        </ul>
        <p>User information shall be handled in accordance with the Privacy Policy and applicable laws.</p>
        <p>Little Known Planet takes reasonable measures to protect user data but cannot guarantee complete security of digital communications or systems.</p>
      </div>
    )
  },
  {
    title: "Intellectual Property Rights",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>All Platform content including:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Logos;</li>
          <li>Brand names;</li>
          <li>Designs;</li>
          <li>Text;</li>
          <li>Images;</li>
          <li>Videos;</li>
          <li>Graphics;</li>
          <li>Software;</li>
        </ul>
        <p>are the intellectual property of Little Known Planet or its licensors.</p>
        <p>Users shall not copy, reproduce, distribute, modify, or commercially use any Platform content without prior written permission.</p>
      </div>
    )
  },
  {
    title: "Limitation of Liability",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet acts mainly as a facilitator connecting Users with Partners and service providers.</p>
        <p>Little Known Planet shall not be liable for:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Personal injuries;</li>
          <li>Accidents;</li>
          <li>Property damages;</li>
          <li>Travel delays;</li>
          <li>Event cancellations;</li>
          <li>Service interruptions;</li>
          <li>Third-party actions;</li>
          <li>Weather-related disruptions;</li>
          <li>Losses arising from partner services.</li>
        </ul>
        <p>Users participate in activities and use services at their own risk.</p>
      </div>
    )
  },
  {
    title: "Guest Issues",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users are encouraged to report concerns, disputes, damages, or service issues immediately to the support team or Partner.<br/>Little Known Planet will make reasonable efforts to assist in resolving issues but does not guarantee specific outcomes for disputes involving third-party Partners.</p>
      </div>
    )
  },
  {
    title: "Force Majeure",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet shall not be held responsible for delays, cancellations, interruptions, or failure to provide services caused by events beyond reasonable control including:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Natural disasters;</li>
          <li>Floods;</li>
          <li>Heavy rain;</li>
          <li>Landslides;</li>
          <li>Government restrictions;</li>
          <li>Pandemics;</li>
          <li>Political unrest;</li>
          <li>Internet failures;</li>
          <li>Strikes;</li>
          <li>Emergencies.</li>
        </ul>
      </div>
    )
  },
  {
    title: "Termination",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet reserves the right to suspend, restrict, or terminate user access to the Platform without prior notice if:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>These Terms are violated;</li>
          <li>Fraudulent activity is detected;</li>
          <li>User conduct harms the Platform, Partners, or other Users.</li>
        </ul>
        <p>Termination may result in cancellation of bookings and forfeiture of applicable payments or deposits.</p>
      </div>
    )
  },
  {
    title: "Dispute Resolution and Applicable Law and Jurisdiction",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>These Terms & Conditions shall be governed by the laws of India.<br/>Any disputes arising from use of the Platform or Services shall be subject to the exclusive jurisdiction of the courts located in the city/state where Little Known Planet operates its registered office.<br/>Users agree to attempt amicable resolution before initiating legal proceedings.</p>
      </div>
    )
  },
  {
    title: "Assignment",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users shall not transfer or assign their rights, bookings, or obligations under these Terms without prior written consent from Little Known Planet.<br/>Little Known Planet reserves the right to assign or transfer its rights, obligations, or operations to affiliated entities or successors.</p>
      </div>
    )
  },
  {
    title: "Notices",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Little Known Planet may send notices, updates, confirmations, or communications through:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Email;</li>
          <li>SMS;</li>
          <li>WhatsApp;</li>
          <li>Phone calls;</li>
          <li>In-app notifications;</li>
          <li>Website announcements.</li>
        </ul>
        <p>Users are responsible for keeping their contact information updated.</p>
      </div>
    )
  },
  {
    title: "Indemnification",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users agree to indemnify and hold harmless Little Known Planet, its employees, partners, affiliates, and service providers against claims, damages, losses, liabilities, or expenses arising from:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Violation of these Terms;</li>
          <li>Misuse of the Platform;</li>
          <li>Illegal activities;</li>
          <li>Damages caused by Users or accompanying guests.</li>
        </ul>
      </div>
    )
  },
  {
    title: "Feedback",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Any suggestions, feedback, reviews, comments, or ideas submitted by Users may be used by Little Known Planet for improving Services without any obligation or compensation to the User.<br/>Little Known Planet reserves the right to moderate, remove, or refuse inappropriate feedback or content.</p>
      </div>
    )
  },
  {
    title: "Waiver",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Failure by Little Known Planet to enforce any provision of these Terms shall not constitute a waiver of its rights to enforce the same provision in the future.</p>
      </div>
    )
  },
  {
    title: "Grievance Redressal",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users may contact the support or grievance team regarding:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Booking issues;</li>
          <li>Refund concerns;</li>
          <li>Complaints;</li>
          <li>Service disputes;</li>
          <li>Privacy concerns.</li>
        </ul>
        <p>Little Known Planet will make reasonable efforts to address grievances within a reasonable timeframe.</p>
      </div>
    )
  },
  {
    title: "Submissions",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Any content submitted by Users including reviews, photos, videos, comments, or testimonials must:</p>
        <ul style={{ margin: 0, paddingLeft: "24px" }}>
          <li>Be accurate;</li>
          <li>Not violate laws;</li>
          <li>Not infringe third-party rights;</li>
          <li>Not contain abusive or offensive material.</li>
        </ul>
        <p>Users grant Little Known Planet permission to use submitted content for promotional, operational, or marketing purposes.</p>
      </div>
    )
  },
  {
    title: "Miscellaneous",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>If any provision of these Terms becomes invalid or unenforceable, the remaining provisions shall continue to remain valid and enforceable.<br/>These Terms constitute the complete agreement between Users and Little Known Planet regarding use of the Platform and Services.<br/>Continued use of the Platform constitutes acceptance of these Terms & Conditions.</p>
      </div>
    )
  }
];

const AccordionItem = ({ item, isOpen, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{ 
        marginBottom: "16px",
        borderRadius: "12px",
        border: isOpen ? "1px solid rgba(0, 151, 178, 0.4)" : "1px solid #EAEAEA",
        boxShadow: isOpen ? "0 4px 20px rgba(0, 151, 178, 0.08)" : (isHovered ? "0 4px 12px rgba(0,0,0,0.03)" : "none"),
        overflow: "hidden",
        background: isOpen ? "#FFFFFF" : (isHovered ? "#FAFAFA" : "#FFFFFF"),
        transition: "all 0.3s ease"
      }}
    >
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 32px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          outline: "none"
        }}
      >
        <span style={{ 
          fontSize: "17px", 
          fontWeight: isOpen ? 600 : 500,
          color: isOpen ? "#0097B2" : "#1A1A1A",
          transition: "color 0.3s ease",
          lineHeight: 1.4
        }}>
          {item.title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", color: isOpen ? "#0097B2" : "#999999" }}
        >
          <ChevronDown size={22} strokeWidth={isOpen ? 2 : 1.5} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ 
              padding: "0px 32px 32px 32px", 
              color: "#4A4A4A", 
              fontSize: "16px", 
              lineHeight: 1.9, 
            }}>
              {item.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TermsOfService = () => {
  const [openIndices, setOpenIndices] = useState([0]); // Open first section by default
  const [showTopBtn, setShowTopBtn] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggleAccordion = (index) => {
    if (openIndices.includes(index)) {
      setOpenIndices(openIndices.filter(i => i !== index));
    } else {
      setOpenIndices([...openIndices, index]);
    }
  };

  const expandAll = () => {
    setOpenIndices(accordionData.map((_, i) => i));
  };

  const collapseAll = () => {
    setOpenIndices([]);
  };

  return (
    <Page>
      <Helmet>
        <title>Terms & Conditions | Little Known Planet</title>
        <meta name="description" content="Review the Terms and Conditions for using Little Known Planet services." />
      </Helmet>
      
      {/* Top Progress Bar */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "#0097B2",
          transformOrigin: "0%",
          scaleX,
          zIndex: 9999
        }}
      />

      <div style={{ background: "#FAFAFA", minHeight: "100vh", paddingTop: "100px", paddingBottom: "80px", color: "#333333", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 24px" }}>
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ textAlign: "center", marginBottom: "40px" }}
          >
            <h1 className="font-display" style={{ 
              fontSize: "clamp(3.5rem, 7vw, 5.5rem)",
              fontWeight: 400, 
              color: "#2D3239", 
              letterSpacing: "-0.02em",
              marginBottom: "0px",
              fontFamily: "Georgia, serif"
            }}>
              Terms & Conditions
            </h1>
            
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {accordionData.map((item, index) => (
              <AccordionItem
                key={index}
                item={item}
                isOpen={openIndices.includes(index)}
                onClick={() => toggleAccordion(index)}
              />
            ))}
          </div>

        </div>
      </div>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showTopBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={goToTop}
            style={{
              position: "fixed",
              bottom: "40px",
              right: "40px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(0, 151, 178, 0.2)",
              color: "#0097B2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              zIndex: 1000,
              transition: "transform 0.2s ease"
            }}
            whileHover={{ y: -5, boxShadow: "0 12px 40px rgba(0, 151, 178, 0.15)" }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowUp size={24} strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>
    </Page>
  );
};

export default TermsOfService;
