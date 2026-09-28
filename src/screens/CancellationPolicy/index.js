import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ChevronDown, ArrowUp } from "lucide-react";
import Page from "../../components/Page";
import { getPolicyDocuments } from "../../utils/api";
import { useTheme } from "../../components/JUI/Theme";

const accordionData = [
  {
    title: "1. Overview & General Policy",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>This Cancellation and Refund Policy outlines the terms under which reservations for experiences, stays, and events booked through Little Known Planet may be cancelled or modified.</p>
        <p>Each listing on our platform may have a specific cancellation timeframe set by the host. Please review the specific listing's cancellation terms prior to confirming your reservation.</p>
        <p>All cancellation requests must be submitted directly through your Little Known Planet account dashboard or by contacting customer support.</p>
      </div>
    )
  },
  {
    title: "2. Standard Cancellation Timelines & Refunds",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p><strong>Full Refund:</strong> Cancellations made at least 7 days before the scheduled check-in or start time are eligible for a 100% refund of the booking amount (less any non-refundable payment processing fees if applicable).</p>
        <p><strong>Partial Refund:</strong> Cancellations made between 48 hours and 7 days prior to the start time may receive a 50% refund, subject to the individual host's cancellation policy.</p>
        <p><strong>No Refund:</strong> Cancellations made within 48 hours of the scheduled start time or no-shows on the day of the reservation are non-refundable.</p>
      </div>
    )
  },
  {
    title: "3. Host-Initiated Cancellations",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>If a host cancels a confirmed reservation due to unforeseen circumstances, the guest will receive a 100% full refund of all amounts paid.</p>
        <p>Alternatively, guests may choose to rebook an alternate date or comparable experience/stay with platform assistance.</p>
      </div>
    )
  },
  {
    title: "4. Extenuating Circumstances & Force Majeure",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Special refund considerations or full rescheduling flexibility may be granted in cases of declared natural disasters, government-mandated travel restrictions, severe weather emergencies, or sudden illness.</p>
        <p>Valid documentation or proof may be requested by our support team to verify the extenuating circumstances before approving refunds outside standard windows.</p>
      </div>
    )
  },
  {
    title: "5. Refund Processing Timelines & Mode",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Approved refunds are initiated immediately by our billing system and credited back to the original source payment method (credit/debit card, UPI, or net banking).</p>
        <p>Depending on your bank or card issuer, refunds typically reflect in your account within 5 to 7 business days.</p>
      </div>
    )
  },
  {
    title: "6. Modifications & Date Rescheduling",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Date changes or guest count adjustments are subject to host approval and availability.</p>
        <p>Any fare differences arising from peak/off-peak rates, seasonal pricing adjustments, or room/category upgrades will be calculated and payable during the modification process.</p>
      </div>
    )
  }
];

const parseHtmlToSections = (htmlString) => {
  if (!htmlString || typeof htmlString !== "string" || !htmlString.trim()) return null;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const body = doc.body;

    // Find all headings
    const headings = Array.from(body.querySelectorAll("h1, h2, h3, h4"));
    if (headings.length === 0) {
      return null;
    }

    // Identify if there is a common wrapper element
    let container = body;
    while (
      container.children.length === 1 &&
      container.firstElementChild &&
      !/^H[1-4]$/i.test(container.firstElementChild.tagName) &&
      container.firstElementChild.querySelectorAll("h1, h2, h3, h4").length === headings.length
    ) {
      container = container.firstElementChild;
    }

    const sections = [];
    let introHtml = "";

    // Check if headings are top-level children of container
    const isDirectHeading = Array.from(container.children).some(el => /^H[1-4]$/i.test(el.tagName));

    if (isDirectHeading) {
      let currentSection = null;
      let introNodes = [];

      Array.from(container.childNodes).forEach((node) => {
        const isHeading = node.nodeType === Node.ELEMENT_NODE && /^H[1-4]$/i.test(node.tagName);

        if (isHeading) {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            title: node.textContent.trim() || node.innerText || "Section",
            contentHtml: "",
          };
        } else {
          const nodeHtml = node.nodeType === Node.ELEMENT_NODE ? node.outerHTML : (node.textContent?.trim() ? `<p>${node.textContent}</p>` : "");
          if (currentSection) {
            currentSection.contentHtml += nodeHtml;
          } else {
            if (nodeHtml) introNodes.push(nodeHtml);
          }
        }
      });

      if (currentSection) {
        sections.push(currentSection);
      }
      introHtml = introNodes.join("").trim();
    } else {
      // If headings are nested in distinct wrapper blocks
      Array.from(container.children).forEach((child) => {
        const heading = child.querySelector("h1, h2, h3, h4");
        if (heading) {
          const title = heading.textContent.trim();
          const clone = child.cloneNode(true);
          const clonedHeading = clone.querySelector("h1, h2, h3, h4");
          if (clonedHeading) clonedHeading.remove();
          sections.push({
            title: title || "Section",
            contentHtml: clone.innerHTML.trim()
          });
        } else {
          if (sections.length === 0) {
            introHtml += child.outerHTML;
          } else if (sections.length > 0) {
            sections[sections.length - 1].contentHtml += child.outerHTML;
          }
        }
      });
    }

    const validSections = sections.filter(s => s.title && s.title.trim().length > 0);
    if (validSections.length === 0) return null;

    return {
      introHtml,
      sections: validSections
    };
  } catch (error) {
    console.warn("Failed to parse policy HTML into sections:", error);
    return null;
  }
};

