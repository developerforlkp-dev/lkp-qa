import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";
import Page from "../../components/Page";
import { getPolicyDocuments } from "../../utils/api";
import { useTheme } from "../../components/JUI/Theme";

const CancellationPolicy = () => {
  const { tokens } = useTheme();
  const [documentHtml, setDocumentHtml] = useState("");
  const [title, setTitle] = useState("Cancellation Policy");
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
        const rawData = await getPolicyDocuments();
        let cancelDoc = null;
        if (rawData) {
          if (typeof rawData === "string") {
            cancelDoc = rawData;
          } else if (Array.isArray(rawData)) {
            const searchKeys = [
              "customer-cancellation-policy",
              "customercancellationpolicy",
              "customer_cancellation_policy",
              "customer-cancellation",
              "customercancellation",
              "customer_cancellation",
              "cancellation-policy",
              "cancellationpolicy",
              "cancellation_policy",
              "cancellation",
              "refund-policy",
              "refundpolicy",
              "refund"
            ];
            cancelDoc = rawData.find((d) => {
              const k = (d?.documentKey || d?.key || d?.slug || d?.type || d?.name || d?.policyType || d?.documentType || "")
                .toLowerCase()
                .replace(/[-_ ]/g, "");
              return searchKeys.some((sk) => sk.replace(/[-_ ]/g, "") === k);
            });

            if (!cancelDoc) {
              cancelDoc = rawData.find((d) => {
                const k = JSON.stringify(d).toLowerCase();
                return k.includes("cancel") && k.includes("customer");
              });
            }

            if (!cancelDoc) {
              cancelDoc = rawData.find((d) => {
                const k = (d?.documentKey || d?.key || d?.slug || d?.type || d?.name || d?.title || "").toLowerCase();
                return k.includes("cancel");
              });
            }
          } else if (typeof rawData === "object") {
            cancelDoc =
              rawData.customerCancellationPolicy ||
              rawData["customer-cancellation-policy"] ||
              rawData.customer_cancellation_policy ||
              rawData.customerCancellation ||
              rawData["customer-cancellation"] ||
              rawData.customer_cancellation ||
              rawData.cancellationPolicy ||
              rawData["cancellation-policy"] ||
              rawData.cancellation_policy ||
              rawData.cancellation ||
              rawData.refundPolicy ||
              rawData["refund-policy"] ||
              rawData.refund_policy;

            if (!cancelDoc) {
              const entries = Object.entries(rawData);
              const customerCancelEntry = entries.find(([k]) => {
                const lk = k.toLowerCase();
                return lk.includes("customer") && lk.includes("cancel");
              });
              if (customerCancelEntry) {
                cancelDoc = customerCancelEntry[1];
              } else {
                const cancelEntry = entries.find(([k]) => k.toLowerCase().includes("cancel"));
                if (cancelEntry) {
                  cancelDoc = cancelEntry[1];
                }
              }
            }

            if (!cancelDoc && (rawData.contentHtml || rawData.content || rawData.html || rawData.body || rawData.description)) {
              cancelDoc = rawData;
            }
          }
        }
        if (cancelDoc) {
          if (typeof cancelDoc === "string") {
            setDocumentHtml(cancelDoc);
          } else if (typeof cancelDoc === "object") {
            const htmlContent =
              cancelDoc.contentHtml ||
              cancelDoc.content ||
              cancelDoc.html ||
              cancelDoc.body ||
              cancelDoc.description ||
              cancelDoc.text ||
              cancelDoc.document ||
              cancelDoc.policy ||
              cancelDoc.details ||
              cancelDoc.value ||
              (typeof cancelDoc.data === "string" ? cancelDoc.data : "");

            if (htmlContent) {
              setDocumentHtml(htmlContent);
            }
            if (cancelDoc.title || cancelDoc.name || cancelDoc.documentTitle) {
              setTitle(cancelDoc.title || cancelDoc.name || cancelDoc.documentTitle);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load Cancellation Policy", error);
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
        <meta name="description" content={`Review the ${title} for Little Known Planet.`} />
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

      <style>{`
        .policy-rich-text {
          color: ${tokens.FG};
          font-size: 16px;
          line-height: 1.85;
          word-break: break-word;
        }
        .policy-rich-text p {
          margin-bottom: 16px;
        }
        .policy-rich-text p:last-child {
          margin-bottom: 0;
        }
        .policy-rich-text ul {
          list-style-type: disc !important;
          margin: 16px 0 16px 24px !important;
          padding-left: 8px !important;
        }
        .policy-rich-text ol {
          list-style-type: decimal !important;
          margin: 16px 0 16px 24px !important;
          padding-left: 8px !important;
        }
        .policy-rich-text li {
          margin-bottom: 8px;
          list-style: inherit !important;
          display: list-item !important;
        }
        .policy-rich-text li:last-child {
          margin-bottom: 0;
        }
        .policy-rich-text h1,
        .policy-rich-text h2,
        .policy-rich-text h3,
        .policy-rich-text h4,
        .policy-rich-text h5,
        .policy-rich-text h6 {
          color: ${tokens.FG};
          margin-top: 28px;
          margin-bottom: 12px;
          font-weight: 600;
          line-height: 1.3;
        }
        .policy-rich-text h1 { font-size: 28px; }
        .policy-rich-text h2 { font-size: 22px; }
        .policy-rich-text h3 { font-size: 18px; }
        .policy-rich-text strong, .policy-rich-text b {
          font-weight: 600;
          color: ${tokens.FG};
        }
        .policy-rich-text a {
          color: ${tokens.A};
          text-decoration: underline;
        }
        .policy-rich-text hr {
          border: 0;
          border-top: 1px solid ${tokens.B};
          margin: 24px 0;
        }
        .policy-rich-text blockquote {
          border-left: 3px solid ${tokens.A};
          padding-left: 16px;
          margin: 16px 0;
          color: ${tokens.M};
          font-style: italic;
        }
        .policy-rich-text table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        .policy-rich-text th, .policy-rich-text td {
          border: 1px solid ${tokens.B};
          padding: 10px 14px;
          text-align: left;
        }
        .policy-rich-text th {
          background: rgba(0, 0, 0, 0.03);
          font-weight: 600;
        }
      `}</style>

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
                className="policy-rich-text"
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

export default CancellationPolicy;
