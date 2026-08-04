import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import OutsideClickHandler from 'react-outside-click-handler';
import { ChevronDown } from 'lucide-react';

const ChildAgeSelect = ({ value, onChange, options, style, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [portalStyle, setPortalStyle] = useState({});
  const A = "#15c1c8"; // Cyan accent
  const B = "#e6e8ec";
  const BG = "#ffffff";
  const FG = "#141416";
  const M = "#777e90";
  const AL = "#15c1c815"; // Light cyan hover

  const triggerRef = useRef(null);
  const selectedRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Auto-close on resize to prevent the portal from detaching
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => setIsOpen(false);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Calculate position for the portal dropdown
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If we don't have enough space below, and we have more space above, open upwards
      const shouldOpenUpwards = spaceBelow < 220 && spaceAbove > spaceBelow;

      setPortalStyle({
        position: 'fixed',
        left: rect.left,
        width: Math.max(120, rect.width),
        ...(shouldOpenUpwards 
          ? { bottom: window.innerHeight - rect.top + 6 } 
          : { top: rect.bottom + 6 }),
        zIndex: 100000,
      });

      // Scroll to selected element
      setTimeout(() => {
        if (selectedRef.current && scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const target = selectedRef.current;
          container.scrollTop = target.offsetTop - (container.clientHeight / 2) + (target.clientHeight / 2);
        }
      }, 10);
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setIsOpen(false);
  };

  const displayValue = options.find(opt => String(opt.value) === String(value))?.label || value;

  const baseTriggerStyle = {
    border: `1px solid ${isOpen ? A : `${A}66`}`,
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "13px",
    fontWeight: "700",
    color: isOpen ? A : FG,
    backgroundColor: isOpen ? BG : AL,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    transition: "all 0.2s ease",
    boxShadow: isOpen ? `0 0 0 1px ${A}` : "none",
    ...style, 
  };

  if (isOpen && style && style.border) {
    baseTriggerStyle.border = `1px solid ${A}`;
  }

  return (
    <>
      <div 
        ref={triggerRef} 
        style={{ position: "relative", width: style?.width || "100%" }}
      >
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={baseTriggerStyle}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {displayValue}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronDown size={16} color={isOpen ? A : A} strokeWidth={2.5} />
          </motion.div>
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <OutsideClickHandler onOutsideClick={(e) => {
              // Safely check if the click was on the trigger
              if (e && e.target && triggerRef.current && triggerRef.current.contains(e.target)) {
                return;
              }
              setIsOpen(false);
            }}>
              <motion.div
                ref={scrollContainerRef}
                initial={{ opacity: 0, y: portalStyle.bottom ? 4 : -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: portalStyle.bottom ? 4 : -4 }}
                transition={{ duration: 0.15 }}
                style={{
                  ...portalStyle,
                  backgroundColor: BG,
                  border: `1px solid ${B}`,
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  maxHeight: "180px",
                  overflowY: "auto",
                  padding: "6px",
                }}
              >
                {options.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <div
                      key={opt.value}
                      ref={isSelected ? selectedRef : null}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = AL;
                          e.currentTarget.style.color = A;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = FG;
                        }
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: isSelected ? "700" : "500",
                        color: isSelected ? A : FG,
                        backgroundColor: isSelected ? AL : "transparent",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "2px"
                      }}
                    >
                      {opt.label}
                    </div>
                  );
                })}
              </motion.div>
            </OutsideClickHandler>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ChildAgeSelect;
