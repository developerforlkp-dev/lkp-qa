import React, { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Search, MapPin, Calendar, Users, ChevronUp, ChevronDown, X, ArrowRight, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import moment from "moment";
import cn from "classnames";

// ─── Scoped global styles (mobile-only, injected once) ────────────────────────
const STYLE_ID = "mcsh-styles-v4";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    /* Hide all mobile cinematic elements on desktop by default */
    .mcsh-pill-wrap,
    .mcsh-sticky-pill-wrap,
    .mcsh-backdrop,
    .mcsh-sheet {
      display: none;
    }

    /* ─── Search Trigger Pill ──────────────────────────────────────────── */
    @media (max-width: 1023px) {
      /* Pill wrap: positioned at bottom of heroSection, hanging BELOW the edge */
      .mcsh-pill-wrap {
        display: flex;
        position: absolute;
        bottom: -32px;
        left: 0;
        right: 0;
        justify-content: center;
        z-index: 200;
        pointer-events: none;
        padding: 0 20px;
      }

      /* ── Pill — LIGHT MODE (default) ── */
      .mcsh-pill {
        display: flex;
        align-items: center;
        gap: 14px;
        background: #ffffff;
        border: none;
        border-radius: 100px;
        padding: 10px 24px 10px 10px;
        width: 100%;
        max-width: 450px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.06);
        cursor: pointer;
        pointer-events: auto;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .mcsh-pill:active {
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        transform: scale(0.98);
      }
      .mcsh-pill-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #00B4D8;
        line-height: 1;
      }
      .mcsh-pill-summary {
        font-size: 15px;
        font-weight: 500;
        color: #2D3748;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.3;
      }
      .mcsh-pill-chevron {
        flex-shrink: 0;
        color: #4A5568;
        display: flex;
        align-items: center;
      }

      /* ── Pill — DARK MODE override ── */
      .dark-mode .mcsh-pill {
        background: #1A202C;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      }
      .dark-mode .mcsh-pill-label { color: #00B4D8; }
      .dark-mode .mcsh-pill-summary { color: #E2E8F0; }
      .dark-mode .mcsh-pill-chevron { color: #A0AEC0; }

      /* Pill icon — same in both themes */
      .mcsh-pill-icon {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #00B4D8;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .mcsh-pill-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;
      }

      /* ─── Backdrop ─────────────────────────────────────────────────────── */
      .mcsh-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 10000;
        touch-action: none;
      }
      .dark-mode .mcsh-backdrop {
        background: rgba(0, 0, 0, 0.60);
      }

      /* ─── Bottom Sheet — LIGHT MODE (default) ──────────────────────────── */
      .mcsh-sheet {
        display: block;
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10005;
        border-radius: 28px 28px 0 0;
        background: rgba(250, 251, 253, 0.97);
        backdrop-filter: blur(32px);
        -webkit-backdrop-filter: blur(32px);
        border-top: 1px solid rgba(0,0,0,0.07);
        border-left: 1px solid rgba(0,0,0,0.04);
        border-right: 1px solid rgba(0,0,0,0.04);
        box-shadow: 0 -8px 40px rgba(0,0,0,0.12), 0 -2px 8px rgba(0,0,0,0.06);
        padding-bottom: env(safe-area-inset-bottom, 20px);
        max-height: 92vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      /* ── Bottom Sheet — DARK MODE ── */
      .dark-mode .mcsh-sheet {
        background: rgba(12, 13, 18, 0.97);
        border-top: 1px solid rgba(255,255,255,0.08);
        border-left: 1px solid rgba(255,255,255,0.05);
        border-right: 1px solid rgba(255,255,255,0.05);
        box-shadow: 0 -24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,210,255,0.06);
      }

      /* Sheet drag handle */
      .mcsh-handle-row {
        display: flex;
        justify-content: center;
        padding: 12px 0 0;
      }
      .mcsh-handle {
        width: 36px;
        height: 4px;
        border-radius: 4px;
        background: rgba(0,0,0,0.12);
      }
      .dark-mode .mcsh-handle { background: rgba(255,255,255,0.18); }

      /* Sheet header */
      .mcsh-sheet-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 24px 20px 12px;
      }
      .mcsh-header-text-wrap {
        flex: 1;
        padding-right: 12px;
      }
      .mcsh-sheet-title {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #0097B2;
        display: block;
        line-height: 1.3;
      }
      .dark-mode .mcsh-sheet-title { color: #00D2FF; }
      .mcsh-sheet-subtitle {
        font-size: 11px;
        font-weight: 400;
        color: rgba(60, 66, 87, 0.65);
        display: block;
        line-height: 1.4;
        margin-top: 2px;
      }
      .dark-mode .mcsh-sheet-subtitle {
        color: rgba(255, 255, 255, 0.55);
      }

      /* Inline switcher styles */
      .mcsh-switcher-wrap {
        padding: 6px 20px 14px;
        display: block;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none; /* Hide scrollbar for Firefox */
        -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
        width: 100%;
        box-sizing: border-box;
      }
      .mcsh-switcher-wrap::-webkit-scrollbar {
        display: none; /* Hide scrollbar for Chrome/Safari */
      }
      .mcsh-switcher {
        display: flex;
        gap: 4px;
        background: rgba(0, 0, 0, 0.03);
        border: 1px solid rgba(0, 0, 0, 0.05);
        padding: 3px;
        border-radius: 100px;
        width: max-content;
        position: relative;
        margin: 0 auto;
      }
      .dark-mode .mcsh-switcher {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      .mcsh-switcher-btn {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 12px;
        border-radius: 100px;
        border: none;
        background: transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        outline: none;
        transition: transform 0.2s ease;
        opacity: 0.6;
        flex-shrink: 0;
      }
      .mcsh-switcher-btn:hover {
        opacity: 0.85;
      }
      .mcsh-switcher-btn.active {
        opacity: 1;
      }
      .mcsh-switcher-btn:disabled {
        opacity: 0.25;
        cursor: not-allowed;
        pointer-events: none;
      }
      .mcsh-switcher-label {
        position: relative;
        font-size: 12px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.6);
        z-index: 2;
        transition: color 0.25s ease;
      }
      .dark-mode .mcsh-switcher-label {
        color: rgba(255, 255, 255, 0.5);
      }
      .mcsh-switcher-btn.active .mcsh-switcher-label {
        color: #0097B2;
      }
      .dark-mode .mcsh-switcher-btn.active .mcsh-switcher-label {
        color: #00D2FF;
      }
      
      /* Active sliding highlight */
      .mcsh-active-highlight {
        position: absolute;
        inset: 0;
        border-radius: 100px;
        background: linear-gradient(135deg, rgba(0, 210, 255, 0.05) 0%, rgba(0, 151, 178, 0.08) 100%);
        border: 1px solid rgba(0, 151, 178, 0.22);
        box-shadow: 0 2px 10px rgba(0, 151, 178, 0.12);
        z-index: 1;
      }
      .dark-mode .mcsh-active-highlight {
        background: linear-gradient(135deg, rgba(0, 210, 255, 0.08) 0%, rgba(0, 151, 178, 0.12) 100%);
        border: 1px solid rgba(0, 210, 255, 0.35);
        box-shadow: 0 0 14px rgba(0, 210, 255, 0.25);
      }

      .mcsh-close-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid rgba(0,0,0,0.1);
        background: rgba(0,0,0,0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: rgba(0,0,0,0.45);
        margin-top: 2px;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.2s ease, color 0.2s ease;
      }
      .mcsh-close-btn:active {
        background: rgba(0,0,0,0.1);
        color: rgba(0,0,0,0.8);
      }
      .dark-mode .mcsh-close-btn {
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.55);
      }
      .dark-mode .mcsh-close-btn:active {
        background: rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.9);
      }

      /* Sheet form */
      .mcsh-form {
        padding: 12px 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      /* Field rows — LIGHT MODE */
      .mcsh-field {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(0,0,0,0.04);
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 16px;
        padding: 14px 16px;
        transition: border-color 0.2s ease, background 0.2s ease;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .mcsh-field.active {
        border-color: rgba(0, 151, 178, 0.45);
        background: rgba(0, 151, 178, 0.05);
      }
      /* Field rows — DARK MODE */
      .dark-mode .mcsh-field {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
      }
      .dark-mode .mcsh-field.active {
        border-color: rgba(0, 210, 255, 0.4);
        background: rgba(0, 210, 255, 0.06);
      }

      .mcsh-field-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(0, 151, 178, 0.1);
        border: 1px solid rgba(0, 151, 178, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: #0097B2;
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, border-color 0.2s ease;
      }
      .dark-mode .mcsh-field-icon {
        background: rgba(0, 210, 255, 0.1);
        border: 1px solid rgba(0, 210, 255, 0.18);
        color: #00D2FF;
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, border-color 0.2s ease;
      }
      .mcsh-field.active .mcsh-field-icon {
        transform: scale(1.06);
        background: rgba(0, 151, 178, 0.18);
        border-color: rgba(0, 151, 178, 0.35);
      }
      .dark-mode .mcsh-field.active .mcsh-field-icon {
        background: rgba(0, 210, 255, 0.18);
        border-color: rgba(0, 210, 255, 0.35);
      }

      .mcsh-field-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      /* Field label — LIGHT */
      .mcsh-field-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(0,0,0,0.35);
        line-height: 1;
      }
      .dark-mode .mcsh-field-label { color: rgba(255,255,255,0.38); }

      /* Field value — LIGHT */
      .mcsh-field-value {
        font-size: 15px;
        font-weight: 600;
        color: #141416;
        letter-spacing: 0.01em;
        line-height: 1.35;
        user-select: none;
      }
      .dark-mode .mcsh-field-value { color: rgba(255,255,255,0.9); }
      .mcsh-field-value.placeholder { color: rgba(0,0,0,0.28); font-weight: 500; }
      .dark-mode .mcsh-field-value.placeholder { color: rgba(255,255,255,0.3); }

      /* Field input — LIGHT */
      .mcsh-field-input {
        background: transparent;
        border: none;
        outline: none;
        font-size: 15px;
        font-weight: 600;
        color: #141416;
        letter-spacing: 0.01em;
        line-height: 1.35;
        width: 100%;
        padding: 0;
        font-family: inherit;
      }
      .dark-mode .mcsh-field-input { color: rgba(255,255,255,0.9); }
      .mcsh-field-input::placeholder { color: rgba(0,0,0,0.28); font-weight: 500; }
      .dark-mode .mcsh-field-input::placeholder { color: rgba(255,255,255,0.3); }

      /* Destination suggestions — LIGHT */
      .mcsh-suggestions {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        background: rgba(250, 251, 253, 0.99);
        border: 1px solid rgba(0,151,178,0.15);
        border-radius: 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        z-index: 10010;
        overflow: hidden;
        max-height: 200px;
        overflow-y: auto;
      }
      .dark-mode .mcsh-suggestions {
        background: rgba(18, 20, 26, 0.99);
        border: 1px solid rgba(0, 210, 255, 0.15);
        box-shadow: 0 12px 40px rgba(0,0,0,0.55);
      }
      .mcsh-suggestion-item {
        width: 100%;
        text-align: left;
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(0,0,0,0.06);
        padding: 12px 16px;
        color: rgba(0,0,0,0.75);
        font-size: 13px;
        font-weight: 500;
        line-height: 1.4;
        cursor: pointer;
        font-family: inherit;
        display: flex;
        align-items: center;
        gap: 10px;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.15s ease;
      }
      .dark-mode .mcsh-suggestion-item {
        border-bottom: 1px solid rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.8);
      }
      .mcsh-suggestion-item:last-child { border-bottom: none; }
      .mcsh-suggestion-item:active,
      .mcsh-suggestion-item.active { background: rgba(0, 151, 178, 0.08); }
      .dark-mode .mcsh-suggestion-item:active,
      .dark-mode .mcsh-suggestion-item.active { background: rgba(0, 210, 255, 0.08); }

      /* Search button — same in both themes */
      .mcsh-search-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 16px 24px;
        border-radius: 16px;
        background: linear-gradient(135deg, #00D2FF 0%, #0097B2 100%);
        border: none;
        font-size: 15px;
        font-weight: 700;
        color: #fff;
        letter-spacing: 0.04em;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        box-shadow: 0 4px 24px rgba(0, 180, 220, 0.4), 0 0 0 1px rgba(0,210,255,0.2);
        transition: transform 0.18s ease, box-shadow 0.18s ease;
        margin-top: 4px;
        font-family: inherit;
      }
      .mcsh-search-btn:active {
        transform: scale(0.97);
        box-shadow: 0 2px 12px rgba(0, 180, 220, 0.3);
      }

      /* ─── Destination field wrapper (for suggestions positioning) */
      .mcsh-dest-wrap {
        position: relative;
      }

      /* ─── Inline Calendar Container ─────────────────────────────────────── */
      /* Calendar rendered INLINE below Date field — not absolute */
      .mcsh-calendar-inline {
        border-radius: 18px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.98);
        border: 1px solid rgba(0, 151, 178, 0.16);
        box-shadow: 0 6px 28px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(0, 151, 178, 0.08);
        padding: 18px 14px 16px;
        margin-top: 2px;
      }
      .dark-mode .mcsh-calendar-inline {
        background: rgba(10, 12, 18, 0.94);
        backdrop-filter: blur(28px) saturate(160%);
        -webkit-backdrop-filter: blur(28px) saturate(160%);
        border: 1px solid rgba(0, 210, 255, 0.14);
        box-shadow:
          0 8px 40px rgba(0, 0, 0, 0.55),
          0 0 0 1px rgba(0, 210, 255, 0.07),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      /* Calendar Header Row */
      .mcsh-cal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
        padding: 0 2px;
      }
      .mcsh-cal-month-label {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: #141416;
      }
      .dark-mode .mcsh-cal-month-label {
        color: rgba(255,255,255,0.95);
      }
      .mcsh-cal-nav-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 1px solid rgba(0, 151, 178, 0.2);
        background: rgba(0, 151, 178, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #0097B2;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
        flex-shrink: 0;
      }
      .mcsh-cal-nav-btn:active {
        background: rgba(0, 151, 178, 0.18);
        border-color: rgba(0, 151, 178, 0.45);
      }
      .mcsh-cal-nav-btn:disabled {
        opacity: 0.25;
        pointer-events: none;
      }
      .dark-mode .mcsh-cal-nav-btn {
        border: 1px solid rgba(0, 210, 255, 0.2);
        background: rgba(0, 210, 255, 0.07);
        color: rgba(0, 210, 255, 0.85);
      }
      .dark-mode .mcsh-cal-nav-btn:active {
        background: rgba(0, 210, 255, 0.18);
        border-color: rgba(0, 210, 255, 0.45);
      }

      /* Calendar Grid */
      .mcsh-cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        width: 100%;
      }

      /* Day headers (S M T W T F S) */
      .mcsh-cal-day-header {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px 0 8px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(0, 151, 178, 0.55);
      }
      .dark-mode .mcsh-cal-day-header {
        color: rgba(0, 210, 255, 0.5);
      }

      /* Calendar Day cells */
      .mcsh-cal-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 0;
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: #141416;
        border-radius: 50%;
        font-family: inherit;
        transition: background 0.15s ease, color 0.15s ease, transform 0.12s ease;
        -webkit-tap-highlight-color: transparent;
        position: relative;
      }
      .dark-mode .mcsh-cal-day {
        color: rgba(255, 255, 255, 0.78);
      }
      .mcsh-cal-day:active:not(:disabled) {
        transform: scale(0.9);
      }
      .mcsh-cal-day:not(:disabled):hover:not(.mcsh-cal-day-selected):not(.mcsh-cal-day-empty) {
        background: rgba(0, 151, 178, 0.1);
        color: #0097B2;
      }
      .dark-mode .mcsh-cal-day:not(:disabled):hover:not(.mcsh-cal-day-selected):not(.mcsh-cal-day-empty) {
        background: rgba(0, 210, 255, 0.12);
        color: rgba(255, 255, 255, 0.95);
      }

      /* Empty cell */
      .mcsh-cal-day-empty {
        cursor: default;
        pointer-events: none;
      }

      /* Past / Disabled */
      .mcsh-cal-day-past,
      .mcsh-cal-day-disabled {
        color: rgba(0, 0, 0, 0.2) !important;
        cursor: not-allowed;
        font-weight: 400;
      }
      .dark-mode .mcsh-cal-day-past,
      .dark-mode .mcsh-cal-day-disabled {
        color: rgba(255, 255, 255, 0.18) !important;
      }

      /* Today highlight */
      .mcsh-cal-day-today:not(.mcsh-cal-day-selected) {
        border: 1px solid rgba(0, 151, 178, 0.35);
        color: #0097B2;
        font-weight: 700;
      }
      .dark-mode .mcsh-cal-day-today:not(.mcsh-cal-day-selected) {
        border: 1px solid rgba(0, 210, 255, 0.35);
        color: rgba(0, 210, 255, 0.9);
        font-weight: 700;
      }

      /* Selected day — cyan glow pill */
      .mcsh-cal-day-selected {
        background: linear-gradient(135deg, #00D2FF 0%, #0097B2 100%) !important;
        color: #fff !important;
        font-weight: 700;
        box-shadow: 0 2px 12px rgba(0, 180, 220, 0.55), 0 0 0 2px rgba(0, 210, 255, 0.18);
        border: none !important;
        transform: scale(1.05) !important;
      }

      /* Guest picker inside sheet — same inline pattern */
      .mcsh-guest-inline {
        border-radius: 18px;
        overflow: hidden;
        margin-top: 2px;
      }

      /* ─── Premium Mobile Guest Selector ─────────────────────────────────── */
      .mcsh-guest-selector {
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.98);
        border: 1px solid rgba(0, 151, 178, 0.16);
        box-shadow: 0 6px 28px rgba(0, 0, 0, 0.10), 0 0 0 1px rgba(0, 151, 178, 0.08);
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .dark-mode .mcsh-guest-selector {
        background: rgba(10, 12, 18, 0.94);
        backdrop-filter: blur(28px) saturate(160%);
        -webkit-backdrop-filter: blur(28px) saturate(160%);
        border: 1px solid rgba(0, 210, 255, 0.14);
        box-shadow:
          0 8px 40px rgba(0, 0, 0, 0.55),
          0 0 0 1px rgba(0, 210, 255, 0.07),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      .mcsh-gs-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      }
      .dark-mode .mcsh-gs-row {
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .mcsh-gs-row:last-child {
        border-bottom: none;
      }

      .mcsh-gs-info {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .mcsh-gs-label {
        font-size: 15px;
        font-weight: 700;
        color: #141416;
        letter-spacing: 0.01em;
      }
      .dark-mode .mcsh-gs-label {
        color: rgba(255, 255, 255, 0.95);
      }

      .mcsh-gs-subtitle {
        font-size: 12px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.45);
      }
      .dark-mode .mcsh-gs-subtitle {
        color: rgba(255, 255, 255, 0.45);
      }

      .mcsh-gs-counter {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .mcsh-gs-value {
        font-size: 16px;
        font-weight: 700;
        color: #141416;
        min-width: 24px;
        text-align: center;
      }
      .dark-mode .mcsh-gs-value {
        color: rgba(255, 255, 255, 0.95);
      }

      /* Premium touch-friendly counter buttons */
      .mcsh-gs-btn {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 1px solid rgba(0, 151, 178, 0.22);
        background: rgba(0, 151, 178, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #0097B2;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        -webkit-tap-highlight-color: transparent;
        padding: 0;
      }
      .mcsh-gs-btn:active:not(:disabled) {
        transform: scale(0.88);
        background: rgba(0, 151, 178, 0.15);
      }
      .dark-mode .mcsh-gs-btn {
        border: 1px solid rgba(0, 210, 255, 0.25);
        background: rgba(0, 210, 255, 0.06);
        color: #00D2FF;
      }
      .dark-mode .mcsh-gs-btn:active:not(:disabled) {
        background: rgba(0, 210, 255, 0.18);
        box-shadow: 0 0 10px rgba(0, 210, 255, 0.2);
      }
      .mcsh-gs-btn:disabled {
        opacity: 0.25;
        cursor: not-allowed;
        background: transparent;
        border-color: rgba(0, 0, 0, 0.1);
        color: rgba(0, 0, 0, 0.25);
      }
      .dark-mode .mcsh-gs-btn:disabled {
        border-color: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.2);
        background: transparent;
      }

      /* Premium Done Button inside mobile guest selector */
      .mcsh-gs-done-btn {
        display: block;
        width: 100%;
        padding: 12px 16px;
        border-radius: 12px;
        background: rgba(0, 151, 178, 0.1);
        border: 1px solid rgba(0, 151, 178, 0.25);
        font-size: 14px;
        font-weight: 700;
        color: #0097B2;
        text-align: center;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        margin-top: 16px;
        font-family: inherit;
      }
      .mcsh-gs-done-btn:active {
        transform: scale(0.98);
        background: rgba(0, 151, 178, 0.18);
      }
      .dark-mode .mcsh-gs-done-btn {
        background: rgba(0, 210, 255, 0.08);
        border: 1px solid rgba(0, 210, 255, 0.25);
        color: #00D2FF;
        box-shadow: 0 0 10px rgba(0, 210, 255, 0.05);
      }
      .dark-mode .mcsh-gs-done-btn:active {
        background: rgba(0, 210, 255, 0.15);
        box-shadow: 0 0 14px rgba(0, 210, 255, 0.12);
      }

      /* ─── Floating Sticky Search Bar Pill ───────────────────────────────── */
      @media (max-width: 1023px) {
        .mcsh-sticky-pill-wrap {
          display: flex;
          position: fixed;
          top: 68px; /* below top navbar/header */
          left: 0;
          right: 0;
          justify-content: center;
          z-index: 90;
          pointer-events: none;
          padding: 0 20px;
        }
        .mcsh-sticky-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(14px) saturate(180%);
          -webkit-backdrop-filter: blur(14px) saturate(180%);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 100px;
          padding: 0 18px;
          height: 42px;
          max-width: 100%;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);
          cursor: pointer;
          pointer-events: auto;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          transition: box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease, transform 0.2s ease;
        }
        .mcsh-sticky-pill:active {
          transform: scale(0.97);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.15);
        }
        .mcsh-sticky-pill-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .mcsh-sticky-pill-icon svg {
          stroke: #0097B2;
          transition: stroke 0.3s ease;
        }
        .mcsh-sticky-pill-summary {
          font-size: 13px;
          font-weight: 600;
          color: #18181b;
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
          font-family: inherit;
          transition: color 0.3s ease;
        }

        /* Dark mode overrides */
        .dark-mode .mcsh-sticky-pill {
          background: rgba(10, 14, 22, 0.82);
          border: 1px solid rgba(0, 210, 255, 0.20);
          box-shadow: 0 0 14px rgba(0, 210, 255, 0.12), 0 8px 32px rgba(0, 0, 0, 0.45);
        }
        .dark-mode .mcsh-sticky-pill:active {
          box-shadow: 0 0 20px rgba(0, 210, 255, 0.25), 0 8px 36px rgba(0, 0, 0, 0.55);
          border-color: rgba(0, 210, 255, 0.40);
        }
        .dark-mode .mcsh-sticky-pill-icon svg {
          stroke: #00D2FF;
        }
        .dark-mode .mcsh-sticky-pill-summary {
          color: rgba(255, 255, 255, 0.95);
        }
      }

    }
  `;
  document.head.appendChild(el);
}

// ─── Tiny inline calendar component ───────────────────────────────────────────

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];
  for (let i = 0; i < firstDay; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d));
  return grid;
}

function MobileInlineCalendar({ selectedDate, onDateSelect, onClose }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(
    selectedDate ? new Date(selectedDate).getMonth() : now.getMonth()
  );
  const [currentYear, setCurrentYear] = React.useState(
    selectedDate ? new Date(selectedDate).getFullYear() : now.getFullYear()
  );

  const grid = buildCalendarGrid(currentYear, currentMonth);
  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;

  const isToday = (date) =>
    date &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isSelected = (date) => {
    if (!date || !selectedDateObj) return false;
    return date.toDateString() === selectedDateObj.toDateString();
  };

  const isPrevDisabled = () => {
    const today = new Date();
    return currentYear < today.getFullYear() || 
      (currentYear === today.getFullYear() && currentMonth <= today.getMonth());
  };

  const handlePrev = () => {
    if (isPrevDisabled()) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleDayClick = (date) => {
    if (!date || isPast(date)) return;
    const formatted = moment(date).format("MMM DD, YYYY");
    onDateSelect?.(formatted, formatted);
    setTimeout(() => onClose?.(), 150);
  };

  return (
    <div className="mcsh-calendar-inline">
      {/* Header */}
      <div className="mcsh-cal-header">
        <button
          className="mcsh-cal-nav-btn"
          onClick={handlePrev}
          disabled={isPrevDisabled()}
          aria-label="Previous month"
          type="button"
        >
          <ChevronLeft size={15} strokeWidth={2.5} />
        </button>
        <span className="mcsh-cal-month-label">{monthLabel}</span>
        <button
          className="mcsh-cal-nav-btn"
          onClick={handleNext}
          aria-label="Next month"
          type="button"
        >
          <ChevronRight size={15} strokeWidth={2.5} />
        </button>
      </div>

      {/* Day headers */}
      <div className="mcsh-cal-grid">
        {DAYS_OF_WEEK.map((d, i) => (
          <div key={i} className="mcsh-cal-day-header">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {grid.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="mcsh-cal-day mcsh-cal-day-empty" />;
          }
          const past = isPast(date);
          const selected = isSelected(date);
          const today = isToday(date);
          return (
            <button
              key={idx}
              type="button"
              className={cn("mcsh-cal-day", {
                "mcsh-cal-day-past": past,
                "mcsh-cal-day-today": today,
                "mcsh-cal-day-selected": selected,
              })}
              onClick={() => handleDayClick(date)}
              disabled={past}
              aria-label={date.toLocaleDateString("en-US")}
              aria-pressed={selected}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mobile Guest Selector Component ─────────────────────────────────────────

function MobileInlineGuestSelector({ guests, onGuestChange, onClose }) {
  const currentGuests = {
    adults: guests?.adults ?? 1,
    children: guests?.children ?? 0,
    infants: guests?.infants ?? 0,
    pets: guests?.pets ?? 0,
  };

  const requireAdult = currentGuests.children > 0 || currentGuests.infants > 0;
  const minAdults = requireAdult ? 1 : 0;

  const updateGuests = (type, value) => {
    const updated = { ...currentGuests };

    if (type === "adults") {
      updated.adults = Math.max(minAdults, value);
      // Infants cannot exceed adults.
      if (updated.infants > updated.adults) {
        updated.infants = updated.adults;
      }
    } else if (type === "children") {
      updated.children = Math.max(0, value);
      if (updated.children > 0 && updated.adults === 0) {
        updated.adults = 1;
      }
    } else if (type === "infants") {
      updated.infants = Math.max(0, value);
      // Infants cannot exceed adults.
      if (updated.infants > updated.adults) {
        updated.infants = updated.adults;
      }
      if (updated.infants > 0 && updated.adults === 0) {
        updated.adults = 1;
      }
    }

    onGuestChange?.(updated);
  };

  const guestCategories = [
    {
      type: "adults",
      label: "Adults",
      subtitle: "Age 13+",
      value: currentGuests.adults,
      min: minAdults,
      max: 16,
    },
    {
      type: "children",
      label: "Children",
      subtitle: "Ages 2-12",
      value: currentGuests.children,
      min: 0,
      max: 16,
    },
    {
      type: "infants",
      label: "Infants",
      subtitle: "Under 2",
      value: currentGuests.infants,
      min: 0,
      max: currentGuests.adults, // Max is number of adults
    },
  ];

  return (
    <div className="mcsh-guest-selector" onClick={(e) => e.stopPropagation()}>
      {guestCategories.map((category) => (
        <div key={category.type} className="mcsh-gs-row">
          <div className="mcsh-gs-info">
            <span className="mcsh-gs-label">{category.label}</span>
            <span className="mcsh-gs-subtitle">{category.subtitle}</span>
          </div>
          <div className="mcsh-gs-counter">
            <button
              type="button"
              className="mcsh-gs-btn"
              disabled={category.value <= category.min}
              onClick={(e) => {
                e.stopPropagation();
                updateGuests(category.type, category.value - 1);
              }}
              aria-label={`Decrease ${category.label.toLowerCase()}`}
            >
              <Minus size={15} strokeWidth={2.5} />
            </button>
            <span className="mcsh-gs-value">{category.value}</span>
            <button
              type="button"
              className="mcsh-gs-btn"
              disabled={category.value >= category.max}
              onClick={(e) => {
                e.stopPropagation();
                updateGuests(category.type, category.value + 1);
              }}
              aria-label={`Increase ${category.label.toLowerCase()}`}
            >
              <Plus size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="mcsh-gs-done-btn"
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
      >
        Done
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MobileCinematicSearch({
  // Search state
  searchQuery,
  setSearchQuery,
  selectedDestination,
  setSelectedDestination,
  selectedDate,
  guests,
  showCalendar,
  formattedDate,
  guestCountText,
  // Pickers
  showDatePicker,
  setShowDatePicker,
  showGuestPicker,
  setShowGuestPicker,
  // Destination suggestions
  destinationSuggestions,
  showDestinationSuggestions,
  setShowDestinationSuggestions,
  activeSuggestionIndex,
  setActiveSuggestionIndex,
  selectDestinationSuggestion,
  destinationRef,
  // Sheet
  sheetOpen,
  setSheetOpen,
  // Handlers
  handleSearch,
  handleDateSelect,
  handleGuestChange,
  activeFilter,
  onFilterClick,
  businessInterestAvailability = {},
  businessInterestActiveMap = {},
}) {
  const SECTION_CONFIG = {
    experience: {
      title: "CURATE YOUR EXPERIENCE",
      subtitle: "Tailored adventures designed around your journey.",
      placeholder: "Enter Destination",
      buttonText: "Explore Now",
    },
    stays: {
      title: "FIND YOUR PERFECT STAY",
      subtitle: "Luxury spaces crafted for unforgettable escapes.",
      placeholder: "Enter Destination",
      buttonText: "Find Stay",
    },
    events: {
      title: "DISCOVER LIVE EXPERIENCES",
      subtitle: "Reserve immersive moments happening around you.",
      placeholder: "Enter Destination",
      buttonText: "Reserve Event",
    },
    food: {
      title: "CURATE YOUR DINING EXPERIENCE",
      subtitle: "Exceptional flavors and unforgettable culinary moments.",
      placeholder: "Enter Destination",
      buttonText: "Discover Dining",
    },
    places: {
      title: "EXPLORE NEW DESTINATIONS",
      subtitle: "Discover beautiful places worth experiencing.",
      placeholder: "Enter Destination",
      buttonText: "Explore Places",
    },
  };

  const currentConfig = SECTION_CONFIG[activeFilter] || SECTION_CONFIG.experience;

  const switcherSections = [
    { id: "experience", label: "Experience" },
    { id: "events", label: "Events" },
    { id: "stays", label: "Stays" },
    { id: "food", label: "Food" },
    { id: "places", label: "Places" },
  ].filter((sec) => businessInterestActiveMap[sec.id] !== false);


  // Inject styles once
  useEffect(() => { injectStyles(); }, []);

  // Local picker states to fully decouple from desktop and prevent OutsideClickHandler closing mobile
  const [localShowDatePicker, setLocalShowDatePicker] = React.useState(false);
  const [localShowGuestPicker, setLocalShowGuestPicker] = React.useState(false);

  // Sticky search bar visibility state
  const [isStickyVisible, setIsStickyVisible] = React.useState(false);

  // Dynamic scale interpolation on scroll
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [200, 600], [1, 0.96], { clamp: true });

  // Scroll listener and MutationObserver to track page scrolling and active modals/scroll locks
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const checkVisibility = () => {
      const currentScrollY = window.scrollY;

      // 1. Show sticky search ONLY if scrolled down >= 200px (180–220px threshold)
      const isScrolledPastHero = currentScrollY >= 200;

      // 2. Hide when footer is visible in the viewport
      let isFooterVisible = false;
      const footer = document.querySelector(".cinematic-footer");
      if (footer) {
        const rect = footer.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          isFooterVisible = true;
        }
      }

      // 3. Hide if any modal, gallery, or reservation popup is open
      const isScrollLocked =
        document.body.style.overflow === "hidden" ||
        document.documentElement.style.overflow === "hidden" ||
        document.body.style.position === "fixed" ||
        !!document.querySelector('[class*="Modal_modal"]') ||
        !!document.querySelector('[class*="PhotoView_modal"]');

      const shouldShow = isScrolledPastHero && !isFooterVisible && !isScrollLocked && !sheetOpen;
      setIsStickyVisible(shouldShow);
    };

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkVisibility();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Set up MutationObserver to detect modal/scroll-lock state changes immediately
    const observer = new MutationObserver(() => {
      checkVisibility();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
      childList: true,
      subtree: true,
    });

    // Run initial check
    checkVisibility();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [sheetOpen]);

  // Ref for the date field — used for smooth scroll when calendar expands
  const dateFieldRef = useRef(null);
  const sheetRef = useRef(null);
  const guestFieldRef = useRef(null);

  // Close local pickers when filter changes
  useEffect(() => {
    setLocalShowDatePicker(false);
    setLocalShowGuestPicker(false);
  }, [activeFilter]);

  // Click-outside/tap-outside handling for mobile guest selector
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        localShowGuestPicker &&
        guestFieldRef.current &&
        !guestFieldRef.current.contains(e.target)
      ) {
        setLocalShowGuestPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [localShowGuestPicker]);

  // ── Signal the MobileBottomNavbar to hide/show via body class ──────────────
  useEffect(() => {
    if (sheetOpen) {
      document.body.classList.add("mcsh-search-open");
    } else {
      document.body.classList.remove("mcsh-search-open");
    }
    return () => {
      document.body.classList.remove("mcsh-search-open");
    };
  }, [sheetOpen]);

  // ── Listen for custom event to open sheet from Header ──────────────
  useEffect(() => {
    const handleOpenMobileSearch = () => {
      setSheetOpen(true);
    };
    window.addEventListener("open-mobile-search", handleOpenMobileSearch);
    return () => {
      window.removeEventListener("open-mobile-search", handleOpenMobileSearch);
    };
  }, []);

  // ── Scroll active switcher tab into view ───────────────────────────────────
  useEffect(() => {
    if (!sheetOpen) return;
    const timer = setTimeout(() => {
      const activeBtn = sheetRef.current?.querySelector(".mcsh-switcher-btn.active");
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [activeFilter, sheetOpen]);

  // ── Auto-scroll sheet so calendar is visible after expanding ───────────────
  useEffect(() => {
    if (localShowDatePicker && dateFieldRef.current && sheetRef.current) {
      // Small delay to let animation start before scroll
      const timer = setTimeout(() => {
        dateFieldRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [localShowDatePicker]);

  // Build summary for pill
  const summaryParts = [];
  if (selectedDestination?.description) {
    summaryParts.push(selectedDestination.description.split(",")[0]);
  } else if (searchQuery) {
    summaryParts.push(searchQuery.split(",")[0]);
  } else {
    summaryParts.push("Anywhere");
  }
  if (selectedDate) {
    summaryParts.push(moment(selectedDate).format("MMM D"));
  } else {
    summaryParts.push("Any date");
  }
  const gTotal = (guests?.adults || 0) + (guests?.children || 0);
  summaryParts.push(gTotal > 0 ? `${gTotal} Guest${gTotal > 1 ? "s" : ""}` : "Guests");
  const summary = summaryParts.join(" · ");

  // Build summary for sticky pill (uses '•' and defaults to '1 Guest' if none selected)
  const stickySummaryParts = [];
  if (selectedDestination?.description) {
    stickySummaryParts.push(selectedDestination.description.split(",")[0]);
  } else if (searchQuery) {
    stickySummaryParts.push(searchQuery.split(",")[0]);
  } else {
    stickySummaryParts.push("Anywhere");
  }
  if (selectedDate) {
    stickySummaryParts.push(moment(selectedDate).format("MMM D"));
  } else {
    stickySummaryParts.push("Any date");
  }
  stickySummaryParts.push(gTotal > 0 ? `${gTotal} Guest${gTotal > 1 ? "s" : ""}` : "1 Guest");
  const stickySummary = stickySummaryParts.join(" • ");

  const openSheet = () => setSheetOpen(true);

  const closeSheet = () => {
    setSheetOpen(false);
    setLocalShowDatePicker(false);
    setLocalShowGuestPicker(false);
    setShowDestinationSuggestions(false);
  };

  const handleSearchAndClose = () => {
    handleSearch();
    closeSheet();
  };

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) closeSheet();
  }, []);

  const handleDateFieldTap = () => {
    const opening = !localShowDatePicker;
    setLocalShowDatePicker(opening);
    setLocalShowGuestPicker(false);
  };

  const handleGuestFieldTap = () => {
    const opening = !localShowGuestPicker;
    setLocalShowGuestPicker(opening);
    setLocalShowDatePicker(false);
  };

  // Sheet spring animation
  const sheetVariants = {
    hidden: { y: "100%", opacity: 1 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 340, damping: 38, mass: 0.85 },
    },
    exit: {
      y: "100%",
      opacity: 1,
      transition: { type: "spring", stiffness: 380, damping: 42 },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.22 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  // Calendar / guest picker expand animation
  const expandVariants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      marginTop: 8,
      transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 },
    },
    exit: {
      opacity: 0,
      height: 0,
      marginTop: 0,
      transition: { duration: 0.2, ease: "easeInOut" },
    },
  };

  return (
    <>
      {/* ── Floating Search Trigger Pill ── */}
      <div id="mcsh-floating-pill-wrap" className="mcsh-pill-wrap">
        <motion.div
          className="mcsh-pill"
          onClick={openSheet}
          whileTap={{ scale: 0.98 }}
        >
          <div className="mcsh-pill-icon">
            <Search size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div className="mcsh-pill-text">
            <span className="mcsh-pill-label">WHERE TO?</span>
            <span className="mcsh-pill-summary">{stickySummary}</span>
          </div>
          <div className="mcsh-pill-chevron">
            <ChevronDown size={20} strokeWidth={2} />
          </div>
        </motion.div>
      </div>

      {/* ── Backdrop + Bottom Sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Blurred backdrop */}
            <motion.div
              className="mcsh-backdrop"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeSheet}
              key="mcsh-backdrop"
            />

            {/* Bottom Sheet */}
            <motion.div
              className="mcsh-sheet"
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              key="mcsh-sheet"
              ref={sheetRef}
            >
              {/* Drag Handle */}
              <div className="mcsh-handle-row">
                <div className="mcsh-handle" />
              </div>

              {/* Header */}
              <div className="mcsh-sheet-header">
                <div className="mcsh-header-text-wrap">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeFilter}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      style={{ display: "flex", flexDirection: "column", gap: "4px" }}
                    >
                      <motion.span
                        className="mcsh-sheet-title"
                        variants={{
                          initial: { opacity: 0, y: 8 },
                          animate: { opacity: 1, y: 0 },
                          exit: { opacity: 0, y: -8 },
                        }}
                        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                      >
                        {currentConfig.title}
                      </motion.span>
                      <motion.span
                        className="mcsh-sheet-subtitle"
                        variants={{
                          initial: { opacity: 0 },
                          animate: { opacity: 1 },
                          exit: { opacity: 0 },
                        }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                      >
                        {currentConfig.subtitle}
                      </motion.span>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <button
                  className="mcsh-close-btn"
                  onClick={closeSheet}
                  aria-label="Close search"
                  type="button"
                >
                  <X size={15} strokeWidth={2.2} />
                </button>
              </div>
              
              {/* Inline Section Switcher */}
              <div className="mcsh-switcher-wrap">
                <div className="mcsh-switcher">
                  {switcherSections.map((sec) => {
                    const isActive = activeFilter === sec.id;
                    const isEnabledForListings = businessInterestAvailability[sec.id] !== false;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => onFilterClick?.(sec.id)}
                        disabled={!isEnabledForListings}
                        className={cn("mcsh-switcher-btn", { active: isActive })}
                        type="button"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTabHighlight"
                            className="mcsh-active-highlight"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="mcsh-switcher-label">{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form */}
              <div className="mcsh-form">

                {/* ── Destination ── */}
                <div
                  className="mcsh-dest-wrap"
                  ref={destinationRef}
                  style={{ position: "relative" }}
                >
                  <div
                    className={cn("mcsh-field", {
                      active: showDestinationSuggestions,
                    })}
                  >
                    <div className="mcsh-field-icon">
                      <MapPin size={16} strokeWidth={2} />
                    </div>
                    <div className="mcsh-field-content">
                      <span className="mcsh-field-label">Destination</span>
                      <input
                        type="text"
                        placeholder={currentConfig.placeholder}
                        className="mcsh-field-input"
                        value={searchQuery}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchQuery(value);
                          if (!selectedDestination || value !== selectedDestination.description) {
                            setSelectedDestination(null);
                          }
                        }}
                        onFocus={() => {
                          if (destinationSuggestions.length > 0) {
                            setShowDestinationSuggestions(true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowDown") {
                            if (!destinationSuggestions.length) return;
                            e.preventDefault();
                            setShowDestinationSuggestions(true);
                            setActiveSuggestionIndex((prev) =>
                              prev < destinationSuggestions.length - 1 ? prev + 1 : 0
                            );
                          } else if (e.key === "ArrowUp") {
                            if (!destinationSuggestions.length) return;
                            e.preventDefault();
                            setShowDestinationSuggestions(true);
                            setActiveSuggestionIndex((prev) =>
                              prev > 0 ? prev - 1 : destinationSuggestions.length - 1
                            );
                          } else if (e.key === "Escape") {
                            setShowDestinationSuggestions(false);
                            setActiveSuggestionIndex(-1);
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            if (
                              showDestinationSuggestions &&
                              activeSuggestionIndex >= 0 &&
                              destinationSuggestions[activeSuggestionIndex]
                            ) {
                              selectDestinationSuggestion(
                                destinationSuggestions[activeSuggestionIndex]
                              );
                            } else {
                              handleSearchAndClose();
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Destination suggestions — absolutely positioned relative to dest-wrap */}
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <div className="mcsh-suggestions">
                      {destinationSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.place_id || suggestion.description || index}
                          type="button"
                          className={cn("mcsh-suggestion-item", {
                            active: index === activeSuggestionIndex,
                          })}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectDestinationSuggestion(suggestion)}
                        >
                          <MapPin
                            size={13}
                            strokeWidth={2}
                            style={{ flexShrink: 0, color: "rgba(0,210,255,0.6)" }}
                          />
                          {suggestion.description}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Date Field + Inline Calendar ── */}
                {showCalendar && (
                  <div ref={dateFieldRef}>
                    {/* Date tap row */}
                    <div
                      className={cn("mcsh-field", { active: localShowDatePicker })}
                      onClick={handleDateFieldTap}
                    >
                      <div className="mcsh-field-icon">
                        <Calendar size={16} strokeWidth={2} />
                      </div>
                      <div className="mcsh-field-content">
                        <span className="mcsh-field-label">
                          {activeFilter === "stays" ? "Check-in" : "Date"}
                        </span>
                        <span
                          className={cn("mcsh-field-value", {
                            placeholder: !selectedDate,
                          })}
                        >
                          {selectedDate ? formattedDate : "Select a date"}
                        </span>
                      </div>
                      {/* Chevron indicator */}
                      <motion.div
                        animate={{ rotate: localShowDatePicker ? 180 : 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        style={{ color: localShowDatePicker ? "#0097B2" : "rgba(0,0,0,0.25)", display: "flex" }}
                      >
                        <ChevronRight size={16} strokeWidth={2} />
                      </motion.div>
                    </div>

                    {/* Inline calendar — expands below Date field, stays in flow */}
                    <AnimatePresence>
                      {localShowDatePicker && (
                        <motion.div
                          key="mcsh-inline-cal"
                          variants={expandVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          style={{ overflow: "hidden" }}
                        >
                          <MobileInlineCalendar
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            onClose={() => setLocalShowDatePicker(false)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── Guests Field + Inline Picker ── */}
                {showCalendar && (
                  <div ref={guestFieldRef}>
                    <div
                      className={cn("mcsh-field", { active: localShowGuestPicker })}
                      onClick={handleGuestFieldTap}
                    >
                      <div className="mcsh-field-icon">
                        <Users size={16} strokeWidth={2} />
                      </div>
                      <div className="mcsh-field-content">
                        <span className="mcsh-field-label">Guests</span>
                        <span
                          className={cn("mcsh-field-value", {
                            placeholder: !guests || guests.adults + guests.children === 0,
                          })}
                        >
                          {guestCountText}
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: localShowGuestPicker ? 180 : 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        style={{ color: localShowGuestPicker ? "#0097B2" : "rgba(0,0,0,0.25)", display: "flex" }}
                      >
                        <ChevronRight size={16} strokeWidth={2} />
                      </motion.div>
                    </div>

                    {/* Inline guest picker */}
                    <AnimatePresence>
                      {localShowGuestPicker && (
                        <motion.div
                          key="mcsh-inline-guests"
                          variants={expandVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          style={{ overflow: "hidden" }}
                          className="mcsh-guest-inline"
                        >
                          <MobileInlineGuestSelector
                            guests={guests}
                            onGuestChange={handleGuestChange}
                            onClose={() => setLocalShowGuestPicker(false)}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── Search Button ── */}
                <motion.button
                  className="mcsh-search-btn"
                  onClick={handleSearchAndClose}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  type="button"
                >
                  <Search size={17} strokeWidth={2.5} />
                  {currentConfig.buttonText}
                  <ArrowRight size={16} strokeWidth={2.5} />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
