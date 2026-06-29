# Experience Detail Page: Design Specifications Report

This report outlines the typography, layout, spacing, and styling details extracted from the Experience Detail (`ExperienceProduct/index.js`) page. This design system focuses on a premium editorial feel, pairing elegant serifs for headings with clean sans-serifs for body text and utility labels.

## 1. Global Typography Settings
The page utilizes a dual-font strategy:
- **Headings & Display Type**: `"Cormorant Garamond", "Playfair Display", serif`
- **Body & Utility Type**: `"Inter", "Plus Jakarta Sans", sans-serif`

---

## 2. Section Breakdown

### A. Hero Section
The hero banner provides a fully immersive 50vh visual header.

**Layout & Spacing:**
- **Dimensions**: `height: 50vh`, `minHeight: 400px`
- **Container**: `width: calc(100% - 80px)`, `maxWidth: 1600px`, `margin: 0 auto`
- **Inner Padding**: `32px 40px`
- **Border Radius**: `32px`

**Typography:**
- **Hero Title (`h1`)**:
  - Font Family: `"Cormorant Garamond", "Playfair Display", serif`
  - Font Size: `clamp(2.5rem, 4vw, 3.5rem)` (Responsive)
  - Font Weight: `700`
  - Line Height: `1.1`
  - Letter Spacing: `-0.01em`
  - Color: `#FFFFFF` (Accent words feature an italic gradient: `#08B5D6` to `#45D8F2`)
- **Breadcrumbs/Location Subtitle**:
  - Font Family: `"Poppins", sans-serif` / `"Inter", sans-serif`
  - Font Size: `13px` / `14px`
  - Font Weight: `500`
  - Color: `#FFFFFF` / `#E0E0E0`

---

### B. About / Narrative Section
This section uses an asymmetric split grid (Left Narrative vs. Right Specs).

**Layout & Spacing (Grid Container):**
- **Grid Layout**: `gridTemplateColumns: "1.2fr 1fr"`
- **Gap**: `24px`
- **Alignment**: `alignItems: "stretch"`

**Left Narrative Card:**
- **Dimensions/Spacing**: `padding: 36px 48px`, `border-radius: 24px`
- **Styling**: `background: W`, `border: 1px solid B`, `box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04)`
- **Overline (Section Tag)**:
  - Font: `"Inter", sans-serif`
  - Size/Weight: `12px` / `700`
  - Transform: `uppercase`, `letter-spacing: 0.15em`
  - Margin Bottom: `16px`
- **Main Heading (`h3`)**:
  - Font: `"Cormorant Garamond", serif`
  - Size: `clamp(2.5rem, 4vw, 3.5rem)`
  - Weight / Line Height: `700` / `1.1`
  - Margin Bottom: `24px`
- **Body Paragraph (`p`)**:
  - Font: `"Inter", sans-serif`
  - Size / Weight: `16px` / `400`
  - Line Height: `1.7` (Provides high legibility)

**Right Specifications Cards (Grid of 6):**
- **Card Grid Layout**: `gridTemplateColumns: "repeat(2, 1fr)"`, `gap: 16px`
- **Card Styling**: `padding: 24px 20px`, `border-radius: 16px`
- **Value Text**: `16px`, `fontWeight: 700`, `"Inter", sans-serif`
- **Label Text**: `11px`, `fontWeight: 600`, `letterSpacing: 0.1em`, `textTransform: uppercase`

---

### C. Gallery Section (Auto-Scrolling Marquee)
- **Container Width**: `calc(100% - 80px)`, `maxWidth: 1600px`
- **Padding**: `24px 0 32px`
- **Image Cards**: `width: 300px`, `height: 200px`, `border-radius: 24px`
- **Gap**: `16px`

---

### D. Timeline / Journey Section
**Layout & Spacing:**
- **Container**: `padding: 64px 0`, `maxWidth: 1200px`
- **Section Heading Typography**: Matches the "About" section exactly (`h3` clamping, `12px` overline).
- **Paragraph Max-Width**: `600px` to maintain optimal reading line length.

**Activity Cards:**
- **Dimensions**: `height: 180px` (Collapses neatly), `border-radius: 24px`
- **Thumbnail Image Width**: `220px` (Fixed on left)
- **Faint Background Number**:
  - Font: `"Cormorant Garamond", serif`
  - Size: `80px`
  - Weight: `700`
  - Letter Spacing: `-0.05em`
  - Margin Right: `32px`
- **Activity Title**: `12px`, `fontWeight: 700`, `letterSpacing: 0.15em`, `textTransform: uppercase`
- **Activity Description**: `14px`, `lineHeight: 1.6`, `fontWeight: 400`, max-width `600px`

---

### E. Add-ons / Enhancements Section
- **Container**: `padding: 64px 0`, `maxWidth: 1200px`
- **Slider Gap**: `20px` spacing between cards
- **Add-on Card Styling**:
  - **Dimensions**: `height: 115px`, width calculated dynamically via flex slider.
  - **Border Radius**: `16px`
  - **Image Thumbnail**: `width: 160px` (Fixed on left)
  - **Box Shadow**: `0 4px 20px rgba(0, 0, 0, 0.05)`

## 3. Design Tokens Summary
| Property | Token / Value | Usage |
|----------|---------------|-------|
| **Serif Font** | `"Cormorant Garamond"` | Hero Titles, Section Headings, Large Numbers |
| **Sans Font** | `"Inter"` | Paragraphs, UI Labels, Subtitles, Tags |
| **Heading Size** | `clamp(2.5rem, 4vw, 3.5rem)` | Standard Section H3 Header |
| **Body Text** | `16px` (Line height: `1.7`) | Narrative body text |
| **Micro Labels** | `11px` - `12px` (`uppercase`, `tracking: 0.15em`) | Overlines, card spec labels |
| **Border Radius** | `32px` (Hero), `24px` (Main Cards), `16px` (Small Cards) | System-wide rounding |
| **Section Spacing**| `64px 0` | Vertical padding between main sections |
