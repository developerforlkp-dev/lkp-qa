import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";
import Page from "../../components/Page";
import { getPolicyDocuments } from "../../utils/api";
import { useTheme } from "../../components/JUI/Theme";

const TermsOfService = () => {
  const { tokens } = useTheme();
  const [documentHtml, setDocumentHtml] = useState("");
  const [title, setTitle] = useState("Terms & Conditions");
  const [loading, setLoading] = useState(true);
  const [showTopBtn, setShowTopBtn] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const fetchPolicy = async () => {
      try {
        const data = await getPolicyDocuments();
        if (data && data.termsAndConditions) {
          setDocumentHtml(data.termsAndConditions.contentHtml || "");
          if (data.termsAndConditions.title) {
            setTitle(data.termsAndConditions.title);
          }
        }
      } catch (error) {
        console.error("Failed to load Terms & Conditions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();

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

  return (
    <Page>
      <Helmet>
        <title>{title} | Little Known Planet</title>
        <meta name="description" content={`Review the ${title} for using Little Known Planet services.`} />
      </Helmet>
      
      {/* Top Progress Bar */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: tokens.A,
          transformOrigin: "0%",
          scaleX,
          zIndex: 9999
        }}
      />

      <div style={{ background: tokens.BG, minHeight: "100vh", paddingTop: "100px", paddingBottom: "80px", color: tokens.FG, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 36px" }}>
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ textAlign: "center", marginBottom: "40px" }}
          >
            <h1 className="font-display" style={{ 
              fontSize: "clamp(3.5rem, 7vw, 5.5rem)",
              fontWeight: 400, 
              color: tokens.A, 
              letterSpacing: "-0.02em",
              marginBottom: "0px",
              fontFamily: "Georgia, serif"
            }}>
              {title}
            </h1>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", background: tokens.BG, padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)", border: `1px solid ${tokens.B}` }}>
            {loading ? (
              <p style={{ textAlign: "center", color: tokens.M }}>Loading...</p>
            ) : documentHtml ? (
              <div 
                style={{ 
                  color: tokens.FG, 
                  fontSize: "16px", 
                  lineHeight: 1.9,
                }}
                dangerouslySetInnerHTML={{ __html: documentHtml }} 
              />
            ) : (
              <p style={{ textAlign: "center", color: tokens.M }}>Failed to load content.</p>
            )}
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
              background: tokens.BG,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: `1px solid rgba(0, 151, 178, 0.2)`,
              color: tokens.A,
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
