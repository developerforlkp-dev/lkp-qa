import React, { useState, useCallback, useRef } from "react";
import { Share2 } from "lucide-react";


const TOAST_DURATION = 3000;

function ShareToast({ message, type, visible }) {
  return (
    <div
      aria-live="polite"
      role="status"
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "20px"})`,
        opacity: visible ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: "none",
        zIndex: 99999,
        background: type === "error"
          ? "linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 100%)"
          : "linear-gradient(135deg, #0f1a1f 0%, #0d2a34 100%)",
        color: "#fff",
        padding: "12px 24px",
        borderRadius: 100,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.02em",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.16)",
        border: type === "error"
          ? "1px solid rgba(255,100,100,0.18)"
          : "1px solid rgba(0, 151, 178, 0.25)",
        backdropFilter: "blur(20px)",
        whiteSpace: "nowrap",
        maxWidth: "90vw",
      }}
    >
      <span style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: type === "error" ? "#FF6A55" : "#0097B2",
        flexShrink: 0,
      }} />
      {message}
    </div>
  );
}

const ShareButton = ({
  title = "",
  text = "",
  url,
  imageUrl,
  tokens,
  style = {},
  className = "",
  size = 18,
  label = "Share",
  showLabel = true,
}) => {
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const toastTimerRef = useRef(null);

  // Theme tokens — fallback to CSS variables → sane defaults
  const A = tokens?.A || "var(--A, #0097B2)";
  const FG = tokens?.FG || "var(--FG, #0F0F0F)";
  const B = tokens?.B || "var(--B, rgba(0,0,0,0.12))";
  const BG = tokens?.BG || "var(--BG, #FBFBF9)";

  const showToast = useCallback((message, type = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, TOAST_DURATION);
  }, []);

  const handleShare = useCallback(async () => {
    const shareUrl = url || window.location.href;
    const shareTitle = title || document.title || "Check this out";
    const shareText = text || (imageUrl ? `${shareTitle} — ${shareUrl}` : shareTitle);

    // Build a clean share data object
    const shareData = {
      title: shareTitle,
      text: shareText,
      url: shareUrl,
    };

    // Try native Web Share API first (mobile browsers)
    if (navigator.share && navigator.canShare) {
      try {
        const canShare = navigator.canShare(shareData);
        if (canShare) {
          await navigator.share(shareData);
          // No toast needed — native sheet appears
          return;
        }
      } catch (err) {
        if (err.name === "AbortError") return; // User dismissed — not an error
        // Fall through to clipboard
      }
    } else if (navigator.share) {
      // canShare not available — try share directly
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
        // Fall through to clipboard
      }
    }

    // Clipboard fallback (desktop)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copied successfully ✓", "success");
      } else {
        // Legacy fallback for very old browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (success) {
          showToast("Link copied successfully ✓", "success");
        } else {
          showToast("Copy failed — please copy the URL manually", "error");
        }
      }
    } catch {
      showToast("Unable to copy link. Please copy the URL manually.", "error");
    }
  }, [url, title, text, imageUrl, showToast]);

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: showLabel ? 8 : 0,
    padding: showLabel ? "9px 18px 9px 14px" : "9px",
    background: isHovered
      ? `rgba(0, 151, 178, 0.12)`
      : "transparent",
    border: `1.5px solid ${isHovered ? A : B}`,
    borderRadius: 100,
    cursor: "pointer",
    color: isHovered ? A : FG,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    letterSpacing: "0.01em",
    transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
    transform: isPressed ? "scale(0.96)" : "scale(1)",
    outline: "none",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    whiteSpace: "nowrap",
    ...style,
  };

  return (
    <>
      <button
        id="lkp-share-button"
        type="button"
        aria-label={`Share: ${title || "this page"}`}
        onClick={handleShare}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleShare(); } }}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        style={buttonStyle}
        className={className}
        tabIndex={0}
      >
        <Share2
          size={size}
          style={{
            transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
            transform: isHovered ? "rotate(-8deg) scale(1.1)" : "none",
          }}
        />
        {showLabel && <span>{label}</span>}
      </button>

      <ShareToast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
    </>
  );
};

export default ShareButton;
