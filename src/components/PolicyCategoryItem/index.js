import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Users, Clock, Sparkles, ChevronDown, Globe } from "lucide-react";
import { useTheme } from "../JUI/Theme";

function PolicyCategoryItem({ category, isDirectBooking = false }) {
  const { tokens: { FG, A, M, AL, B, W }, theme } = useTheme();
  const [op, setOp] = useState(false);

  const lowerTitle = (category?.title || "").toLowerCase();
  const isCancellationCategory =
    category?.id === 'cat-cancel' ||
    lowerTitle.includes("cancellation");

  if (isDirectBooking && isCancellationCategory) {
    return null;
  }

  const getIcon = () => {
    const lowerTitle = (category.title || "").toLowerCase();
    if (lowerTitle.includes("cancellation")) {
      return <Clock size={20} color={A} />;
    }
    if (lowerTitle.includes("guest") || lowerTitle.includes("requirements")) {
      return <Users size={20} color={A} />;
    }
    if (lowerTitle.includes("foreigner")) {
      return <Globe size={20} color={A} />;
    }
    if (lowerTitle.includes("rule") || lowerTitle.includes("property") || lowerTitle.includes("experience") || lowerTitle.includes("event") || lowerTitle.includes("stay")) {
      return <ShieldCheck size={20} color={A} />;
    }
    return <Sparkles size={20} color={A} />;
  };

  return (
    <>
      <style>{`
        .policy-cat-card {
          border-radius: 16px;
          margin-bottom: 16px;
          border: 1px solid ${B};
          background: ${theme === 'dark' ? '#0A0A0A' : '#FFFFFF'};
          overflow: hidden;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }
        .policy-cat-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          cursor: pointer;
          text-align: left;
          user-select: none;
        }
        .policy-cat-iconbox {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: ${theme === 'dark' ? '#1E293B' : '#F0F9FA'};
          flex-shrink: 0;
        }
        .policy-cat-title {
          font-size: 16px;
          font-weight: 500;
          color: ${FG};
          display: block;
          font-family: "Inter", sans-serif;
        }
        .policy-cat-body {
          padding: 0 24px 24px 80px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @media (max-width: 1023px) {
          .policy-cat-card {
            border-radius: 12px !important;
            margin-bottom: 0 !important;
            box-shadow: none !important;
          }
          .policy-cat-header {
            padding: 14px 16px !important;
            gap: 12px !important;
          }
          .policy-cat-iconbox {
            width: auto !important;
            height: auto !important;
            background: transparent !important;
            border-radius: 0 !important;
          }
          .policy-cat-iconbox svg {
            width: 16px !important;
            height: 16px !important;
          }
          .policy-cat-title {
            font-size: 14px !important;
            font-weight: 700 !important;
          }
          .policy-cat-body {
            padding: 0 16px 16px 16px !important;
            gap: 12px !important;
          }
        }
      `}</style>
      <motion.div
        layout
        className="policy-cat-card"
        whileHover={{ borderColor: A, boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}
      >
        <div
          onClick={() => setOp(!op)}
          className="policy-cat-header"
        >
          <div className="policy-cat-iconbox">
            {getIcon()}
          </div>

          <div style={{ flex: 1 }}>
            <span className="policy-cat-title">{category.title}</span>
          </div>

          <motion.div
            animate={{ rotate: op ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20 }}
          >
            <ChevronDown size={16} color={M} />
          </motion.div>
        </div>

        <AnimatePresence initial={false}>
          {op && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div className="policy-cat-body">
              {category.items.map((item, idx) => (
                <div key={item.id || idx} style={{ borderBottom: idx === category.items.length - 1 ? "none" : `1px solid ${B}`, paddingBottom: idx === category.items.length - 1 ? 0 : 16, paddingTop: idx === 0 ? 0 : 16 }}>
                  {(!item.questions || item.questions.length === 0) && item.title && item.title !== item.body && (
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ width: 5, height: 5, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 7 }} />
                      <span style={{ fontSize: "13px", color: M, lineHeight: 1.6, flex: 1, fontFamily: '"Inter", sans-serif' }}>{item.title}</span>
                    </div>
                  )}
                  {item.questions && item.questions.length > 0 && item.title && item.title !== "Requirement" && (
                    <span style={{ fontSize: "13px", fontWeight: 600, color: FG, display: "block", marginBottom: 8, fontFamily: '"Inter", sans-serif' }}>{item.title}</span>
                  )}
                  {item.body && (
                    <div style={{ fontSize: 13, color: M, lineHeight: 1.6, margin: 0, paddingLeft: (!item.questions || item.questions.length === 0) && item.title && item.title !== item.body ? 17 : 0, fontFamily: '"Inter", sans-serif' }}>
                      {category.title?.toLowerCase().includes('cancellation') && (item.body.includes('\n') || item.body.split('. ').filter(s => s.trim().length > 0).length > 1) ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                          {(item.body.includes('\n') ? item.body.split('\n') : item.body.split('. ')).filter(s => s.trim().length > 0).map((sentence, idx) => (
                            <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                              <div style={{ width: 5, height: 5, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 7 }} />
                              <div style={{ flex: 1, fontSize: 13, color: M, lineHeight: 1.6, fontFamily: '"Inter", sans-serif' }}>
                                {sentence.trim()}{(!item.body.includes('\n') && !sentence.trim().endsWith('.')) ? '.' : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (!item.questions || item.questions.length === 0) && item.title && item.title !== item.body ? (
                        <span style={{ display: "inline-block", fontSize: 12, padding: "3px 10px", borderRadius: 100, background: AL, color: A, fontWeight: 500 }}>
                          {item.body}
                        </span>
                      ) : (
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div style={{ width: 5, height: 5, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 7 }} />
                          <div style={{ flex: 1, fontSize: 13, color: M, lineHeight: 1.6, fontFamily: '"Inter", sans-serif' }}>
                            {item.body}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {item.questions && item.questions.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                      {item.questions.map((q, j) => {
                        const questionTitle = q.title || q.question?.title;
                        const answerText = q.answer?.valueText || q.valueText;
                        return (
                          <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <div style={{ width: 5, height: 5, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 7 }} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                              <span style={{ fontSize: 13, color: M, lineHeight: 1.6, fontFamily: '"Inter", sans-serif' }}>{questionTitle}</span>
                              {answerText && (
                                <div style={{ marginTop: 2 }}>
                                  <span style={{ display: "inline-block", fontSize: 12, padding: "3px 10px", borderRadius: 100, background: AL, color: A, fontWeight: 500 }}>
                                    {answerText}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </>
  );
}

export default PolicyCategoryItem;
