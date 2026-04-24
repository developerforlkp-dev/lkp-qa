import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useParams, useHistory } from "react-router-dom";
import cn from "classnames";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Check, Zap, MapPin, ChevronDown, Clock, User, Camera, Coffee, Phone, Info } from "lucide-react";
import { useTheme } from "../../components/JUI/Theme";
import { Cursor, ProgressBar, Rev, Chars, Mq, SHdr, E, Soul } from "../../components/JUI/UI";
import { Navbar } from "../../components/JUI/Navbar";
import { Footer } from "../../components/JUI/Footer";
import { BookingSystem } from "../../components/JUI/BookingSystem";
import Loader from "../../components/Loader";
import {
  getListing,
  getHost,
  getLeadDetails,
} from "../../utils/api";
import { buildExperienceUrl, extractExperienceIdFromSlugAndId } from "../../utils/experienceUrl";

// Helper function to format image URLs
const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("leads/")) return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  if (url.startsWith("/")) return url;
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
};

/* ─── KINETIC BACKGROUND ────────────────────────── */
function ExperienceBg({ progress, src }) {
  const { tokens: { A, BG } } = useTheme();
  const scale = useTransform(progress, [0, 1], [1, 1.2]);
  const opacity = useTransform(progress, [0, 0.8], [0.6, 0]);
  const blur = useTransform(progress, [0, 0.5], [0, 10]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <motion.div style={{ scale, opacity, filter: `blur(${blur}px)`, width: "100%", height: "100%", position: "relative" }}>
        <img src={src || "/gallery/concert.png"} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5) contrast(1.1)" }} alt="" />
        <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 5, repeat: Infinity }} style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 30% 40%, ${A}44 0%, transparent 60%)` }} />
        <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 7, repeat: Infinity, delay: 2 }} style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 70% 60%, ${A}33 0%, transparent 50%)` }} />
      </motion.div>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 60%, ${BG} 100%)` }} />
    </div>
  );
}

const ExperienceProduct = () => {
  const location = useLocation();
  const history = useHistory();
  const { slugAndId } = useParams();
  const params = new URLSearchParams(location.search);
  const idFromPath = extractExperienceIdFromSlugAndId(slugAndId);
  const idParam = params.get("id");
  const id = idFromPath || idParam || "2";

  const { tokens: { A, FG, M, B, W, BG, S, AL, AH } } = useTheme();
  const [listing, setListing] = useState(null);
  const [hostData, setHostData] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    const load = async () => {
      try {
        const data = await getListing(id);
        if (!mounted) return;

        if (data) {
          setListing(data);
          const galleryImages = [];
          if (data.coverPhotoUrl) {
            const formattedUrl = formatImageUrl(data.coverPhotoUrl);
            if (formattedUrl) galleryImages.push(formattedUrl);
          }
          if (Array.isArray(data.listingMedia)) {
            for (const media of data.listingMedia) {
              const imageUrl = formatImageUrl(media.url || media.fileUrl);
              if (imageUrl) galleryImages.push(imageUrl);
            }
          }
          setGalleryItems(galleryImages);

          const canonicalUrl = buildExperienceUrl(data.title || "experience", data.listingId || data.id || id);
          if (location.pathname !== canonicalUrl) history.replace(canonicalUrl);

          const leadUserId = data.leadUserId || data.host?.leadUserId;
          if (leadUserId) {
            getHost(leadUserId).then(resp => mounted && setHostData(resp)).catch(e => console.warn(e));
          }

          const leadId = data.leadId || data.lead_id || data.host?.leadId || data.leadUserId;
          if (leadId) {
            getLeadDetails(leadId).then(resp => mounted && setLeadData(resp)).catch(e => console.warn(e));
          }
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        setLoading(false);
      } 
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const textY = useTransform(heroProgress, [0, 1], [0, -200]);
  const fade = useTransform(heroProgress, [0, 0.6], [1, 0]);

  if (loading && !listing) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: BG }}><Loader /></div>;
  }

  // Formatting description for details section
  const description = listing?.description || listing?.aboutListing || "A multisensory odyssey that blurs the line between perception and possibility.";
  const summary = listing?.summary || listing?.listingSummary || "High-fidelity touchpoints that respond to your presence in real-time.";

  return (
    <>
      <Navbar />
      <main style={{ background: BG }}>
        {/* HERO SECTION */}
        <section ref={heroRef} style={{ position: "relative", minHeight: "110vh", overflow: "hidden", display: "flex", alignItems: "center" }}>
          <ExperienceBg progress={heroProgress} src={formatImageUrl(listing?.coverPhotoUrl)} />
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 60px", position: "relative", zIndex: 10, width: "100%" }}>
             <motion.div style={{ opacity: fade, y: textY }}>
               <p style={{ fontSize: 12, letterSpacing: "1em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 40, fontFamily: 'monospace' }}>The Narrative Experience</p>
               <h1 style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)", fontWeight: 900, color: FG, lineHeight: 1.1, letterSpacing: "0.05em", margin: 0, textTransform: "uppercase", fontFamily: 'inherit' }}>
                 {listing?.title?.split(' ')[0] || "ULTRA"}
               </h1>
               <h1 style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)", fontWeight: 900, color: "transparent", WebkitTextStroke: `1px ${FG}`, lineHeight: 1.1, letterSpacing: "0.05em", margin: 0, textTransform: "uppercase", fontFamily: 'inherit' }}>
                 {listing?.title?.split(' ').slice(1).join(' ') || "REALITY"}
               </h1>
               
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 100, marginTop: 100, maxWidth: 1000 }} className="hero-stats">
                  <div>
                     <p style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: A, marginBottom: 20, fontWeight: 700 }}>01. Atmospherics</p>
                     <p style={{ fontSize: 18, color: M, lineHeight: 1.6, fontWeight: 400 }}>{listing?.experienceType || "A multisensory odyssey that blurs the line between perception and possibility."}</p>
                  </div>
                  <div>
                     <p style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: A, marginBottom: 20, fontWeight: 700 }}>02. Interaction</p>
                     <p style={{ fontSize: 18, color: M, lineHeight: 1.6, fontWeight: 400 }}>{listing?.activityType || "High-fidelity touchpoints that respond to your presence in real-time."}</p>
                  </div>
               </div>
             </motion.div>
          </div>
          <motion.div style={{ position: "absolute", bottom: 60, left: 60, display: "flex", alignItems: "center", gap: 20, opacity: fade }}>
            <motion.div animate={{ height: [40, 80, 40] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} style={{ width: 1, background: A }} />
            <span style={{ fontSize: 10, letterSpacing: "0.5em", textTransform: "uppercase", color: M, fontWeight: 600 }}>Explore Souls</span>
          </motion.div>
        </section>

        <Mq items={["Artistic Evolution", "Deep Immersion", "Sonic Archeology"]} size="sm" bg={BG} />

        {/* GALLERY SECTION */}
        <section style={{ background: W, padding: "80px 36px 60px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <Soul y={100} s={0.1} r={0}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: 340, gap: 16 }} className="gal-grid">
                {galleryItems.slice(0, 4).map((img, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} 
                    style={{ 
                      gridColumn: i === 0 ? "span 2" : "span 1", 
                      gridRow: i === 0 || i === 2 ? "span 2" : "span 1", 
                      borderRadius: 24, overflow: "hidden", border: `1px solid ${B}` 
                    }}>
                    <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                  </motion.div>
                ))}
              </div>
            </Soul>
          </div>
        </section>

        <Mq items={["Artistic Evolution", "Deep Immersion", "Sonic Archeology", "Aura Collective"]} bg={BG} />

        {/* DETAILS SECTION */}
        <section style={{ background: BG, padding: "180px 36px 130px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <SHdr idx="01" label="Overview" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="details-grid">
              <Soul delay={0.1} style={{ gridColumn: "span 2" }}>
                <div style={{ background: W, border: `1px solid ${B}`, padding: 48, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                   <div>
                     <p style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: A, marginBottom: 16, fontWeight: 600 }}>What We Do</p>
                     <h2 style={{ fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: 24 }}>A Guided Journey</h2>
                     <p style={{ color: M, fontSize: 14, lineHeight: 1.8 }}>{description}</p>
                   </div>
                </div>
              </Soul>
              <Soul y={120} r={5} style={{ gridColumn: "span 1" }}>
                <div style={{ background: S, border: `1px solid ${B}`, padding: 48, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <Clock size={28} color={A} style={{ marginBottom: 16 }} />
                  <p style={{ fontSize: 24, fontWeight: 700, color: FG, marginBottom: 4 }}>{listing?.duration || "2.5 Hrs"}</p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Duration</p>
                </div>
              </Soul>
              <Soul y={120} r={-5} style={{ gridColumn: "span 1" }}>
                <div style={{ background: S, border: `1px solid ${B}`, padding: 48, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <User size={28} color={A} style={{ marginBottom: 16 }} />
                  <p style={{ fontSize: 24, fontWeight: 700, color: FG, marginBottom: 4 }}>{listing?.minimumAge || "18+"}</p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Minimum Age</p>
                </div>
              </Soul>
            </div>
          </div>
        </section>

        <Mq items={["Curated Staging", "Atmospheric Prep", "Sonic Calibration"]} size="sm" bg={BG} />

        {/* PREPARATION SECTION */}
        <section style={{ background: W, padding: "130px 36px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <SHdr idx="02" label="Preparation" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64 }} className="prep-grid">
               <Rev delay={0.1}>
                 <h3 style={{ fontSize: "clamp(2rem,3vw,2.5rem)", fontWeight: 700, color: FG, marginBottom: 32 }}>Meeting Point</h3>
                 <div style={{ background: S, border: `1px solid ${B}`, padding: 40, display: "flex", flexDirection: "column", gap: 16 }}>
                   <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                     <MapPin size={20} color={A} />
                     <div>
                       <p style={{ fontSize: 14, fontWeight: 700, color: FG }}>{listing?.meetingLocationName || "The Grand Atrium"}</p>
                       <p style={{ fontSize: 13, color: M, marginTop: 4 }}>{listing?.meetingAddress || "Arrive via Gate 3 (Private Entrance). Our concierge will meet you at the inner courtyard."}</p>
                     </div>
                   </div>
                   <div style={{ background: W, border: `1px solid ${B}`, height: 200, marginTop: 16, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${A}18 1px,transparent 1px),linear-gradient(90deg,${A}18 1px,transparent 1px)`, backgroundSize: "20px 20px" }} />
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 12, height: 12, background: A, borderRadius: "50%" }}>
                        <motion.div animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: "absolute", inset: "-6px", border: `2px solid ${A}`, borderRadius: "50%" }} />
                      </div>
                   </div>
                 </div>
               </Rev>
               <Rev delay={0.2}>
                 <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
                   <div>
                     <h3 style={{ fontSize: "clamp(2rem,3vw,2.5rem)", fontWeight: 700, color: FG, marginBottom: 24 }}>Requirements</h3>
                     <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, padding: 0 }}>
                       {(listing?.requirements || ["Government-issued Photo ID (18+ Mandatory)", "Valid Event Ticket", "Comfortable walking shoes"]).map(item => (
                         <li key={item} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={{ width: 6, height: 6, background: A }} />
                            <span style={{ fontSize: 13, color: M }}>{item}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
               </Rev>
            </div>
          </div>
        </section>

        <Mq items={["Aura Collective", "Global Perspective", "Immersive Reviews"]} size="sm" bg={BG} />

        {/* HOST & REVIEWS SECTION */}
        <section style={{ background: BG, padding: "130px 36px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} className="host-grid">
             <Rev delay={0.1}>
               <SHdr idx="03" label="The Host" />
               <div style={{ padding: 48, background: W, border: `1px solid ${B}` }}>
                 <img src={formatImageUrl(hostData?.profilePhotoUrl) || "/gallery/dancer.png"} alt="Host" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", marginBottom: 24, filter: "grayscale(1)" }} />
                 <h3 style={{ fontSize: "2rem", fontWeight: 700, color: FG, marginBottom: 8 }}>{hostData?.firstName} {hostData?.lastName || "Curator"}</h3>
                 <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: A, marginBottom: 24 }}>{hostData?.businessName || "Lead Curator"}</p>
                 <p style={{ fontSize: 13, color: M, lineHeight: 1.8 }}>{hostData?.about || "An expert guide who will personally lead the Experience group through the unseen veins of the venue, offering context and narrative to every installation."}</p>
                 {leadData && (
                   <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 10, color: FG, fontSize: 13 }}><Phone size={14} color={A} /> {leadData.contactNumber}</div>
                     <div style={{ display: "flex", alignItems: "center", gap: 10, color: FG, fontSize: 13 }}><Info size={14} color={A} /> {leadData.email}</div>
                   </div>
                 )}
               </div>
             </Rev>
             <Rev delay={0.2}>
               <SHdr idx="04" label="Testimonials" />
               <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { q: "A completely transcendent journey. It changes the way you look at a festival entirely.", a: "Vogue India" },
                    { q: "The curation was intensely personal. Every corner held a secret waiting to be unlocked.", a: "GQ" }
                  ].map((rev, i) => (
                    <div key={i} style={{ padding: 32, background: S, border: `1px solid ${B}` }}>
                      <p style={{ fontSize: 14, fontStyle: "italic", color: FG, lineHeight: 1.7, marginBottom: 16 }}>&ldquo;{rev.q}&rdquo;</p>
                      <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>— {rev.a}</p>
                    </div>
                  ))}
               </div>
             </Rev>
          </div>
        </section>

        <ExperiencePolicies />
        <Footer />
        <BookingSystem listing={listing} />
      </main>
      <style>{`
        @media(max-width: 900px) { 
          .hero-stats { grid-template-columns: 1fr !important; gap: 40px !important; } 
          .gal-grid { grid-template-columns: 1fr 1fr !important; grid-auto-rows: 240px !important; gap: 8px !important; }
          .details-grid { grid-template-columns: 1fr !important; }
          .details-grid > div { grid-column: span 1 !important; }
          .prep-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .host-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
};

function PolicyItem({ p }) {
  const { tokens: { FG, A, M, AL, B } } = useTheme();
  const [op, setOp] = useState(false);
  
  return (
    <motion.div style={{ borderBottom: `1px solid ${B}` }} whileHover={{ backgroundColor: AL }}>
      <button onClick={() => setOp(!op)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: op ? A : FG }}>{p.title}</span>
        <ChevronDown size={15} color={M} style={{ transform: op ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
      </button>
      {op && <p style={{ padding: "0 16px 22px", fontSize: 13, color: M, lineHeight: 1.8 }}>{p.body}</p>}
    </motion.div>
  );
}

function ExperiencePolicies() {
  const { tokens: { FG, W, B } } = useTheme();
  const policies = [
    { id: 1, title: "Punctuality", body: "The Experience begins precisely as scheduled. Late arrivals may not be accommodated to prevent disruption." },
    { id: 2, title: "Cancellation", body: "Fully refundable up to 72 hours before the event. Non-refundable within 72 hours." }
  ];
  
  return (
    <section style={{ background: W, padding: "130px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="05" label="Rules & Policies" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 80 }} className="pol-grid">
          <Rev delay={0.1}>
            <Chars text="Know Before You Go." cls="font-display" style={{ fontSize: "clamp(3.5rem,8vw,5.5rem)", fontWeight: 700, lineHeight: 0.9, color: FG, letterSpacing: "-0.02em" }} />
          </Rev>
          <Rev delay={0.2}>
            <div style={{ borderTop: `1px solid ${B}` }}>
              {policies.map(p => (
                <PolicyItem key={p.id} p={p} />
              ))}
            </div>
          </Rev>
        </div>
      </div>
    </section>
  );
}

export default ExperienceProduct;
