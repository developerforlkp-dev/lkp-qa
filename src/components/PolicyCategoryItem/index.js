import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Users, Clock, Sparkles, ChevronDown } from "lucide-react";
import { useTheme } from "../JUI/Theme";

function PolicyCategoryItem({ category }) {
  const { tokens: { FG, A, M, AL, B, W }, theme } = useTheme();
  const [op, setOp] = useState(false);

  const getIcon = () => {
    const lowerTitle = (category.title || "").toLowerCase();
    if (lowerTitle.includes("cancellation")) {
      return <Clock size={20} color={A} />;
    }
    if (lowerTitle.includes("guest") || lowerTitle.includes("requirements")) {
      return <Users size={20} color={A} />;
    }
    if (lowerTitle.includes("rule") || lowerTitle.includes("property") || lowerTitle.includes("experience") || lowerTitle.includes("event") || lowerTitle.includes("stay")) {
      return <ShieldCheck size={20} color={A} />;
    }
    return <Sparkles size={20} color={A} />;
  };

  return (
    <motion.div
      layout
      style={{
        background: theme === 'dark' ? '#0A0A0A' : '#FFFFFF',
        border: `1px solid ${B}`,
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "16px",
        transition: "all 0.3s",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
      }}
      whileHover={{ borderColor: A, boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}
    >
      <div
        onClick={() => setOp(!op)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 24px",
          cursor: "pointer",
          textAlign: "left",
          userSelect: "none",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 8,
          background: theme === 'dark' ? '#1E293B' : '#F0F9FA',
          flexShrink: 0,
        }}>
          {getIcon()}
        </div>

        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "16px", fontWeight: 500, color: FG, display: "block", fontFamily: '"Inter", sans-serif' }}>{category.title}</span>
        </div>

        <motion.div
          animate={{ rotate: op ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: op ? W : "transparent" }}
        >
          <ChevronDown size={18} color={M} />
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
            <div style={{ padding: "0 24px 24px 80px", display: "flex", flexDirection: "column", gap: 16 }}>
              {category.items.map((item, idx) => (
                <div key={item.id || idx} style={{ borderBottom: idx === category.items.length - 1 ? "none" : `1px solid ${B}`, paddingBottom: idx === category.items.length - 1 ? 0 : 16, paddingTop: idx === 0 ? 0 : 16 }}>
                  {item.title && item.title !== item.body && (
                    <span style={{ fontSize: "14px", fontWeight: 700, color: FG, display: "block", marginBottom: 6 }}>{item.title}</span>
                  )}
                  {item.body && (
                    <p style={{ fontSize: 13, color: M, lineHeight: 1.6, whiteSpace: "pre-line", margin: 0 }}>
                      {item.body}
                    </p>
                  )}
                  {item.questions && item.questions.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                      {item.questions.map((q, j) => {
                        const questionTitle = q.title || q.question?.title;
                        const answerText = q.answer?.valueText || q.valueText;
                        return (
                          <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <div style={{ width: 6, height: 6, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 7 }} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: 13, color: FG, lineHeight: 1.4, fontWeight: 500 }}>{questionTitle}</span>
                              {answerText && (
                                <span style={{ fontSize: 12, color: M, lineHeight: 1.4 }}>{answerText}</span>
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
  );
}

export default PolicyCategoryItem;