const AccordionItem = ({ item, isOpen, onClick, themeTokens }) => {
  const { FG, M, B, A, BG } = themeTokens;
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
        border: isOpen ? `1px solid rgba(0, 151, 178, 0.4)` : `1px solid ${B}`,
        boxShadow: isOpen ? "0 4px 20px rgba(0, 151, 178, 0.08)" : (isHovered ? "0 4px 12px rgba(0,0,0,0.03)" : "none"),
        overflow: "hidden",
        background: isOpen ? BG : (isHovered ? "rgba(0,0,0,0.02)" : BG),
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
        <span style={{ fontSize: "clamp(1.1rem, 2vw, 1.3rem)", fontWeight: isOpen ? 600 : 500, color: isOpen ? A : FG, transition: "color 0.3s ease" }}>
          {item.title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", color: isOpen ? A : M }}
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
            <div style={{ padding: "0px 32px 32px 32px", color: M, fontSize: "1.1rem", lineHeight: 1.9 }}>
              {item.contentHtml ? (
                <div 
                  className="policy-rich-text"
                  dangerouslySetInnerHTML={{ __html: item.contentHtml }}
                />
              ) : (
                item.content
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CancellationPolicy = () => {
  const { tokens } = useTheme();
  const [documentHtml, setDocumentHtml] = useState("");
  const [title, setTitle] = useState("Cancellation Policy");
  const [loading, setLoading] = useState(true);
  const [openIndices, setOpenIndices] = useState([0]);
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

  const parsedSectionsData = useMemo(() => {
    if (!documentHtml) return null;
    return parseHtmlToSections(documentHtml);
  }, [documentHtml]);

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
              marginBottom: "16px",
              fontFamily: "Georgia, serif"
            }}>
              {title}
            </h1>
            <p style={{ fontSize: "1.1rem", color: tokens.M, maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
              Review our cancellation, refund, and modification guidelines.
            </p>
          </motion.div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
              <p style={{ color: tokens.M, fontSize: "16px" }}>Loading...</p>
            </div>
          ) : parsedSectionsData && parsedSectionsData.sections.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {parsedSectionsData.introHtml && (
                <div 
                  className="policy-rich-text"
                  style={{
                    marginBottom: "24px",
                    padding: "24px 32px",
                    borderRadius: "12px",
                    background: tokens.BG,
                    border: `1px solid ${tokens.B}`,
                    color: tokens.FG,
                    fontSize: "16px",
                    lineHeight: 1.9,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                  }}
                  dangerouslySetInnerHTML={{ __html: parsedSectionsData.introHtml }}
                />
              )}
              {parsedSectionsData.sections.map((item, index) => (
                <AccordionItem
                  key={index}
                  item={item}
                  isOpen={openIndices.includes(index)}
                  onClick={() => toggleAccordion(index)}
                  themeTokens={tokens}
                />
              ))}
            </div>
          ) : documentHtml ? (
            <div 
              className="policy-rich-text"
              style={{ 
                background: tokens.BG, 
                padding: "40px", 
                borderRadius: "12px", 
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)", 
                border: `1px solid ${tokens.B}`,
                color: tokens.FG, 
                fontSize: "16px", 
                lineHeight: 1.9,
              }}
              dangerouslySetInnerHTML={{ __html: documentHtml }} 
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {accordionData.map((item, index) => (
                <AccordionItem
                  key={index}
                  item={item}
                  isOpen={openIndices.includes(index)}
                  onClick={() => toggleAccordion(index)}
                  themeTokens={tokens}
                />
              ))}
            </div>
          )}

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
