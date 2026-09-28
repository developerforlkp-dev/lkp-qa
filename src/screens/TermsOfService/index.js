import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ChevronDown, ArrowUp } from "lucide-react";
import Page from "../../components/Page";
import { getPolicyDocuments } from "../../utils/api";
import { useTheme } from "../../components/JUI/Theme";

const accordionData = [
  {
    title: "1. Introduction & Acceptance of Terms",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>These Terms and Conditions constitute a legally binding agreement between you and Little Known Planet. By accessing, browsing, or using our website, mobile application, or related services, you agree to be bound by these terms.</p>
        <p>If you do not agree with any part of these Terms and Conditions, you must discontinue the use of our Platform immediately.</p>
        <p>Little Known Planet reserves the right to modify, amend, or update these terms at any time without prior notice. Continued use of the platform constitutes your acceptance of any revisions.</p>
      </div>
    )
  },
  {
    title: "2. User Accounts & Eligibility",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>To access certain features of the Platform, you may be required to register and create an account with accurate, complete, and current information.</p>
        <p>You are responsible for maintaining the confidentiality of your account credentials and passwords, and you accept full responsibility for all activities that occur under your account.</p>
        <p>Users must be at least 18 years of age or the age of majority in their jurisdiction to enter into binding agreements on the Platform.</p>
      </div>
    )
  },
  {
    title: "3. Bookings, Payments & Pricing",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>All bookings made through the Platform are subject to host acceptance and availability. Prices displayed on the platform are inclusive or exclusive of applicable taxes and fees as indicated at checkout.</p>
        <p>Payments must be made through authorized payment gateways provided on the Platform. We do not store sensitive payment card details directly.</p>
        <p>Any additional charges, security deposits, or local tariffs required on-site by hosts must be clearly disclosed prior to booking confirmation.</p>
      </div>
    )
  },
  {
    title: "4. Cancellations, Refunds & Rescheduling",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Cancellations and refunds are governed by the specific Cancellation Policy associated with each experience, stay, or event listing.</p>
        <p>Refunds, if applicable, will be processed back to the original payment method in accordance with standard banking timelines.</p>
        <p>In cases of force majeure, natural disasters, or government restrictions, special consideration may apply as detailed in our policies.</p>
      </div>
    )
  },
  {
    title: "5. User Conduct & Obligations",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>Users agree to use the Platform strictly for legitimate personal or business purposes and in compliance with all applicable local, national, and international laws.</p>
        <p>Users shall not post defamatory, fraudulent, obscene, or infringing content, nor attempt to compromise the integrity, security, or availability of the Platform.</p>
        <p>Hosts and guests are expected to treat each other with respect, adhere to safety guidelines, and comply with house rules established by property and experience hosts.</p>
      </div>
    )
  },
  {
    title: "6. Intellectual Property",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>All content, trademarks, logos, graphics, software, and design elements featured on the Platform are the exclusive property of Little Known Planet or its licensors.</p>
        <p>Users may not copy, reproduce, distribute, or create derivative works from platform content without prior written consent from Little Known Planet.</p>
      </div>
    )
  },
  {
    title: "7. Limitation of Liability & Disclaimer",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>The Platform and all associated services are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied.</p>
        <p>Little Known Planet acts as an intermediary platform connecting guests with independent hosts and operators. We are not liable for acts, omissions, injuries, or property damage caused by third parties.</p>
      </div>
    )
  },
  {
    title: "8. Governing Law & Dispute Resolution",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p>These Terms and Conditions shall be governed by and construed in accordance with the laws of India.</p>
        <p>Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the courts located in the registered office jurisdiction of Little Known Planet.</p>
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

const TermsOfService = () => {
  const { tokens } = useTheme();
  const [documentHtml, setDocumentHtml] = useState("");
  const [title, setTitle] = useState("Terms & Conditions");
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
        let termsDoc = null;
        if (rawData) {
          if (typeof rawData === "string") {
            termsDoc = rawData;
          } else if (Array.isArray(rawData)) {
            const searchKeys = [
              "customer-terms-and-conditions",
              "customertermsandconditions",
              "customer_terms_and_conditions",
              "customer-terms",
              "customerterms",
              "customer_terms",
              "terms-and-conditions",
              "termsandconditions",
              "terms_and_conditions",
              "terms-of-service",
              "termsofservice",
              "terms_of_service",
              "terms",
              "conditions"
            ];
            termsDoc = rawData.find((d) => {
              const k = (d?.documentKey || d?.key || d?.slug || d?.type || d?.name || d?.policyType || d?.documentType || "")
                .toLowerCase()
                .replace(/[-_ ]/g, "");
              return searchKeys.some((sk) => sk.replace(/[-_ ]/g, "") === k);
            });

            if (!termsDoc) {
              termsDoc = rawData.find((d) => {
                const k = JSON.stringify(d).toLowerCase();
                return k.includes("term") && k.includes("customer");
              });
            }

            if (!termsDoc) {
              termsDoc = rawData.find((d) => {
                const k = (d?.documentKey || d?.key || d?.slug || d?.type || d?.name || d?.title || "").toLowerCase();
                return k.includes("term");
              });
            }
          } else if (typeof rawData === "object") {
            termsDoc =
              rawData.customerTermsAndConditions ||
              rawData["customer-terms-and-conditions"] ||
              rawData.customer_terms_and_conditions ||
              rawData.customerTerms ||
              rawData["customer-terms"] ||
              rawData.customer_terms ||
              rawData.termsAndConditions ||
              rawData["terms-and-conditions"] ||
              rawData.terms_and_conditions ||
              rawData.termsOfService ||
              rawData["terms-of-service"] ||
              rawData.terms_of_service ||
              rawData.terms;

            if (!termsDoc) {
              const entries = Object.entries(rawData);
              const customerTermsEntry = entries.find(([k]) => {
                const lk = k.toLowerCase();
                return lk.includes("customer") && lk.includes("term");
              });
              if (customerTermsEntry) {
                termsDoc = customerTermsEntry[1];
              } else {
                const termsEntry = entries.find(([k]) => k.toLowerCase().includes("term"));
                if (termsEntry) {
                  termsDoc = termsEntry[1];
                }
              }
            }

            if (!termsDoc && (rawData.contentHtml || rawData.content || rawData.html || rawData.body || rawData.description)) {
              termsDoc = rawData;
            }
          }
        }
        if (termsDoc) {
          if (typeof termsDoc === "string") {
            setDocumentHtml(termsDoc);
          } else if (typeof termsDoc === "object") {
            const htmlContent =
              termsDoc.contentHtml ||
              termsDoc.content ||
              termsDoc.html ||
              termsDoc.body ||
              termsDoc.description ||
              termsDoc.text ||
              termsDoc.document ||
              termsDoc.policy ||
              termsDoc.details ||
              termsDoc.value ||
              (typeof termsDoc.data === "string" ? termsDoc.data : "");

            if (htmlContent) {
              setDocumentHtml(htmlContent);
            }
            if (termsDoc.title || termsDoc.name || termsDoc.documentTitle) {
              setTitle(termsDoc.title || termsDoc.name || termsDoc.documentTitle);
            }
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
              Please review the terms and conditions for using our platform and services.
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

export default TermsOfService;
