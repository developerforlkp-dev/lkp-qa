import React from "react";
import { Sparkles } from "lucide-react";
import { useTheme } from "../JUI/Theme";
import "./DetailMarquee.css";

const getItemLabel = (item) => {
  if (typeof item === "string" || typeof item === "number") return String(item).trim();
  if (!item || typeof item !== "object") return "";
  return String(item.name || item.title || item.tag || item.label || item.value || "").trim();
};

const estimateSetWidth = (items, charWidth, chromeWidth) => (
  items.reduce((total, item) => total + (item.length * charWidth) + chromeWidth, 0)
);

const DetailMarquee = ({ items = [] }) => {
  const { theme, tokens: { A, B, FG, M } } = useTheme();
  const normalizedItems = (Array.isArray(items) ? items : [items])
    .map(getItemLabel)
    .filter(Boolean);

  if (normalizedItems.length === 0) return null;

  // Keep enough paired copies for a seamless -50% loop at every viewport width.
  const minimumCopies = Math.max(4, Math.ceil(24 / normalizedItems.length));
  const copyCount = minimumCopies % 2 === 0 ? minimumCopies : minimumCopies + 1;
  const loopedItems = Array(copyCount).fill(normalizedItems).flat();
  const halfTrackCopies = copyCount / 2;

  // Use a clearly visible 32px/s desktop glide while retaining
  // the existing, more compact 45px/s mobile cadence.
  const desktopDistance = estimateSetWidth(normalizedItems, 9.5, 75) * halfTrackCopies;
  const mobileDistance = estimateSetWidth(normalizedItems, 7.2, 56) * halfTrackCopies;
  const desktopDuration = Math.max(desktopDistance / 32, 1);
  const mobileDuration = Math.max(mobileDistance / 45, 1);
  const accent = A || "#08B5D6";

  return (
    <div className="detail-marquee-shell">
      <div
        className="detail-marquee"
        style={{
          background: theme === "dark" ? "rgba(255,255,255,.01)" : "rgba(0,0,0,.005)",
          borderTop: `1px solid ${B}`,
          borderBottom: `1px solid ${B}`,
          "--detail-marquee-duration-desktop": `${desktopDuration}s`,
          "--detail-marquee-duration-mobile": `${mobileDuration}s`,
        }}
      >
        <div className="detail-marquee-track">
          {loopedItems.map((item, index) => {
            const isEmphasized = index % 2 === 0;
            return (
              <div className="detail-marquee-item" key={`${item}-${index}`}>
                <span
                  className="detail-marquee-text"
                  style={{
                    color: isEmphasized ? FG : M,
                    fontWeight: isEmphasized ? 700 : 300,
                    opacity: isEmphasized ? 1 : .75,
                  }}
                >
                  {item}
                </span>
                <Sparkles
                  className="detail-marquee-icon"
                  size={14}
                  color={accent}
                  fill={accent}
                  style={{ opacity: .6, flexShrink: 0 }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DetailMarquee;
