# Detail Pages Design System Analysis

A comprehensive pixel-by-pixel breakdown of the design tokens, typography, and styling found across the Experience, Event, and Stay detail pages.

## Typography System

### 1. Hero & Primary Headings (H1/H2)
The most prominent text on the page, used for listing titles and major section headers.
- **Font Family:** `"Cormorant Garamond", "Playfair Display", serif` (Provides a premium, editorial feel)
- **Font Size:** Dynamic using clamp, e.g., `clamp(2.5rem, 4vw, 3.5rem)` (Experience/Stay) or `clamp(3.5rem, 6vw, 5.5rem)` (Event)
- **Font Weight:** `700` (Bold) or `900` (Black)
- **Letter Spacing:** `-0.02em` to `-0.04em` (Tighter spacing for large serif fonts)
- **Line Height:** `1` to `1.1`
- **Color:** `FG` (Foreground token, adapts to dark/light mode)

### 2. Section Subheadings (H3)
Used for distinct areas within a section (e.g., "Share your stay", "Location & Details").
- **Font Size:** `18px`, `24px`, or `28px` (Often scales with `isMobile` checks)
- **Font Weight:** `700` or `800`
- **Font Family:** Inherits sans-serif usually, or explicitly `"Inter", sans-serif`
- **Margin Bottom:** Typically `8px` or `16px`
- **Color:** `FG`

### 3. Body Text (Paragraphs)
Used for descriptions, narrative text, and general information.
- **Font Family:** `"Inter", sans-serif`
- **Font Size:** `13px`, `14px` (Standard), up to `16px` for intro paragraphs.
- **Font Weight:** `400` (Regular) or `500` (Medium)
- **Line Height:** `1.5`, `1.6`, or `1.7` (High line-height for readability)
- **Color:** `M` (Muted) for secondary descriptions, `FG` for primary text.

### 4. Microcopy, Labels & Captions
Used for category badges, metadata labels, and interactive hints (e.g., "Verified Explorer", "Address", "Benchmark Score").
- **Font Size:** `9px`, `10px`, `11px`, or `12px`
- **Font Weight:** `600`, `700`, `800`, or `900`
- **Text Transform:** `uppercase`
- **Letter Spacing:** Extremely wide, ranging from `0.05em` to `0.3em` (e.g., `letterSpacing: "0.15em"`)
- **Color:** `A` (Accent color) or `M` (Muted)
- **Usage Context:** Often combined with `display: block` and a small `marginBottom` (e.g., `6px` or `12px`) to sit right above a larger value.

## Color Theme & Tokens

The application heavily utilizes a centralized theme token system (`useTheme()`):

- **`A` (Accent):** The primary brand color (e.g., `#0097B2` cyan/teal). Used for interactive elements, highlights, active states, and emphasis labels.
- **`FG` (Foreground):** The primary text color. High contrast (e.g., `#141414` in light mode, `#FFFFFF` in dark mode).
- **`BG` (Background):** The primary page background.
- **`M` (Muted):** Secondary text color, typically a grayish hue for descriptions and less important data.
- **`B` (Border):** Subtle border lines and dividers.
- **`W` (White/Surface):** Card backgrounds or surface elements that need to stand out from `BG`.
- **`AL` (Alpha/Light):** Often used for subtle background fills behind icons or badges.

## UI Elements & Micro-Interactions

### Interactive Components (Buttons, Chips, Fabs)
- **Border Radius:** Heavy use of fully rounded pill shapes (`borderRadius: 100` or `50%`) and softer card corners (`borderRadius: 12` to `20`).
- **Shadows & Elevation:** 
  - Subtle resting state: `boxShadow: '0 8px 24px rgba(0,0,0,0.06)'`
  - Floating Action Buttons (FABs) utilize layered shadows and glowing effects (e.g., combining the Accent color with an alpha channel).
- **Animations:** Powered by `framer-motion` (`whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.86 }}`).
- **Glassmorphism:** Elements overlaying hero images often use `backdropFilter: 'blur(20px)'` paired with a semi-transparent background (e.g., `${A}20`).

### Layout & Spacing
- **Gap & Flex:** Extensive use of `display: "flex"` with explicit `gap` values (e.g., `gap: 12`, `gap: 16`).
- **Margins:** Tight margins for grouped text (`marginBottom: 4` or `8`), and larger breathing room between sections (`padding: 40px 0` or `margin: 0 0 16px 0`).
- **Clamping Text:** For dynamic descriptions, `-webkit-box` and `WebkitLineClamp` are used to truncate long blocks (e.g., 3-4 lines) to maintain consistent card heights.
