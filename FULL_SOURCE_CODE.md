# FULL PROJECT SOURCE CODE
-e 

## File: src/components/figma/ImageWithFallback.tsx
```tsx
import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
```
-e 

## File: src/components/ReportIncidentButton.module.css
```css
/* ==========================================================================
   Report Incident Shared-Element Diagonal Transformation
   Clean button -> smooth diagonal expansion -> docked panel -> seamless return
   ========================================================================== */

.floatingContainer {
  position: fixed;
  bottom: max(20px, calc(env(safe-area-inset-bottom, 0px) + 16px));
  right: max(16px, calc(env(safe-area-inset-right, 0px) + 16px));
  z-index: 9999;
  display: flex;
  align-items: center;
  pointer-events: auto;
  max-width: calc(100vw - 32px);
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transition:
    opacity 240ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

.floatingContainer.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translate3d(0, 12px, 0);
}

/* ==========================================================================
   Stationary Floating Action Button
   ========================================================================== */
.reportButton {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 2px;
  border: none;
  outline: none;
  background: var(--gov-red, #d64545);
  color: #ffffff;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  text-decoration: none;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(11, 12, 12, 0.24);
  transform: translate3d(0, 0, 0);
  transition:
    background 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.reportButton:hover:not(:disabled) {
  background: var(--gov-red-hover, #c83d3d);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(11, 12, 12, 0.3);
}

.reportButton:active:not(:disabled) {
  background: var(--gov-red-active, #b93636);
  color: #ffffff;
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(11, 12, 12, 0.2);
}

.reportButton:focus-visible {
  outline: 3px solid #ffdd00;
  outline-offset: 3px;
}

/* ==========================================================================
   Hardware-Accelerated Diagonal Morph Slab
   ========================================================================== */
.sharedSlab {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  background: var(--gov-red, #d64545);
  color: #ffffff;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
  box-sizing: border-box;
  will-change: transform, width, height, border-radius;
  display: flex;
  align-items: center;
  gap: 10px;

  --elevation-opacity: 1;
}

.sharedSlab::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 8px 24px rgba(11, 12, 12, 0.32);
  opacity: var(--elevation-opacity);
  pointer-events: none;
}

.buttonIcon,
.slabIcon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
  z-index: 1;
  width: 20px;
  height: 20px;
  stroke-width: 4px;
}

.labelText {
  position: relative;
  z-index: 1;
  color: #ffffff;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

/* ==========================================================================
   Destination Panel Handoff
   ========================================================================== */
.destinationHidden {
  visibility: hidden !important;
}

/* Reduced Motion Accessibility Mode */
@media (prefers-reduced-motion: reduce) {
  .floatingContainer,
  .floatingContainer.hidden {
    transition: none !important;
    transform: none !important;
  }
  .reportButton {
    transition: none !important;
  }
  .sharedSlab {
    display: none !important;
  }
}

/* Mobile Responsiveness */
@media (max-width: 640px) {
  .floatingContainer {
    bottom: max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px));
    right: max(14px, calc(env(safe-area-inset-right, 0px) + 10px));
  }

  .reportButton {
    min-height: 48px;
    padding: 0 20px;
    font-size: 14.5px;
    gap: 8px;
  }
}
```
-e 

## File: src/components/ReportIncidentButton.tsx
```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './ReportIncidentButton.module.css';

export interface ReportIncidentButtonProps {
  /** Text label displayed inside the button and destination panel. Defaults to "Need immediate support?" */
  label?: string;
  /** Action handler invoked on press/click */
  onPress?: () => void;
  /** Optional hero navigation callback or trigger */
  onHeroNavigate?: () => void;
  /** Target element ID for the destination panel. Defaults to "incident-panel-media" */
  targetId?: string;
  /** Target card ID. Defaults to "incident-card" */
  cardId?: string;
  /** Element ID of the Hero CTA button. Defaults to "hero-incident-cta" */
  heroCtaId?: string;
  /** Disables user interaction */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * High performance cubic-bezier easing evaluator:
 * Smooth deceleration with zero overshoot (cubic-bezier(0.22, 1.0, 0.36, 1.0))
 */
function easeOutSmooth(t: number): number {
  const p = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - p, 3);
}

/**
 * Cubic bezier helper for ultra-smooth easing
 */
function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  return function (t: number): number {
    const clamped = Math.max(0, Math.min(1, t));
    const u = 1 - clamped;
    const tt = clamped * clamped;
    const uu = u * u;
    const ttt = tt * clamped;
    return 3 * uu * clamped * p1y + 3 * u * tt * p2y + ttt;
  };
}

const easeMotion = cubicBezier(0.22, 1.0, 0.36, 1.0);

export const ReportIncidentButton: React.FC<ReportIncidentButtonProps> = ({
  label = 'Need immediate support?',
  onPress,
  onHeroNavigate,
  targetId = 'incident-panel-media',
  cardId = 'incident-card',
  heroCtaId = 'hero-incident-cta',
  disabled = false,
  className = '',
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const morphSlabRef = useRef<HTMLDivElement | null>(null);

  const [isMorphing, setIsMorphing] = useState<boolean>(false);
  const [isDocked, setIsDocked] = useState<boolean>(false);
  const isDockedRef = useRef<boolean>(false);
  const isMorphingRef = useRef<boolean>(false);

  const animFrameRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastScrollYRef = useRef<number>(0);
  const isScrollingDownRef = useRef<boolean>(true);

  // Helper to resolve destination panel in DOM
  const getDestinationPanel = useCallback((): HTMLElement | null => {
    return (
      document.getElementById(targetId) ??
      document.getElementById('incident-panel-media') ??
      document.getElementById('incident-card')
    );
  }, [targetId]);

  // Helper to resolve parent card in DOM
  const getCardElement = useCallback((): HTMLElement | null => {
    return (
      document.getElementById(cardId) ??
      document.getElementById('incident-card') ??
      getDestinationPanel()
    );
  }, [cardId, getDestinationPanel]);

  // Synchronize ref with state
  useEffect(() => {
    isDockedRef.current = isDocked;
  }, [isDocked]);

  useEffect(() => {
    isMorphingRef.current = isMorphing;
  }, [isMorphing]);

  /**
   * Primary Diagonal Morph Animation:
   * Smoothly expands the button diagonally straight into the target panel without curves.
   * If withCameraScroll is true, smoothly scrolls the camera to center the incident card simultaneously.
   */
  const runMorphAnimation = useCallback(
    (options: { withCameraScroll?: boolean } = {}) => {
      const { withCameraScroll = false } = options;
      if (disabled || isMorphingRef.current) return;

      const buttonEl = buttonRef.current;
      const destPanel = getDestinationPanel();
      const cardEl = getCardElement();

      if (!destPanel) return;

      // Handle prefers-reduced-motion accessibility
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        if (withCameraScroll && cardEl) {
          cardEl.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
        destPanel.classList.remove(styles.destinationHidden);
        destPanel.classList.add('isDocked');
        setIsDocked(true);
        setIsMorphing(false);
        return;
      }

      // Abort any ongoing animation
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Capture initial button viewport position
      let startButtonRect: DOMRect;
      if (buttonEl) {
        startButtonRect = buttonEl.getBoundingClientRect();
      } else {
        // Fallback to default bottom-right floating button position
        const btnW = 240;
        const btnH = 48;
        startButtonRect = new DOMRect(
          window.innerWidth - btnW - 24,
          window.innerHeight - btnH - 24,
          btnW,
          btnH
        );
      }

      // Target panel initial rect
      const targetRect = destPanel.getBoundingClientRect();

      // Camera scroll calculation
      const startScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      let targetScrollY = startScrollY;
      let scrollDistance = 0;

      if (withCameraScroll && cardEl) {
        const liveCardRect = cardEl.getBoundingClientRect();
        const cardWorldY = startScrollY + liveCardRect.top;
        const desiredY = cardWorldY - (window.innerHeight - liveCardRect.height) / 2;
        const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
        targetScrollY = Math.max(0, Math.min(maxScrollY, desiredY));
        scrollDistance = targetScrollY - startScrollY;
      }

      // Hide destination panel background during morph flight
      destPanel.classList.add(styles.destinationHidden);

      setIsMorphing(true);
      isMorphingRef.current = true;

      const duration = withCameraScroll ? 460 : 380;
      let startTime: number | null = null;

      const animate = (now: number) => {
        if (controller.signal.aborted) {
          destPanel.classList.remove(styles.destinationHidden);
          return;
        }

        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        const progress = easeMotion(rawProgress);

        // 1. Camera Scroll Progression (if active)
        if (withCameraScroll && Math.abs(scrollDistance) > 2) {
          const currentY = startScrollY + scrollDistance * progress;
          window.scrollTo({ top: currentY, left: 0, behavior: 'instant' as ScrollBehavior });
        }

        // 2. Dynamic Live Target Rect (automatically accounts for viewport scroll)
        const currentTargetRect = destPanel.getBoundingClientRect();

        // 3. Two-Phase Interpolation: Move to top-right corner, then expand
        const cornerLeft = currentTargetRect.right - startButtonRect.width;
        const cornerTop = currentTargetRect.top;
        
        const PHASE_1_END = 0.5;
        let currentLeft: number, currentTop: number, currentWidth: number, currentHeight: number;
        
        if (progress <= PHASE_1_END) {
          const p1 = progress / PHASE_1_END;
          currentLeft = startButtonRect.left + (cornerLeft - startButtonRect.left) * p1;
          currentTop = startButtonRect.top + (cornerTop - startButtonRect.top) * p1;
          currentWidth = startButtonRect.width;
          currentHeight = startButtonRect.height;
        } else {
          const p2 = (progress - PHASE_1_END) / (1 - PHASE_1_END);
          currentLeft = cornerLeft + (currentTargetRect.left - cornerLeft) * p2;
          currentTop = cornerTop;
          currentWidth = startButtonRect.width + (currentTargetRect.width - startButtonRect.width) * p2;
          currentHeight = startButtonRect.height + (currentTargetRect.height - startButtonRect.height) * p2;
        }

        // Radius: 2px (button) -> 2px top, 0px bottom (card media)
        const radiusTop = 2;
        const radiusBottom = Math.max(0, 2 * (1 - progress));

        // Elevation shadow fades out during docking arrival
        const elevationOpacity = Math.max(0, 1 - progress);

        // Content padding expansion: 22px -> 24px
        const currentPadding = 22 + (24 - 22) * progress;

        // Smooth opacity dissolve during the final 15% (0.85 -> 1.0) to eliminate any handoff jump
        let slabOpacity = 1;
        if (progress >= 0.85) {
          const dissolveProgress = (progress - 0.85) / 0.15;
          slabOpacity = Math.max(0, 1 - dissolveProgress);

          // Pre-reveal destination panel right before slab fully dissolves
          if (destPanel.classList.contains(styles.destinationHidden)) {
            destPanel.classList.remove(styles.destinationHidden);
            destPanel.classList.add('isDocked');
          }
        }

        const slabEl = morphSlabRef.current;
        if (slabEl) {
          slabEl.style.transform = `translate3d(${currentLeft}px, ${currentTop}px, 0)`;
          slabEl.style.width = `${currentWidth}px`;
          slabEl.style.height = `${currentHeight}px`;
          slabEl.style.borderRadius = `${radiusTop}px ${radiusTop}px ${radiusBottom}px ${radiusBottom}px`;
          slabEl.style.paddingLeft = `${currentPadding}px`;
          slabEl.style.paddingRight = `${currentPadding}px`;
          slabEl.style.opacity = `${slabOpacity}`;
          slabEl.style.setProperty('--elevation-opacity', `${elevationOpacity}`);
        }

        if (rawProgress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          // --- ARRIVAL & DOCKING COMPLETION ---
          if (withCameraScroll && Math.abs(scrollDistance) > 2) {
            window.scrollTo({ top: targetScrollY, left: 0, behavior: 'instant' as ScrollBehavior });
          }

          // Ensure destination panel is docked
          destPanel.classList.remove(styles.destinationHidden);
          destPanel.classList.add('isDocked');
          setIsDocked(true);
          isDockedRef.current = true;
          setIsMorphing(false);
          isMorphingRef.current = false;

          // Focus recovery guidance link for accessibility if camera followed
          if (withCameraScroll) {
            const recoveryLink = document.querySelector<HTMLAnchorElement>('.need-card-link--danger');
            recoveryLink?.focus({ preventScroll: true });
          }
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    },
    [disabled, getDestinationPanel, getCardElement]
  );

  /**
   * Undock panel and return button to floating bottom-right position
   */
  const undockAndReturnButton = useCallback(() => {
    const destPanel = getDestinationPanel();
    if (destPanel) {
      destPanel.classList.remove('isDocked', styles.destinationHidden);
    }
    setIsDocked(false);
    isDockedRef.current = false;
  }, [getDestinationPanel]);

  /**
   * Scroll & Viewport Tracker:
   * 1. Detects when the user reaches the trigger threshold -> starts diagonal expansion into panel.
   * 2. Detects when the panel is no longer in view -> brings back the floating button at bottom-right.
   * Uses both IntersectionObserver and requestAnimationFrame scroll/resize listeners for instant response.
   */
  useEffect(() => {
    let ticking = false;

    const checkViewportPosition = () => {
      const cardEl = getCardElement();
      if (!cardEl) return;

      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      isScrollingDownRef.current = currentScrollY >= lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      const cardRect = cardEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // In view strictly means the card is intersecting the current viewport window
      const isPanelInView = cardRect.top < viewportHeight && cardRect.bottom > 0;

      if (!isPanelInView) {
        // The panel is outside the viewport (either above or below) -> Floating button MUST stay visible
        if (isDockedRef.current || isMorphingRef.current) {
          undockAndReturnButton();
        }
      } else {
        // The panel is inside the viewport
        // Trigger threshold: when the card top is within 95% of viewport height
        const isAtTriggerThreshold = cardRect.top <= viewportHeight * 0.95;
        if (isAtTriggerThreshold && !isDockedRef.current && !isMorphingRef.current) {
          runMorphAnimation({ withCameraScroll: false });
        }
      }
    };

    const handleScrollOrResize = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          checkViewportPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    // IntersectionObserver for native hardware-level viewport entry/exit detection
    let observer: IntersectionObserver | null = null;
    const cardEl = getCardElement();
    if (cardEl && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              // Completely out of view -> always bring back floating button
              undockAndReturnButton();
            } else {
              // Intersecting -> check trigger position
              checkViewportPosition();
            }
          });
        },
        {
          root: null,
          threshold: [0, 0.25, 0.5, 0.75, 1.0],
        }
      );
      observer.observe(cardEl);
    }

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    // Initial check on mount
    checkViewportPosition();

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [getCardElement, runMorphAnimation, undockAndReturnButton]);

  /**
   * Hero CTA Click Listener:
   * When user clicks Hero "Need immediate support?" button, smoothly scrolls camera to incident card
   */
  useEffect(() => {
    const heroCtaEl = document.getElementById(heroCtaId) ?? document.querySelector('.hero-btn-primary');
    if (!heroCtaEl) return;

    const handleHeroClick = (e: MouseEvent) => {
      e.preventDefault();
      if (onHeroNavigate) onHeroNavigate();
      runMorphAnimation({ withCameraScroll: true });
    };

    heroCtaEl.addEventListener('click', handleHeroClick as EventListener);
    return () => {
      heroCtaEl.removeEventListener('click', handleHeroClick as EventListener);
    };
  }, [heroCtaId, onHeroNavigate, runMorphAnimation]);

  // Clean-up animation on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      const destPanel = getDestinationPanel();
      if (destPanel) {
        destPanel.classList.remove(styles.destinationHidden);
      }
    };
  }, [getDestinationPanel]);

  // Handle floating button click -> smoothly scroll camera & transform button into panel
  const handlePress = useCallback(() => {
    if (disabled || isMorphingRef.current) return;
    if (onPress) onPress();
    runMorphAnimation({ withCameraScroll: true });
  }, [disabled, onPress, runMorphAnimation]);

  const showFloatingButton = !isDocked && !isMorphing;

  return (
    <>
      {/* 1. Stationary Floating Action Button (Bottom-Right) */}
      <div
        className={`${styles.floatingContainer} ${!showFloatingButton ? styles.hidden : ''}`}
        role="region"
        aria-label="Immediate Incident Support Action"
        aria-hidden={!showFloatingButton}
      >
        <button
          ref={buttonRef}
          id="report-incident-floating-btn"
          type="button"
          className={`${styles.reportButton} ${className}`.trim()}
          onClick={handlePress}
          disabled={disabled}
          aria-label={`${label} - Cyber Incident Support`}
          tabIndex={showFloatingButton ? 0 : -1}
          aria-hidden={!showFloatingButton}
        >
          <span className={styles.labelText}>{label}</span>
          <ArrowRight
            size={20}
            strokeWidth={4}
            className={styles.buttonIcon}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* 2. Hardware-Accelerated Straight Diagonal Morph Slab */}
      {isMorphing && (
        <div
          ref={morphSlabRef}
          id="ttcsirt-shared-element-slab"
          className={styles.sharedSlab}
          aria-hidden="true"
        >
          <span className={styles.labelText}>{label}</span>
          <ArrowRight size={20} strokeWidth={4} className={styles.slabIcon} aria-hidden="true" />
        </div>
      )}
    </>
  );
};

export default ReportIncidentButton;
```
-e 

## File: src/App.tsx
```tsx
import { useState, FormEvent } from "react";
import {
  ArrowRight,
  BellRing,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Facebook,
  Globe2,
  GraduationCap,
  Instagram,
  Landmark,
  Lightbulb,
  Linkedin,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Network,
  Phone,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import coatOfArms from "@/assets/Coat_of_arms_MoF.png";
import coatOfArmsFooter from "@/assets/coat_of_arms_footer.png";
import ttcsirtLogo from "@/assets/ttcsirt_round_logo.svg";
import commonwealthImg from "@/assets/commonwealth_meeting_mr_bachu.jpg";
import familySafetyImg from "@/assets/illustrations/family-safety.jpg";
import businessTrainingImg from "@/assets/illustrations/business-training.jpg";
import ttcsirtTeamImg from "@/assets/illustrations/ttcsirt-hero-team.png";
import { ReportIncidentButton } from "@/components/ReportIncidentButton";
import "@/styles/homepage.css";

const advisories = [
  {
    level: "Alert",
    title: "SharePoint hardening after new exploitations",
    date: "20 Jul 2026",
    desc: "Multiple vulnerabilities in Microsoft SharePoint are being actively exploited. If you use on-premises SharePoint, install the latest Microsoft security updates immediately.",
  },
  {
    level: "Advisory",
    title: "Palo Alto Networks PAN-OS authentication bypass",
    date: "15 Jun 2026",
    desc: "A critical vulnerability may allow attackers to bypass security controls on affected PAN-OS firewalls. Update affected systems using the latest vendor security guidance.",
  },
  {
    level: "Alert",
    title: "Critical Check Point VPN zero-day",
    date: "10 Jun 2026",
    desc: "A critical vulnerability affecting Check Point Remote Access VPN is being actively exploited. Organizations should update affected systems immediately.",
  },
  {
    level: "Advisory",
    title: "Critical Palo Alto Networks PAN-OS vulnerability",
    date: "8 May 2026",
    desc: "A critical vulnerability could allow attackers to run malicious code on affected PAN-OS firewalls. Apply the latest security updates as soon as possible.",
  },
  {
    level: "Alert",
    title: "Phishing scam targeting e-Tax users",
    date: "20 Apr 2026",
    desc: "Fraudulent websites are impersonating the BIR e-Tax service. Always check the website address before entering your login details or personal information.",
  },
] as const;

const mandate = [
  "Coordinate the national response to cyber security incidents",
  "Issue cyber security advisories and alerts",
  "Provide incident handling and technical assistance",
  "Facilitate cyber threat information sharing",
  "Conduct vulnerability notifications and coordinated disclosure",
  "Promote cyber security awareness and capacity building",
  "Support public and private sector organisations",
  "Foster national and international operational cooperation",
];

const heroSlides = [
  {
    title: "Securing Trinidad and Tobago’s digital future.",
    description: "TT-CSIRT is the national computer security incident response team, protecting Trinidad and Tobago’s critical infrastructure, government networks, and public systems from cyber threats.",
  },
  {
    title: "Coordinated national incident response.",
    description: "When cyber attacks or breaches affect organizations and public services, our response specialists provide technical containment, incident handling, and forensic recovery guidance.",
  },
  {
    title: "Authoritative cyber advisories & alerts.",
    description: "Real-time vulnerability warnings, emerging threat notifications, and actionable security guidance to keep public and private sector systems protected.",
  },
];

function BrandMark({ footer = false }: { footer?: boolean }) {
  return (
    <img 
      src={ttcsirtLogo} 
      alt="TT-CSIRT Logo" 
      className={`brand-logo ${footer ? "brand-logo--footer" : ""}`}
      aria-hidden="true" 
    />
  );
}

function GovernmentBar() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      alert(`Searching for: "${searchQuery}"`);
    }
  };

  return (
    <div className="government-bar-container">
      <div className="government-bar">
        <div className="government-left">
          <div className="government-emblem-slot">
            <img className="coat" src={coatOfArmsFooter} alt="Coat of Arms of Trinidad and Tobago" />
          </div>
          <div className="government-titles">
            <div className="government-republic">REPUBLIC OF TRINIDAD AND TOBAGO</div>
            <div className="government-ministry">Ministry of Homeland Security</div>
          </div>
        </div>
        <div className="government-tools">
          <a href="#accessibility">Accessibility</a>
          <a href="#sitemap">Sitemap</a>
          <a href="#contact">Contact</a>
          <form onSubmit={handleSearch} className="search-box">
            <input 
              type="text"
              aria-label="Search TT-CSIRT" 
              placeholder="Search TT-CSIRT" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" aria-label="Search">
              <Search size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const items = ["About Us", "Alerts & Advisories", "Services", "Statistics", "Resources", "Events", "Cyber Guide", "Connect"];

  return (
    <div className="header-container">
      <header className="site-header">
        <a href="#top" className="site-brand" aria-label="TT-CSIRT home">
          <div className="brand-emblem-slot">
            <BrandMark />
          </div>
          <div className="brand-titles">
            <strong className="brand-acronym">TT-CSIRT</strong>
            <span className="brand-fullname">
              Trinidad and Tobago Cyber Security<br />Incident Response Team
            </span>
          </div>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {items.map((item) => (
            <a 
              href={`#${item.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and")}`} 
              key={item}
            >
              {item}
              {["About Us", "Services", "Resources", "Connect"].includes(item) && <ChevronDown size={15} />}
            </a>
          ))}
        </nav>
        <a href="#report" className="report-button">Report an Incident</a>
        <button 
          type="button"
          className="menu-button" 
          onClick={() => setOpen(!open)} 
          aria-expanded={open} 
          aria-label="Open navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {items.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and")}`} onClick={() => setOpen(false)}>
              {item}
            </a>
          ))}
          <a href="#report" className="mobile-report-btn" onClick={() => setOpen(false)}>
            Report an Incident
          </a>
        </nav>
      )}
    </div>
  );
}

function Notice() {
  return (
    <div className="notice-container">
      <div className="notice">
        <span className="notice-label">OFFICIAL CYBERSECURITY NOTICE</span>
        <span className="notice-rule" />
        <span className="notice-copy">FortiGate SSL VPN Authentication Bypass</span>
        <span className="notice-rule notice-rule--second" />
        <a href="#advisory">View Advisory <ArrowRight size={17} /></a>
        <a href="#alerts" className="notice-subscribe"><Mail size={20} /> Subscribe to Alerts</a>
      </div>
    </div>
  );
}

function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  };

  const slide = heroSlides[activeSlide];

  return (
    <div className="hero-container" id="top">
      <section className="hero" aria-roledescription="carousel" aria-label="TT-CSIRT National Mission Highlights">
        <div className="hero-left">
          {/* Badge Kicker (Constant Anchor) */}
          <div className="hero-badge-row">
            <span className="hero-kicker">NATIONAL CYBERSECURITY AUTHORITY</span>
          </div>

          {/* Fixed-geometry Cross-fading Slide Text Stage */}
          <div 
            className="hero-slides-viewport" 
            role="region" 
            aria-roledescription="carousel" 
            aria-label="TT-CSIRT Mission Highlights"
          >
            {heroSlides.map((s, idx) => {
              const isActive = idx === activeSlide;
              return (
                <div
                  key={idx}
                  className={`hero-slide-panel ${isActive ? "active" : ""}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`Slide ${idx + 1} of ${heroSlides.length}: ${s.title}`}
                  aria-hidden={!isActive}
                >
                  <h1 className="hero-slide-title">{s.title}</h1>
                  <span className="hero-line" aria-hidden="true" />
                  <p className="hero-lead-text">{s.description}</p>
                </div>
              );
            })}
          </div>

          {/* Fixed Position Action CTAs */}
          <div className="hero-actions-group">
            <a 
              id="hero-incident-cta"
              href="#incident-card" 
              className="hero-btn-primary"
            >
              Need immediate support? <ArrowRight size={20} strokeWidth={4} aria-hidden="true" />
            </a>
            <a href="#about" className="hero-btn-secondary">
              Learn about TT-CSIRT
            </a>
          </div>

          {/* Fixed Bottom Carousel Navigation Rail */}
          <div className="hero-nav-rail" aria-label="Carousel navigation">
            <span className="hero-slide-counter" aria-live="polite">
              0{activeSlide + 1} <span className="counter-sep">/</span> 0{heroSlides.length}
            </span>
            
            <div className="hero-carousel-controls">
              <button 
                type="button" 
                className="hero-nav-arrow"
                onClick={prevSlide} 
                aria-label="Previous slide"
              >
                <ChevronLeft size={22} strokeWidth={3.75} aria-hidden="true" />
              </button>
              
              <div className="hero-nav-dots" role="tablist" aria-label="Slide pagination">
                {heroSlides.map((s, idx) => {
                  const isActive = idx === activeSlide;
                  return (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Slide ${idx + 1}: ${s.title}`}
                      className={`hero-dot-btn ${isActive ? "active" : ""}`}
                      onClick={() => setActiveSlide(idx)}
                    >
                      <span className="hero-dot-inner" />
                    </button>
                  );
                })}
              </div>
              
              <button 
                type="button" 
                className="hero-nav-arrow"
                onClick={nextSlide} 
                aria-label="Next slide"
              >
                <ChevronRight size={22} strokeWidth={3.75} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Mandate Panel */}
        <aside className="hero-right" aria-labelledby="hero-mandate-title">
          <div className="mandate-header">
            <h2 id="hero-mandate-title">Our mandate</h2>
            <span className="mandate-tag">National Role</span>
          </div>
          <p className="mandate-intro">
            The Trinidad and Tobago Cyber Security Incident Response Team (TT-CSIRT) is the national focal point for cyber incident reporting, management and response under the Ministry of Homeland Security.
          </p>
          <ul className="mandate-list" role="list">
            {mandate.map((item, idx) => (
              <li key={idx} className="mandate-item">
                <span className="mandate-bullet" aria-hidden="true" />
                <span className="mandate-text">{item}</span>
              </li>
            ))}
          </ul>
          <a className="mandate-link" href="#mandate">
            Read more about our mandate <ArrowRight size={18} aria-hidden="true" />
          </a>
        </aside>
      </section>
    </div>
  );
}

function NeedsToday() {
  const guidance = [
    {
      eyebrow: "CYBER ADVICE",
      title: "Individuals & families", 
      copy: "Learn how to secure your devices, recognise scams and recover from cyber incidents.",
      cta: "View advice",
      id: "individuals",
      image: familySafetyImg,
      Icon: UsersRound
    },
    {
      eyebrow: "ORGANISATION SECURITY",
      title: "Businesses & organisations", 
      copy: "Improve your organisation’s cyber security and protect against threats.",
      cta: "Secure your organisation",
      id: "businesses",
      image: businessTrainingImg,
      Icon: Building2
    },
    {
      eyebrow: "PUBLIC SECTOR",
      title: "Government & Critical Infrastructure", 
      copy: "Explore coordination, standards, and support for public sector partners.",
      cta: "Explore sector guidance",
      id: "government",
      image: ttcsirtTeamImg,
      Icon: Landmark
    },
  ] as const;

  return (
    <section className="needs-section" aria-labelledby="needs-heading">
      <div className="needs-heading">
        <h2 id="needs-heading">What do you need to do today?</h2>
        <p>Choose the option that matches your situation.</p>
      </div>
      <div className="needs-grid">
        <article className="need-card need-card--incident" id="incident-card">
          <div
            className="need-card-media need-card-media--incident"
            id="incident-panel-media"
          >
            <span className="incident-panel-title">Need immediate support?</span>
            <ArrowRight size={20} strokeWidth={4} className="incident-panel-icon" aria-hidden="true" />
          </div>
          <div className="need-card-content">
            <p className="need-card-eyebrow">IF SOMETHING’S HAPPENED</p>
            <div className="need-card-header">
              <Siren size={22} className="need-card-icon need-card-icon--danger" />
              <h3>Recovering from an incident</h3>
            </div>
            <p>Already dealing with a cyber attack, scam, or suspected compromise? Get immediate guidance or reach our team directly.</p>
            
            <div className="need-card-contacts">
              <div className="need-card-contact-item">
                <Phone size={14} className="need-card-icon--danger" />
                <span>Hotline: <a href="tel:+18686257937">+1 (868) 625-7937</a></span>
              </div>
              <div className="need-card-contact-item">
                <Mail size={14} className="need-card-icon--danger" />
                <span>Email: <a href="mailto:incidents@ttcsirt.gov.tt">incidents@ttcsirt.gov.tt</a></span>
              </div>
            </div>

            <a href="#report" className="need-card-link--danger">Get recovery guidance <ArrowRight size={16} /></a>
          </div>
        </article>
        {guidance.map(({eyebrow, title, copy, cta, id, image, Icon}) => (
          <article className={`need-card need-card--${id}`} key={title}>
            <div className={`need-card-media need-card-media--${id}`}>
              <img src={image} alt="" />
            </div>
            <div className="need-card-content">
            <p className="need-card-eyebrow">{eyebrow}</p>
            <div className="need-card-header">
              <Icon size={22} className="need-card-icon" />
              <h3>{title}</h3>
            </div>
            <p>{copy}</p>
            <a href="#services">{cta} <ArrowRight size={16} /></a>
            </div>
          </article>
        ))}
      </div>
      <p className="needs-footer-note">
        Need to report an incident right now? Use <a href="#report" className="inline-report-link"><b>REPORT AN INCIDENT</b></a> at the top of this page.
      </p>
    </section>
  );
}


function DashboardRow() {
  const incidents = [
    {
      icon: BellRing,
      value: "48",
      title: "Phishing incidents",
      subtitle: "The most common cyber threat in 2026.",
      desc: "Emails that look real but are designed to steal information or gain access to systems.",
    },
    {
      icon: LockKeyhole,
      value: "17",
      title: "Data breaches",
      subtitle: "Sensitive information exposed or accessed without permission.",
      desc: "Includes incidents where personal or business data was lost, stolen, or improperly accessed.",
    },
    {
      icon: TrendingUp,
      value: "71",
      title: "Total incidents reported",
      subtitle: "Reports help identify threats and protect others.",
      desc: "Public sector accounts for most reports in 2026. Thank you for reporting.",
    },
  ] as const;

  return (
    <section className="dashboard-row" aria-label="Advisories and current incidents">
      <article className="content-card advisories" id="advisory">
        <div className="advisories-header">
          <p>Cyber security updates</p>
          <div>
            <h2>Latest advisories</h2>
            <a href="#archive">View all advisories <ArrowRight size={17} /></a>
          </div>
        </div>
        <div className="advisory-list">
          {advisories.map(({ level, title, date, desc }) => (
            <a href="#advisory" className="advisory" key={title}>
              <span className={`severity severity--${level.toLowerCase().replace(/\s+/g, '-')}`}>{level}</span>
              <span className="advisory-content">
                <b>{title}</b>
                <p className="advisory-desc">{desc}</p>
              </span>
              <time>{date}</time>
              <ArrowRight className="advisory-arrow" size={17} />
            </a>
          ))}
        </div>
        <aside className="advisory-callout">
          <div className="advisory-callout-main">
            <BellRing className="advisory-callout-icon" aria-hidden="true" size={22} />
            <div className="advisory-callout-text">
              <b>Stay informed. Stay secure.</b>
              <p>Receive the latest TT-CSIRT advisories and alerts.</p>
            </div>
          </div>
          <a href="#alerts" className="advisory-callout-link">Subscribe to alerts <ArrowRight size={16} /></a>
        </aside>
      </article>

      <article className="incidents-panel content-card">
        <p className="incidents-panel__eyebrow">CYBER INCIDENTS IN 2026</p>
        <h2>What’s happening now</h2>
        <p className="incidents-panel__subtext">
          Most cyber incidents start with an email designed to trick someone.
        </p>

        <div className="incident-list">
          {incidents.map((item) => {
            const Icon = item.icon;
            return (
              <div className="incident-row-card" key={item.title}>
                <div className="incident-card-left">
                  <Icon className="incident-icon" aria-hidden="true" />
                  <div className="incident-stat-group">
                    <span className="incident-val">{item.value}</span>
                    <b className="incident-title">{item.title}</b>
                    <span className="incident-subtitle">{item.subtitle}</span>
                  </div>
                </div>
                <div className="incident-card-divider" />
                <div className="incident-card-right">
                  <p>{item.desc}</p>
                </div>
              </div>
            );
          })}

          <div className="incident-insight-box">
            <Lightbulb className="insight-icon" aria-hidden="true" />
            <div className="insight-content">
              <b>Key insight</b>
              <p>
                <strong>Think before you click.</strong> Most cyber incidents can be prevented by checking unexpected emails, links and attachments before responding.
              </p>
            </div>
          </div>
        </div>
        <a href="#statistics" className="card-bottom-link" style={{ marginTop: "auto" }}>View statistics <ArrowRight size={17} /></a>
      </article>
    </section>
  );
}

function ServicesAndPartners() {
  const newServices = [
    { Icon: ShieldCheck, title: "Incident response", tag: "24/7 National Service", desc: "Coordinate and support the management of cyber security incidents affecting organisations.", link: "Report an incident" },
    { Icon: Radio, title: "Cyber threat intelligence", tag: "", desc: "Provide actionable intelligence, indicators of compromise and analysis of emerging threats.", link: "Explore threat intelligence" },
    { Icon: ShieldAlert, title: "Alerts & advisories", tag: "", desc: "Publish timely cyber security alerts, advisories and technical guidance to help organisations reduce risk.", link: "Browse advisories" },
    { Icon: Network, title: "Vulnerability coordination", tag: "", desc: "Coordinate responsible disclosure and notify affected organisations of significant vulnerabilities.", link: "Report a vulnerability" },
    { Icon: UsersRound, title: "Awareness & capacity building", tag: "", desc: "Deliver awareness initiatives, training and practical resources to strengthen national cyber resilience.", link: "View training & resources" },
  ] as const;

  const partners = [
    [Landmark, "Government agencies", "Supporting cyber security coordination across the public sector."],
    [Building2, "Businesses and organisations", "Working with the private sector to improve cyber security practices."],
    [ShieldCheck, "Essential service providers", "Helping protect systems and services that communities rely on."],
    [GraduationCap, "Academic & research partners", "Fostering cyber security education, research and skills development."],
    [Globe2, "Regional and international partners", "Sharing expertise, information and approaches to cyber security."],
  ] as const;

  return (
    <section className="content-cards">
      <article className="content-card services" id="services" style={{ padding: 0, overflow: "hidden" }}>
        <img src={commonwealthImg} alt="Commonwealth meeting" style={{ width: "100%", height: "185px", objectFit: "cover", objectPosition: "center 22%", display: "block" }} />
        
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <p className="section-eyebrow">National cyber security support</p>
          <h2 className="services-heading">National cyber security capabilities</h2>
          <p className="section-intro">Practical national cyber security services that help organisations prepare for, respond to and recover from incidents.</p>
          
          <div className="service-list">
            {newServices.map((service) => (
              <a href="#services" className="service" key={service.title}>
                <service.Icon aria-hidden="true" size={20} className="service-icon" />
                <div className="service-body">
                  <div className="service-header">
                    <span className="service-title">{service.title}</span>
                    {service.tag && (
                      <span className={`service-tag ${service.tag.includes("24/7") ? "service-tag--live" : "service-tag--daily"}`}>
                        {service.tag}
                      </span>
                    )}
                  </div>
                  <p className="service-desc">{service.desc}</p>
                </div>
                <ArrowRight size={17} className="service-arrow" />
              </a>
            ))}
          </div>
          
          <div style={{ marginTop: "auto", paddingTop: "10px" }}>
            <div className="services-support-callout">
              <div>
                <b className="callout-title">Need immediate support?</b>
                <span className="callout-sub">Available 24/7 for incidents</span>
              </div>
              <a href="#contact" className="card-bottom-link" style={{ marginTop: 0, whiteSpace: "nowrap" }}>Contact <ArrowRight size={16} /></a>
            </div>
          </div>
        </div>
      </article>

      <article className="partners-panel content-card" style={{ padding: 0 }}>
        <div className="partners-panel__intro">
          <p>OUR MANDATE</p>
          <h2>Working together to strengthen national cybersecurity</h2>
          <span />
        </div>
        <div className="partners-panel__list">
          {partners.map(([Icon, title, copy]) => (
            <div className="partner-row" key={title}>
              <Icon aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
        <a href="#partners" className="partners-panel__link card-bottom-link" style={{ marginTop: "auto" }}>Learn how TT-CSIRT works with partners <ArrowRight /></a>
      </article>

      <article className="content-card about" id="about">
        <p className="section-eyebrow">National authority</p>
        <h2>About TT-CSIRT</h2>
        <p className="section-intro">TT-CSIRT coordinates cyber incident response, publishes trusted guidance and strengthens cyber resilience across Trinidad and Tobago.</p>
        <div className="about-facts">
          <span>Established<b>November 2015</b></span>
          <span>Policy Foundation<b>National Cyber Security Strategy (2012)</b></span>
          <span>Scope<b>National</b></span>
          <span>Membership<b>Public & Private</b></span>
        </div>
        <div className="about-links">
          <a href="#mandate">Our Mandate <ArrowRight size={17} /></a>
          <a href="#strategy">National Cyber Security Strategy <ArrowRight size={17} /></a>
          <a href="#resources">Publications & Guidelines <ArrowRight size={17} /></a>
          <a href="#reports">Annual Reports <ArrowRight size={17} /></a>
          <a href="#contact">Contact TT-CSIRT <ArrowRight size={17} /></a>
        </div>
        <a className="card-bottom-link" href="#about" style={{ marginTop: "auto", paddingTop: "14px" }}>Read organization profile <ArrowRight size={17} /></a>
      </article>
    </section>
  );
}

function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      alert(`Thank you! ${email} has been subscribed to TT-CSIRT alerts.`);
      setEmail("");
    }
  };

  return (
    <footer className="footer-wrapper">
      {/* Upper Dark Blue Section */}
      <div className="footer-dark-bg" id="contact">
        <div className="footer-content-grid">
          
          {/* Column 1: ABOUT & LEGAL */}
          <div className="footer-col col-about">
            <div className="footer-sec">
              <h2 className="footer-heading">ABOUT TT-CSIRT</h2>
              <div className="footer-heading-bar" />
              <p className="footer-text">
                The national authority for coordinating cyber incident response and promoting cybersecurity resilience across the Republic of Trinidad and Tobago.
              </p>
            </div>

            <div className="footer-sec" style={{ marginTop: '28px' }}>
              <h2 className="footer-heading">LEGAL STATUS</h2>
              <div className="footer-heading-bar" />
              <p className="footer-text">
                TT-CSIRT operates under the Ministry of Homeland Security in accordance with the Cybersecurity Act, 2021 (Act No. 20 of 2021) and related regulations. We are the national Computer Security Incident Response Team (CSIRT) for Trinidad and Tobago.
              </p>
            </div>
          </div>

          {/* Column 2: QUICK NAVIGATION */}
          <div className="footer-col col-nav">
            <h2 className="footer-heading">QUICK NAVIGATION</h2>
            <div className="footer-heading-bar" />
            <ul className="footer-nav-list">
              {[
                "About Us",
                "Alerts and Advisories",
                "Our Services",
                "School Awareness Programme",
                "Statistics and Reports",
                "Events and Notices",
                "Report an Incident",
                "Contact Us",
                "Privacy Statement",
                "Public Sector Information (Section 7 Statements)",
              ].map((item) => (
                <li key={item}>
                  <a href="#top">
                    <span>{item}</span>
                    <ChevronRight size={14} className="nav-chevron" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: PARTNER AGENCIES */}
          <div className="footer-col col-agencies">
            <h2 className="footer-heading">PARTNER AGENCIES</h2>
            <div className="footer-heading-bar" />
            <ul className="footer-agency-list">
              {[
                "Ministry of Homeland Security (MHS)",
                "Office of the Attorney General and Ministry of Legal Affairs (AGLA)",
                "Inter-American Telecommunication Commission (CITEL)",
                "Financial Investigations Branch (FIB)",
                "Forensic Science Centre (FSC)",
                "Caribbean Community Implementation Agency for Crime and Security (CARICOM IMPACS)",
              ].map((item) => (
                <li key={item}>
                  <a href="#partners">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: CONTACT & FOLLOW */}
          <div className="footer-col col-contact">
            <div className="footer-sec">
              <h2 className="footer-heading">CONTACT US</h2>
              <div className="footer-heading-bar" />
              <div className="footer-contact-items">
                <div className="contact-row">
                  <div className="contact-icon-circle"><Phone size={15} /></div>
                  <div>
                    <div className="contact-main-text">+1 (868) 625-7937</div>
                    <div className="contact-sub">(8:00 a.m. – 4:00 p.m.)</div>
                  </div>
                </div>
                <div className="contact-row">
                  <div className="contact-icon-circle"><Mail size={15} /></div>
                  <div>
                    <a href="mailto:contactus@ttcsirt.gov.tt" className="contact-mail-link">contactus@ttcsirt.gov.tt</a>
                  </div>
                </div>
                <div className="contact-row">
                  <div className="contact-icon-circle"><MapPin size={15} /></div>
                  <div className="contact-address">
                    Abercromby Street<br />
                    Port of Spain<br />
                    Republic of Trinidad and Tobago
                  </div>
                </div>
              </div>
            </div>

            <div className="footer-sec" style={{ marginTop: '28px' }}>
              <h2 className="footer-heading">FOLLOW TT-CSIRT</h2>
              <div className="footer-heading-bar" />
              <div className="footer-social-circles">
                <a href="#facebook" aria-label="Facebook"><Facebook size={16} /></a>
                <a href="#x" aria-label="X"><X size={16} /></a>
                <a href="#linkedin" aria-label="LinkedIn"><Linkedin size={16} /></a>
                <a href="#instagram" aria-label="Instagram"><Instagram size={16} /></a>
              </div>
            </div>
          </div>

          {/* Column 5: SUBSCRIBE (with left vertical divider) */}
          <div className="footer-col col-subscribe">
            <h2 className="footer-heading">SUBSCRIBE TO UPDATES</h2>
            <div className="footer-heading-bar" />
            <p className="footer-text" style={{ marginBottom: '20px' }}>
              Receive the latest cybersecurity alerts, advisories and announcements directly in your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="footer-subscribe-box">
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Subscribe</button>
            </form>
          </div>

        </div>
      </div>

      {/* Bottom Light Section */}
      <div className="footer-light-bg" id="footer-bottom-section">
        <div className="footer-light-container">
          {/* Left Column: Coat of Arms Crest & Copyright directly underneath */}
          <div className="footer-light-left">
            <div className="footer-coat-row">
              <img src={coatOfArmsFooter} alt="Coat of Arms of Trinidad and Tobago" className="footer-light-coat" />
              <div className="ministry-info">
                <div className="gov-line">Government of the Republic of Trinidad and Tobago</div>
                <div className="ministry-line">Ministry of Homeland Security</div>
                <div className="tagline-line">Building a Safer, More Secure Nation</div>
              </div>
            </div>
            <div className="gov-copyright">
              © 2026 Government of the Republic of Trinidad and Tobago. All rights reserved.
            </div>
          </div>

          {/* Right Column: ttconnect Portal Anchor & Legal Links */}
          <div className="footer-light-right">
            <div className="footer-gov-site">
              <svg width="38" height="23" viewBox="0 0 300 180" fill="none" className="tt-flag">
                <rect width="300" height="180" fill="#CE1126"/>
                <polygon points="0,0 50,0 300,180 250,180" fill="#FFFFFF"/>
                <polygon points="0,0 35,0 300,180 265,180" fill="#000000"/>
              </svg>
              <div>
                <a href="https://ttconnect.gov.tt" target="_blank" rel="noreferrer" className="gov-site-link">
                  ttconnect.gov.tt
                </a>
                <div className="gov-site-sub">Official Portal for Government Services &amp; Public Information</div>
              </div>
            </div>

            <div className="footer-legal-links">
              <a href="#accessibility">Accessibility Statement</a>
              <span className="sep">•</span>
              <a href="#sitemap">Sitemap</a>
              <span className="sep">•</span>
              <a href="#privacy">Privacy</a>
              <span className="sep">•</span>
              <a href="#cookies">Cookies</a>
              <span className="sep">•</span>
              <a href="#contact">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <main>
      <GovernmentBar />
      <Header />
      <Notice />
      <Hero />
      <NeedsToday />
      <DashboardRow />
      <ServicesAndPartners />
      <Footer />
      
      {/* Floating Incident CTA with diagonal morph & camera following */}
      <ReportIncidentButton
        label="Need immediate support?"
        targetId="incident-panel-media"
        cardId="incident-card"
        heroCtaId="hero-incident-cta"
      />
    </main>
  );
}
```
-e 

## File: src/styles/globals.css
```css
```
-e 

## File: src/styles/index.css
```css
@import "./fonts.css";
```
-e 

## File: src/styles/tailwind.css
```css
@import 'tailwindcss' source(none);
@source '../**/*.{js,ts,jsx,tsx}';

@import 'tw-animate-css';
```
-e 

## File: src/styles/homepage.css
```css
/* GOV.UK / TT-CSIRT Official Design System */
:root {
  --gov-blue: #1d70b8;           /* Primary blue / brand from palette */
  --gov-blue-dark: #114e82;      /* Dark navy blue from palette */
  --gov-blue-mid: #2a8ade;       /* Mid blue from palette */
  --gov-blue-accent: #2891ec;    /* Bright accent blue from palette */
  --gov-blue-soft: #79b8f8;      /* Soft blue from palette */
  --gov-blue-light: #e6f1fc;     /* Ultra-light blue tint */
  --gov-blue-offwhite: #f4f8fb;  /* GOV.UK ultra-light off-white background */
  --gov-navy: #0b0c0c;           /* Black / text */
  --gov-red: #d64545;            /* Primary warm signal red / incident action */
  --gov-red-hover: #c83d3d;      /* Warm signal red hover */
  --gov-red-active: #b93636;     /* Warm signal red active / pressed */
  --gov-red-light: #fdf2f2;      /* Ultra-light red tint for incident callout surfaces */
  --gov-red-border: #f8d7da;     /* Subtle red border */
  --gov-orange: #f47738;         /* Primary orange */
  --gov-yellow: #ffdd00;         /* Primary yellow / focus */
  --gov-grey-light: #f4f8fb;     /* GOV.UK light section fill */
  --gov-grey-border: #d2e2f1;    /* GOV.UK subtle border */
  --gov-grey-soft: #d2e2f1;      /* GOV.UK subtle border */
  --gov-text-dark: #0b0c0c;      /* Black / text */
  --gov-text-muted: #484949;     /* Black tint 25% / secondary-text */
  
  --page-gutter: clamp(16px, 3.5vw, 48px);
  --content-max: 1320px;
  
  /* Square edges with subtle micro-rounding (1px - 2px) */
  --panel-radius: 2px;
  --control-radius: 2px;
  --badge-radius: 1px;
  --dot-radius: 1px;

  /* Masthead Identity Alignment Tokens */
  --masthead-emblem-width: 58px;
  --masthead-emblem-height: 50px;
  --masthead-identity-gap: 8px;
  --masthead-emblem-width-mobile: 48px;
  --masthead-emblem-height-mobile: 44px;
  
  font-family: 'Public Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

html {
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100vw;
  min-width: 0;
  overflow-x: hidden;
  background: #f4f7fa;
  color: var(--gov-text-dark);
  font-family: 'Public Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root, main {
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  font-family: inherit;
  font-size: 16px;
  line-height: 1.5;
}

a {
  color: var(--gov-blue);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}
a:hover {
  color: var(--gov-blue-dark);
  text-decoration-thickness: 3px;
}

button, input, select, textarea {
  font-family: inherit;
}

/* ========================================================
   1. GOVERNMENT TOP BAR (BORDERLESS)
   ======================================================== */
.government-bar-container {
  width: 100%;
  background: #ffffff;
  border: none;
}

.government-bar {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 8px var(--page-gutter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
}

.government-left {
  display: flex;
  align-items: center;
  gap: var(--masthead-identity-gap);
}

.government-emblem-slot {
  width: var(--masthead-emblem-width);
  min-width: var(--masthead-emblem-width);
  height: var(--masthead-emblem-height);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.coat {
  max-width: var(--masthead-emblem-width);
  max-height: var(--masthead-emblem-height);
  width: auto;
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.government-titles {
  display: flex;
  flex-direction: column;
  gap: 1px;
  text-align: left;
  justify-content: center;
  min-width: 0;
}

.government-republic {
  margin: 0;
  padding: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--gov-text-muted);
  text-transform: uppercase;
  line-height: 1.2;
  text-align: left;
}

.government-ministry {
  margin: 0;
  padding: 0;
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--gov-text-dark);
  letter-spacing: -0.01em;
  text-align: left;
}

.government-tools {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}

.government-tools a {
  color: var(--gov-text-muted);
  text-decoration: none;
  font-weight: 600;
}
.government-tools a:hover {
  color: var(--gov-blue);
  text-decoration: underline;
}

.search-box {
  display: flex;
  align-items: center;
  height: 38px;
  width: 250px;
  border: none;
  border-radius: var(--control-radius);
  overflow: hidden;
  background: #edf2f7;
  transition: box-shadow 0.15s ease, background 0.15s ease;
}

.search-box:focus-within {
  background: #ffffff;
  box-shadow: 0 0 0 2px var(--gov-blue);
}

.search-box input {
  flex: 1;
  min-width: 0;
  padding: 0 14px;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: var(--gov-text-dark);
}

.search-box button {
  width: 38px;
  height: 100%;
  border: none;
  background: var(--gov-blue);
  color: #ffffff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.15s ease;
}
.search-box button:hover {
  background: var(--gov-blue-dark);
}

/* ========================================================
   2. PRIMARY HEADER (BORDERLESS)
   ======================================================== */
.header-container {
  width: 100%;
  background: var(--gov-blue);
  border: none;
}

.site-header {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 12px var(--page-gutter);
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--gov-blue);
  color: #ffffff;
  border: none;
}

.site-brand {
  display: flex;
  align-items: center;
  gap: var(--masthead-identity-gap);
  color: #ffffff;
  text-decoration: none;
  flex-shrink: 0;
  min-width: 0;
}

.brand-emblem-slot {
  width: var(--masthead-emblem-width);
  min-width: var(--masthead-emblem-width);
  height: var(--masthead-emblem-height);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ffffff;
  padding: 2px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand-titles {
  display: flex;
  flex-direction: column;
  gap: 1px;
  text-align: left;
  justify-content: center;
  min-width: 0;
}

.brand-acronym {
  margin: 0;
  padding: 0;
  display: block;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: #ffffff;
  text-align: left;
}

.brand-fullname {
  margin: 0;
  padding: 0;
  display: block;
  font-size: 14px;
  line-height: 1.25;
  color: #E2E8F0;
  font-weight: 500;
  letter-spacing: -0.005em;
  text-align: left;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.desktop-nav a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 700;
  text-decoration: none;
  border: none;
  border-radius: var(--control-radius);
  transition: background 0.15s ease;
}

.desktop-nav a:hover {
  background: rgba(255, 255, 255, 0.16);
}

.report-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 18px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  border: none;
  border-radius: var(--control-radius);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.report-button:hover {
  background: #ffffff;
  color: var(--gov-blue-dark);
}

.menu-button, .mobile-nav {
  display: none;
}

/* ========================================================
   3. OFFICIAL NOTICE BAR (BORDERLESS)
   ======================================================== */
.notice-container {
  width: 100%;
  background: var(--gov-grey-light);
  border: none;
}

.notice {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 10px var(--page-gutter);
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--gov-grey-light);
  font-size: 14.5px;
  border: none;
}

.notice-label {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  background: var(--gov-red);
  color: #ffffff;
  border: none;
  border-radius: var(--badge-radius);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.notice-rule {
  display: none;
}

.notice-copy {
  font-weight: 700;
  color: var(--gov-text-dark);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--gov-blue);
  white-space: nowrap;
}

.notice-subscribe {
  margin-left: 12px;
  color: var(--gov-text-dark) !important;
  font-weight: 600 !important;
}
.notice-subscribe svg {
  color: var(--gov-blue);
}

/* ========================================================
   4. HERO SECTION (BORDERLESS SOLID HEADER BLUE)
   ======================================================== */
.hero-container {
  width: 100%;
  background-color: var(--gov-blue);
  margin: 0 0 28px;
  overflow: hidden;
  border: none;
}

.hero {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 var(--page-gutter);
  display: grid;
  grid-template-columns: 1.18fr 0.82fr;
  gap: 32px;
  color: #ffffff;
  position: relative;
  align-items: stretch;
  border: none;
}

.hero-left {
  padding: 32px 16px 26px 0;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
}

.hero-badge-row {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border: none;
  background: rgba(15, 56, 92, 0.45);
  color: #ffffff;
  border-radius: var(--badge-radius);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.25;
  text-transform: uppercase;
}

/* Fixed-geometry Crossfade Slide Viewport (Hugs max content height with 0 dead space) */
.hero-slides-viewport {
  display: grid;
  grid-template-areas: "slide";
  margin-bottom: 18px;
  position: relative;
  width: 100%;
  max-width: 620px;
}

.hero-slide-panel {
  grid-area: slide;
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(3px);
  transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.24s step-end;
}

.hero-slide-panel.active {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), visibility 0s;
}

.hero-slide-title,
.hero-left h1 {
  margin: 0 0 10px;
  font-size: clamp(28px, 3.2vw, 44px);
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.022em;
  color: #ffffff;
  max-width: 620px;
}

.hero-line {
  display: block;
  width: 44px;
  height: 3.5px;
  background: #ffffff;
  margin-bottom: 12px;
  border-radius: var(--dot-radius);
  flex-shrink: 0;
}

.hero-lead-text {
  margin: 0;
  font-size: clamp(15px, 1.1vw, 16.5px);
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.95);
  max-width: 600px;
}

.hero-actions-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.hero-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 22px;
  background: var(--gov-red);
  color: #ffffff;
  border: none;
  border-radius: var(--control-radius);
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(11, 12, 12, 0.22);
  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
}

.hero-btn-primary svg {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  stroke-width: 4px;
}

.hero-btn-primary:hover {
  background: var(--gov-red-hover);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(11, 12, 12, 0.28);
}

.hero-btn-primary:active {
  background: var(--gov-red-active);
  color: #ffffff;
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(11, 12, 12, 0.2);
}

.hero-btn-primary:focus-visible {
  outline: 3px solid #ffdd00;
  outline-offset: 3px;
}

.hero-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.16);
  border: none;
  color: #ffffff;
  border-radius: var(--control-radius);
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s ease;
  white-space: nowrap;
}

.hero-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.26);
  color: #ffffff;
}

.hero-btn-secondary:focus-visible {
  outline: 3px solid #ffdd00;
  outline-offset: 3px;
}

/* Dedicated Carousel Navigation Rail (Borderless) */
.hero-nav-rail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 18px;
  border: none;
  max-width: 600px;
  width: 100%;
  margin-top: auto;
}

.hero-slide-counter {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.92);
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.counter-sep {
  opacity: 0.55;
  font-weight: 600;
}

.hero-carousel-controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.hero-nav-arrow {
  width: 38px;
  height: 38px;
  border-radius: var(--control-radius);
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s ease, transform 0.15s ease;
}

.hero-nav-arrow svg {
  flex-shrink: 0;
  stroke-width: 3.75px;
}

.hero-nav-arrow:hover {
  background: rgba(255, 255, 255, 0.28);
}

.hero-nav-arrow:focus-visible {
  outline: 3px solid #ffdd00;
  outline-offset: 2px;
}

.hero-nav-dots {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
}

.hero-dot-btn {
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.hero-dot-inner {
  width: 8px;
  height: 8px;
  border-radius: var(--dot-radius);
  background: rgba(255, 255, 255, 0.45);
  border: none;
  transition: width 0.18s ease, background 0.18s ease;
}

.hero-dot-btn.active .hero-dot-inner {
  width: 22px;
  border-radius: var(--dot-radius);
  background: #ffffff;
}

.hero-dot-btn:hover .hero-dot-inner {
  background: rgba(255, 255, 255, 0.8);
}

.hero-dot-btn:focus-visible {
  outline: none;
}

.hero-dot-btn:focus-visible .hero-dot-inner {
  box-shadow: 0 0 0 3px #ffdd00;
}

/* Hero Right: Our Mandate (Borderless) */
.hero-right {
  padding: 32px 32px;
  margin: 24px 0;
  background: #114e82;
  border: none;
  border-radius: var(--panel-radius);
  box-shadow: 0 4px 16px rgba(11, 12, 12, 0.2);
  display: flex;
  flex-direction: column;
}

.mandate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.mandate-header h2 {
  margin: 0;
  font-size: 26px;
  line-height: 1.2;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.mandate-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.18);
  border: none;
  color: #ffffff;
  padding: 3px 8px;
  border-radius: var(--badge-radius);
  white-space: nowrap;
}

.mandate-intro {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.92);
}

.mandate-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mandate-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 4px 0;
  border: none;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.35;
}

.mandate-bullet {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: var(--dot-radius);
  background: var(--gov-blue-light);
  margin-top: 6px;
  flex-shrink: 0;
}

.mandate-text {
  flex: 1;
  min-width: 0;
}

.mandate-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
  color: var(--gov-blue-light);
  font-size: 14.5px;
  font-weight: 700;
  text-decoration: underline;
  transition: color 0.15s ease;
}

.mandate-link:hover {
  color: var(--gov-blue-offwhite);
}

.mandate-link:focus-visible {
  outline: 3px solid #ffdd00;
  outline-offset: 3px;
}

/* ========================================================
   5. WHAT DO YOU NEED TO DO TODAY? (BORDERLESS)
   ======================================================== */
.needs-section {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto 36px;
  padding: 0 var(--page-gutter);
}

.needs-heading h2 {
  margin: 0 0 4px;
  font-size: 28px;
  font-weight: 800;
  color: var(--gov-text-dark);
  letter-spacing: -0.02em;
}

.needs-heading p {
  margin: 0 0 20px;
  font-size: 15px;
  color: var(--gov-text-muted);
}

.needs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.need-card {
  background: #ffffff;
  border: none;
  border-radius: var(--panel-radius);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 380px;
  box-shadow: 0 2px 10px rgba(15, 56, 92, 0.07);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.need-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 22px rgba(15, 56, 92, 0.12);
}

.need-card-media {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: #eef3f8;
  flex-shrink: 0;
  border-radius: var(--panel-radius) var(--panel-radius) 0 0;
}

.need-card-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 25%;
  transition: transform 0.28s ease;
}

.need-card:hover .need-card-media img {
  transform: scale(1.03);
}

.need-card-media--individuals {
  background: #fcebc5;
  height: auto;
  aspect-ratio: 6 / 5;
}

.need-card-media--individuals img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  image-rendering: -webkit-optimize-contrast;
}

.need-card-media--businesses {
  background: #eef3f8;
}

.need-card-media--businesses img {
  object-fit: cover;
  object-position: center 22%;
}

.need-card-media--government {
  background: #eef3f8;
}

.need-card-media--government img {
  object-fit: cover;
  object-position: center 22%;
}

.need-card-media--incident {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 24px;
  background: #edf2f7;
  color: transparent;
  isolation: isolate;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 180px;
  box-sizing: border-box;
  border-radius: var(--panel-radius) var(--panel-radius) 0 0;
  border: none;
  transition: none !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.need-card-media--incident .incident-panel-icon,
.need-card-media--incident .incident-panel-title {
  opacity: 0;
  visibility: hidden;
  transition: none !important;
}

.need-card-media--incident.isDocked,
.need-card-media--incident:not(.destinationHidden).isDocked {
  background: var(--gov-red, #d64545) !important;
  color: #ffffff !important;
  transition: none !important;
}

.need-card-media--incident.isDocked .incident-panel-icon,
.need-card-media--incident.isDocked .incident-panel-title {
  opacity: 1 !important;
  visibility: visible !important;
  transition: none !important;
}

.need-card-media--incident .incident-panel-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
  z-index: 1;
  width: 20px;
  height: 20px;
  stroke-width: 4px;
}

.need-card-media--incident .incident-panel-title {
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #ffffff;
  z-index: 1;
  line-height: 1.2;
  white-space: nowrap;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.need-card-media--incident.highlightPulse {
  animation: physicalImpactPulse 0.32s cubic-bezier(0.2, 0.9, 0.4, 1) forwards;
  will-change: transform, filter;
  transform-origin: center center;
}

@keyframes physicalImpactPulse {
  0% {
    transform: translateY(0) scale(1);
    filter: brightness(1.04) contrast(1.02);
  }
  35% {
    transform: translateY(0.75px) scale(1.003);
    filter: brightness(1.02) contrast(1.01);
  }
  100% {
    transform: translateY(0) scale(1);
    filter: brightness(1) contrast(1);
  }
}

/* Dramatic Scroll Unroll Slide-Down Animation */
.need-card--incident.contentStaged .need-card-content {
  opacity: 0;
  transform: translateY(-100%) scaleY(0.2);
  clip-path: inset(0 0 100% 0);
  pointer-events: none;
}

.need-card--incident.scrollUnrollActive .need-card-content {
  animation: dramaticIncidentScrollUnroll 0.61s cubic-bezier(0.16, 1.14, 0.29, 1) forwards;
  transform-origin: top center;
  will-change: transform, opacity, clip-path, box-shadow;
  position: relative;
  z-index: 0;
}

@keyframes dramaticIncidentScrollUnroll {
  0% {
    opacity: 0;
    transform: translateY(-46px) scaleY(0.45);
    clip-path: inset(0 0 100% 0);
    box-shadow: inset 0 20px 24px -10px rgba(152, 40, 40, 0.25);
  }
  25% {
    opacity: 0.85;
    clip-path: inset(0 0 35% 0);
  }
  65% {
    clip-path: inset(0 0 0% 0);
    box-shadow: inset 0 10px 14px -6px rgba(152, 40, 40, 0.12);
  }
  85% {
    transform: translateY(2px) scaleY(1.015);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scaleY(1);
    clip-path: inset(0 0 0% 0);
    box-shadow: inset 0 0 0 0 transparent;
  }
}

.need-card--incident.scrollUnrollActive .need-card-eyebrow {
  animation: scrollElementDramaticCascade 0.48s cubic-bezier(0.16, 1.12, 0.3, 1) 0.05s backwards;
}

.need-card--incident.scrollUnrollActive .need-card-header {
  animation: scrollElementDramaticCascade 0.50s cubic-bezier(0.16, 1.12, 0.3, 1) 0.10s backwards;
}

.need-card--incident.scrollUnrollActive p {
  animation: scrollElementDramaticCascade 0.52s cubic-bezier(0.16, 1.12, 0.3, 1) 0.16s backwards;
}

.need-card--incident.scrollUnrollActive .need-card-contacts {
  animation: scrollElementDramaticCascade 0.54s cubic-bezier(0.16, 1.12, 0.3, 1) 0.22s backwards;
}

.need-card--incident.scrollUnrollActive .need-card-link--danger {
  animation: scrollElementDramaticCascade 0.56s cubic-bezier(0.16, 1.12, 0.3, 1) 0.28s backwards;
}

@keyframes scrollElementDramaticCascade {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  70% {
    opacity: 1;
    transform: translateY(1.5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .need-card--incident.scrollUnrollActive .need-card-content,
  .need-card--incident.scrollUnrollActive .need-card-eyebrow,
  .need-card--incident.scrollUnrollActive .need-card-header,
  .need-card--incident.scrollUnrollActive p,
  .need-card--incident.scrollUnrollActive .need-card-contacts,
  .need-card--incident.scrollUnrollActive .need-card-link--danger {
    animation: none !important;
  }
}

.need-card-content {
  padding: 20px 22px 22px;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.need-card--incident {
  border: none;
}

.need-card-eyebrow {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--gov-text-muted);
  text-transform: uppercase;
  margin: 0 0 10px;
}

.need-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 48px;
  margin-bottom: 10px;
}

.need-card-icon {
  color: var(--gov-blue);
  flex-shrink: 0;
  margin-top: 2px;
}

.need-card-icon--danger {
  color: var(--gov-red);
}

.need-card h3 {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--gov-text-dark);
}

.need-card p {
  font-size: 15px;
  line-height: 1.55;
  color: var(--gov-text-muted);
  margin: 0 0 16px;
}

.need-card a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 15px;
  color: var(--gov-blue);
  margin-top: auto;
}

.need-card-link--danger {
  color: var(--gov-red) !important;
}

.need-card-contacts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 16px;
  padding: 12px 14px;
  background-color: #fdf5f5;
  border: none;
  border-radius: var(--control-radius);
}

.need-card-contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--gov-text-dark);
}

.need-card-contact-item a {
  margin-top: 0 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  color: var(--gov-red) !important;
  text-decoration: underline;
}

.need-card-contact-item a:hover {
  text-decoration: none;
}

.needs-footer-note {
  margin-top: 18px;
  font-size: 15px;
  color: var(--gov-text-muted);
}

.inline-report-link {
  color: var(--gov-red) !important;
  font-weight: 700;
}

/* ========================================================
   6. DASHBOARD ROW (ADVISORIES & INCIDENTS) - BORDERLESS
   ======================================================== */
.dashboard-row {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto 36px;
  padding: 0 var(--page-gutter);
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
}

.content-card {
  background: #ffffff;
  border: none;
  border-radius: var(--panel-radius);
  padding: 24px;
  box-shadow: 0 2px 10px rgba(15, 56, 92, 0.07);
  display: flex;
  flex-direction: column;
}

.advisories-header {
  margin-bottom: 18px;
}

.advisories-header > p {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--gov-text-muted);
  margin: 0 0 4px;
}

.advisories-header > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.advisories-header a {
  font-size: 14px;
  font-weight: 700;
  color: var(--gov-blue);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s ease;
}

.advisories-header a svg {
  transition: transform 0.15s ease;
}

.advisories-header a:hover {
  color: var(--gov-blue-dark);
  text-decoration-thickness: 3px;
}

.advisories-header a:hover svg {
  transform: translateX(3px);
}

.advisories-header h2, .incidents-panel h2, .content-card h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
  color: var(--gov-text-dark);
  letter-spacing: -0.015em;
}

.advisory-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.advisory {
  display: grid;
  grid-template-columns: 84px 1fr auto 18px;
  align-items: flex-start;
  gap: 16px;
  padding: 10px 8px;
  border: none;
  border-radius: var(--control-radius);
  text-decoration: none;
  transition: background 0.15s ease;
}

.advisory:hover {
  background: var(--gov-blue-offwhite);
}

.severity {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-align: center;
  margin: 1px 0 0;
  border: none;
  border-radius: var(--badge-radius);
}
.severity--alert, .severity--critical {
  background: var(--gov-red);
}
.severity--advisory, .severity--high {
  background: var(--gov-orange);
}
.severity--medium {
  background: #f47738;
}
.severity--info, .severity--low {
  background: var(--gov-blue);
}

.advisory-content {
  min-width: 0;
}

.advisory-content b {
  font-size: 16.5px;
  font-weight: 700;
  color: var(--gov-blue);
  line-height: 1.35;
  text-decoration: underline;
  text-underline-offset: 3px;
  display: block;
}
.advisory:hover .advisory-content b {
  color: var(--gov-blue-dark);
  text-decoration-thickness: 2px;
}

.advisory-desc {
  margin: 4px 0 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--gov-text-muted);
}

.advisory time {
  margin: 2px 0 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--gov-text-muted);
  text-align: right;
  white-space: nowrap;
}

.advisory-arrow {
  display: block;
  color: var(--gov-blue);
  flex-shrink: 0;
  margin-top: 3px;
  transition: transform 0.15s ease;
}

.advisory:hover .advisory-arrow {
  transform: translateX(3px);
  color: var(--gov-blue-dark);
}

.advisory-callout {
  margin-top: auto;
  padding: 16px 20px;
  background: var(--gov-blue-offwhite);
  border: none;
  border-radius: var(--control-radius);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.advisory-callout-main {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.advisory-callout-icon,
.advisory-callout > svg {
  color: var(--gov-blue);
  flex-shrink: 0;
  width: 22px;
  height: 22px;
}

.advisory-callout-text {
  min-width: 0;
}

.advisory-callout b,
.advisory-callout-text b {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--gov-text-dark);
  line-height: 1.3;
}

.advisory-callout p,
.advisory-callout-text p {
  margin: 3px 0 0;
  font-size: 14.5px;
  color: var(--gov-text-muted);
  line-height: 1.5;
}

.advisory-callout-link,
.advisory-callout a {
  margin-left: auto;
  font-size: 15px;
  font-weight: 700;
  color: var(--gov-blue);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.advisory-callout-link:hover,
.advisory-callout a:hover {
  color: var(--gov-blue-dark);
  text-decoration-thickness: 2px;
}

.advisory-callout-link svg,
.advisory-callout a svg {
  transition: transform 0.15s ease;
}

.advisory-callout-link:hover svg,
.advisory-callout a:hover svg {
  transform: translateX(3px);
}

/* Incidents Panel (Borderless) */
.incidents-panel__eyebrow {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--gov-text-muted);
  text-transform: uppercase;
  margin: 0 0 4px;
}

.incidents-panel h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
  color: var(--gov-text-dark);
  letter-spacing: -0.015em;
}

.incidents-panel__subtext {
  font-size: 15px;
  color: var(--gov-text-muted);
  line-height: 1.55;
  margin: 8px 0 16px;
}

.incident-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.incident-row-card {
  display: flex;
  align-items: center;
  background: var(--gov-blue-offwhite);
  border: none;
  padding: 14px 16px;
  gap: 20px;
  border-radius: var(--control-radius);
}

.incident-card-left {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.incident-icon {
  width: 30px;
  height: 30px;
  color: var(--gov-blue);
  flex-shrink: 0;
  margin-top: 2px;
}

.incident-stat-group {
  display: flex;
  flex-direction: column;
}

.incident-val {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  color: var(--gov-blue);
  margin-bottom: 2px;
}

.incident-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--gov-text-dark);
  line-height: 1.25;
}

.incident-subtitle {
  font-size: 13px;
  line-height: 1.4;
  color: var(--gov-text-muted);
  margin-top: 2px;
}

.incident-card-divider {
  display: none;
}

.incident-card-right {
  flex: 1.1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.incident-card-right p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--gov-text-dark);
}

/* Key insight box (Borderless) */
.incident-insight-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--gov-blue-offwhite);
  border: none;
  border-radius: var(--control-radius);
}

.insight-icon {
  width: 24px;
  height: 24px;
  color: var(--gov-blue);
  flex-shrink: 0;
  margin-top: 2px;
}

.insight-content {
  display: flex;
  flex-direction: column;
}

.insight-content b {
  font-size: 14.5px;
  font-weight: 800;
  color: var(--gov-blue);
  margin-bottom: 2px;
}

.insight-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--gov-text-dark);
}

.card-bottom-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 15px;
  color: var(--gov-blue);
}

/* ========================================================
   7. SERVICES, PARTNERS & ABOUT GRID (BORDERLESS)
   ======================================================== */
.content-cards {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto 36px;
  padding: 0 var(--page-gutter);
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 24px;
}

.section-eyebrow {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gov-text-muted);
  margin: 0 0 6px;
}

.services-heading {
  font-size: 23px;
  font-weight: 800;
  color: var(--gov-text-dark);
  margin: 0 0 6px;
  line-height: 1.25;
}

.section-intro {
  font-size: 15px;
  line-height: 1.55;
  color: var(--gov-text-muted);
  margin: 0 0 16px;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.service {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: var(--control-radius);
  text-decoration: none;
  background: #ffffff;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.service:hover {
  background: var(--gov-blue-offwhite);
  border-color: var(--gov-grey-border);
}

.service-icon {
  color: var(--gov-blue);
  flex-shrink: 0;
  margin-top: 2px;
}

.service-body {
  flex: 1;
  min-width: 0;
}

.service-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 3px;
}

.service-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--gov-blue);
  line-height: 1.35;
}

.service:hover .service-title {
  color: var(--gov-blue-dark);
  text-decoration: underline;
}

.service-tag {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 2.5px 8px;
  border-radius: var(--badge-radius);
  display: inline-block;
  line-height: 1.2;
}

.service-tag--live {
  background-color: #e2eeff;
  color: #0b559b;
  border: none;
}

.service-tag--daily {
  background-color: #e3f5ec;
  color: #0d6d49;
  border: 1px solid #bce6d2;
}

.service-desc {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--gov-text-muted);
}

.service-arrow {
  color: var(--gov-blue);
  margin-left: auto;
  flex-shrink: 0;
  margin-top: 3px;
  transition: transform 0.15s ease;
}

.service:hover .service-arrow {
  transform: translateX(3px);
  color: var(--gov-blue-dark);
}

.services-support-callout {
  background-color: var(--gov-blue-offwhite);
  padding: 14px 18px;
  border-radius: var(--control-radius);
  border: 1px solid var(--gov-grey-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.callout-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--gov-text-dark);
  display: block;
  line-height: 1.3;
}

.callout-sub {
  font-size: 13.5px;
  color: var(--gov-text-muted);
}

.services-support-callout .card-bottom-link {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Partners Panel Blue Intro Box (Borderless) */
.partners-panel {
  padding: 0 !important;
  overflow: hidden;
  border: none;
}

.partners-panel__intro {
  background: var(--gov-blue);
  color: #ffffff;
  padding: 24px;
  border: none;
}

.partners-panel__intro p {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 6px;
}

.partners-panel__intro h2 {
  color: #ffffff !important;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.015em;
  margin: 0;
}

.partners-panel__list {
  padding: 16px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.partner-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 10px;
  border: none;
  border-radius: var(--control-radius);
  transition: background 0.15s ease;
}

.partner-row:hover {
  background: var(--gov-blue-offwhite);
}

.partner-row svg {
  color: var(--gov-blue);
  flex-shrink: 0;
  margin-top: 2px;
  width: 20px;
  height: 20px;
}

.partner-row h3 {
  margin: 0 0 3px;
  font-size: 16px;
  font-weight: 700;
  color: var(--gov-text-dark);
}

.partner-row p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--gov-text-muted);
}

.partners-panel__link {
  padding: 14px 20px 18px;
  margin-top: auto;
  font-size: 15px;
  font-weight: 700;
}

/* About Facts & Links (Borderless) */
.about-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
  margin-bottom: 16px;
  padding: 16px 18px;
  background: var(--gov-blue-offwhite);
  border: none;
  border-radius: var(--control-radius);
}

.about-facts span {
  font-size: 13px;
  color: var(--gov-text-muted);
  display: block;
}

.about-facts b {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: var(--gov-text-dark);
  margin-top: 3px;
}

.about-resources {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
}

.about-resources-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--gov-text-muted);
  margin: 0 0 6px;
}

.about-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.about-links a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border: none;
  border-radius: var(--control-radius);
  font-size: 15px;
  font-weight: 700;
  color: var(--gov-blue);
  text-decoration: none;
  transition: background 0.15s ease;
}

.about-links a:hover {
  background: var(--gov-blue-offwhite);
  color: var(--gov-blue-dark);
}

/* ========================================================
   8. FOOTER (BORDERLESS)
   ======================================================== */
.footer-wrapper {
  width: 100%;
  font-family: inherit;
  margin-top: 48px;
  border: none;
}

/* Dark Navy Top Section */
.footer-dark-bg {
  width: 100%;
  background-color: #0f385c;
  color: #ffffff;
  padding: 48px 0;
  border: none;
}

.footer-content-grid {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 var(--page-gutter);
  display: grid;
  grid-template-columns: 1.15fr 1fr 1.15fr 1.05fr 1.25fr;
  gap: 36px;
  align-items: start;
}

.footer-col {
  display: flex;
  flex-direction: column;
}

.col-subscribe {
  border: none;
  padding-left: 0;
}

.footer-heading {
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
}

.footer-heading-bar {
  width: 32px;
  height: 3px;
  background-color: #ffffff;
  margin-top: 8px;
  margin-bottom: 20px;
  border-radius: var(--dot-radius);
}

.footer-text {
  font-size: 13.5px;
  line-height: 1.55;
  color: #d2e2f1;
  margin: 0;
}

/* Column 2: Quick Navigation */
.footer-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-nav-list li {
  border: none;
}

.footer-nav-list li a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  color: #ffffff;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: color 0.15s ease;
}

.footer-nav-list li a:hover {
  color: #8eb8dc;
}

.nav-chevron {
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

/* Column 3: Partner Agencies */
.footer-agency-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-agency-list li {
  border: none;
}

.footer-agency-list li a {
  display: block;
  padding: 6px 0;
  color: #ffffff;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.4;
  transition: color 0.15s ease;
}

.footer-agency-list li a:hover {
  color: #8eb8dc;
}

/* Column 4: Contact & Social */
.footer-contact-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 13.5px;
  color: #ffffff;
  line-height: 1.4;
}

.contact-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: var(--control-radius);
  border: none;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
  margin-top: 1px;
}

.contact-main-text {
  font-weight: 600;
}

.contact-sub {
  font-size: 12px;
  color: #8eb8dc;
  margin-top: 2px;
}

.contact-mail-link {
  color: #ffffff;
  text-decoration: none;
  font-weight: 500;
  word-break: break-all;
}

.contact-mail-link:hover {
  text-decoration: underline;
}

.contact-address {
  color: #ffffff;
  line-height: 1.45;
}

.footer-social-circles {
  display: flex;
  gap: 10px;
}

.footer-social-circles a {
  width: 34px;
  height: 34px;
  border-radius: var(--control-radius);
  border: none;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  text-decoration: none;
  transition: all 0.2s ease;
}

.footer-social-circles a:hover {
  background-color: #ffffff;
  color: #0f385c;
}

/* Column 5: Subscribe (Borderless) */
.footer-subscribe-box {
  display: flex;
  width: 100%;
  border-radius: var(--control-radius);
  border: none;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.footer-subscribe-box input {
  flex: 1;
  min-width: 0;
  background-color: #ffffff;
  border: none;
  padding: 10px 14px;
  font-size: 13.5px;
  color: #0b0c0c;
  outline: none;
}

.footer-subscribe-box button {
  background-color: #16548a;
  color: #ffffff;
  font-weight: 700;
  border: none;
  padding: 10px 20px;
  font-size: 13.5px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease;
}

.footer-subscribe-box button:hover {
  background-color: #0f385c;
}

/* Light Bottom Section (Borderless) */
.footer-light-bg {
  width: 100%;
  background-color: #eaeff5;
  border: none;
  padding: 20px 0;
}

.footer-light-container {
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 var(--page-gutter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.footer-light-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-coat-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.gov-copyright {
  font-size: 12.5px;
  font-weight: 500;
  color: #484949;
  line-height: 1.4;
}

.footer-light-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.footer-gov-site {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background-color: #ffffff;
  border: none;
  border-radius: var(--control-radius);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  width: fit-content;
}

.footer-legal-links {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
}

.footer-legal-links a {
  color: #16548a;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s ease;
}

.footer-legal-links a:hover {
  color: #0f385c;
}

.footer-legal-links .sep {
  color: #858686;
  font-size: 11px;
}

.tt-flag {
  border-radius: var(--dot-radius);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.gov-site-link {
  font-size: 13.5px;
  font-weight: 800;
  color: #16548a;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.gov-site-sub {
  font-size: 12px;
  color: #484949;
}

.footer-light-coat {
  height: 56px;
  width: auto;
  object-fit: contain;
}

.ministry-info {
  display: flex;
  flex-direction: column;
}

.gov-line {
  font-size: 13px;
  color: #484949;
  line-height: 1.3;
}

.ministry-line {
  font-size: 17px;
  font-weight: 800;
  color: #0b0c0c;
  line-height: 1.3;
  margin-top: 1px;
}

.tagline-line {
  font-size: 12px;
  color: #484949;
  margin-top: 3px;
}

/* ========================================================
   9. RESPONSIVE BREAKPOINTS (ALL SCREEN SIZES)
   ======================================================== */

/* Breakpoint for Tablets, Mobile Landscape & Compact Screens (< 1180px) */
@media (max-width: 1180px) {
  .desktop-nav, .report-button {
    display: none !important;
  }
  .menu-button {
    display: inline-flex;
  }
  .government-tools a {
    display: none;
  }
  .search-box {
    width: 180px;
  }
  .hero {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .hero-left {
    padding: 24px 0 16px;
  }
  .hero-right {
    margin: 0 0 20px;
    border: none;
  }
  .needs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .content-cards {
    grid-template-columns: 1fr;
  }
  .dashboard-row {
    grid-template-columns: 1fr;
  }
  .footer-content-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .col-subscribe {
    border: none;
    padding-left: 0;
    grid-column: span 2;
  }
  .footer-light-container {
    flex-direction: column;
    gap: 24px;
    align-items: flex-start;
  }
  .footer-light-vdivider {
    display: none;
  }
}

/* Tablet to Mobile Breakpoint (< 780px) */
@media (max-width: 780px) {
  .government-tools {
    display: none;
  }
  .government-emblem-slot,
  .brand-emblem-slot {
    width: var(--masthead-emblem-width-mobile);
    min-width: var(--masthead-emblem-width-mobile);
    height: var(--masthead-emblem-height-mobile);
  }
  .coat {
    max-width: var(--masthead-emblem-width-mobile);
    max-height: var(--masthead-emblem-height-mobile);
  }
  .brand-logo {
    width: 42px;
    height: 42px;
  }
  .site-header {
    padding: 8px var(--page-gutter);
    gap: 12px;
  }
  .brand-acronym {
    font-size: 13.5px;
    font-weight: 950;
  }
  .brand-fullname {
    font-size: 13px;
    line-height: 1.25;
  }
  .mobile-nav {
    display: flex;
    flex-direction: column;
    background: var(--gov-blue-dark);
    padding: 16px var(--page-gutter);
    border: none;
    gap: 4px;
  }
  .mobile-nav a {
    color: #ffffff;
    padding: 10px 0;
    text-decoration: none;
    font-weight: 700;
    border: none;
  }
  .mobile-report-btn {
    margin-top: 8px;
    background: var(--gov-red) !important;
    color: #ffffff !important;
    text-align: center;
    padding: 12px !important;
    border-radius: var(--control-radius);
    display: block;
  }
  .notice {
    flex-wrap: wrap;
    gap: 10px;
  }
  .notice-subscribe {
    margin-left: 0;
  }
  .hero-left {
    padding: 18px 0 12px;
  }
  .hero-slides-viewport {
    margin-bottom: 14px;
  }
  .hero-right {
    padding: 20px 16px;
    margin-bottom: 16px;
    border: none;
  }
  .hero-left h1 {
    font-size: clamp(24px, 6.8vw, 32px);
    line-height: 1.14;
    margin-bottom: 8px;
  }
  .hero-line {
    margin-bottom: 10px;
  }
  .hero-actions-group {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 16px;
  }
  .hero-btn-primary,
  .hero-btn-secondary {
    width: 100%;
    min-width: 0;
    justify-content: center;
    text-align: center;
  }
  .hero-nav-rail {
    padding-top: 10px;
    margin-bottom: 2px;
    border: none;
  }
  .need-card-media {
    height: 180px;
  }
  .need-card-media--individuals {
    height: auto;
    aspect-ratio: 6 / 5;
  }
  .need-card {
    min-height: 0;
    border: none;
  }
  .need-card-content {
    padding: 20px;
  }
  .need-card-header {
    min-height: 0;
  }
  .needs-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .dashboard-row {
    grid-template-columns: 1fr;
  }
  .advisory-callout {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border: none;
  }
  .advisory-callout-main {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
  }
  .advisory-callout-icon,
  .advisory-callout > svg {
    margin-top: 2px;
  }
  .advisory-callout-link,
  .advisory-callout a {
    margin-left: 0;
    align-self: flex-start;
    font-size: 14px;
    padding: 4px 0 0;
  }
  .incident-row-card {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px;
    border: none;
  }
  .incident-card-divider {
    display: none;
  }
  .services-support-callout {
    flex-wrap: wrap;
    gap: 8px;
    border: none;
  }
  .advisory {
    grid-template-columns: 76px 1fr;
    gap: 10px;
    align-items: start;
    border: none;
  }
  .advisory time {
    grid-column: 2;
    text-align: left;
    font-size: 13px;
  }
  .advisory-arrow {
    display: none;
  }
  .footer-content-grid {
    grid-template-columns: 1fr;
  }
  .col-subscribe {
    grid-column: span 1;
  }
  .footer-light-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .footer-light-right {
    align-items: flex-start;
  }
  .footer-legal-links {
    justify-content: flex-start;
  }
}

/* Small Smartphone Screen Pass in Portrait (< 540px) */
@media (max-width: 540px) and (orientation: portrait) {
  .needs-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hero-slide-counter {
    font-size: 13px;
  }
  .about-facts {
    grid-template-columns: 1fr;
  }
  .footer-subscribe-box {
    flex-direction: column;
  }
  .footer-subscribe-box button {
    width: 100%;
    padding: 12px;
  }
}

/* Smartphone & Compact Landscape Orientation Pass (< 540px height) */
@media (orientation: landscape) and (max-height: 540px) {
  .needs-section {
    margin-bottom: 24px;
  }
  .needs-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 14px;
  }
  .need-card-media {
    height: 110px !important;
  }
  .need-card-media--incident {
    height: 110px !important;
    padding: 0 16px !important;
  }
  .need-card-media--individuals {
    height: 110px !important;
    aspect-ratio: auto !important;
  }
  .need-card-media--individuals img,
  .need-card-media--businesses img,
  .need-card-media--government img {
    height: 110px !important;
    object-position: center center !important;
  }
  .need-card-content {
    padding: 14px !important;
  }
  .need-card p {
    font-size: 13.5px !important;
    margin-bottom: 12px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-btn-primary,
  .hero-btn-secondary,
  .hero-nav-arrow,
  .hero-dot-inner,
  .hero-dot-btn {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
}
```
-e 

## File: src/styles/fonts.css
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap');
```
-e 

## File: src/styles/theme.css
```css
@custom-variant dark (&:is(.dark *));

:root {
  --font-size: 16px;
  --background: #ffffff;
  --foreground: #0b0c0c;
  --card: #ffffff;
  --card-foreground: #0b0c0c;
  --popover: #ffffff;
  --popover-foreground: #0b0c0c;
  --primary: #1d70b8;
  --primary-foreground: #ffffff;
  --secondary: #16548a;
  --secondary-foreground: #ffffff;
  --muted: #f3f3f3;
  --muted-foreground: #484949;
  --accent: #f4f8fb;
  --accent-foreground: #0b0c0c;
  --destructive: #d64545;
  --destructive-foreground: #ffffff;
  --border: #cecece;
  --input: #0b0c0c;
  --input-background: #ffffff;
  --switch-background: #484949;
  --font-weight-medium: 600;
  --font-weight-normal: 400;
  --ring: #1d70b8;
  --chart-1: #1d70b8;
  --chart-2: #16548a;
  --chart-3: #d64545;
  --chart-4: #484949;
  --chart-5: #0b0c0c;
  --radius: 2px; /* 2px - square edges with subtle micro-rounding */
  --sidebar: #f4f8fb;
  --sidebar-foreground: #0b0c0c;
  --sidebar-primary: #1d70b8;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #d2e2f1;
  --sidebar-accent-foreground: #0b0c0c;
  --sidebar-border: #8eb8dc;
  --sidebar-ring: #1d70b8;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.439 0 0);
}

@theme inline {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-input-background: var(--input-background);
  --color-switch-background: var(--switch-background);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }

  /**
  * Default typography styles for HTML elements (h1-h4, p, label, button, input).
  * These are in @layer base, so Tailwind utility classes (like text-sm, text-lg) automatically override them.
  */

  html {
    font-size: var(--font-size);
  }

  h1 {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  h2 {
    font-size: var(--text-xl);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  h3 {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  h4 {
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  label {
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  button {
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  input {
    font-size: var(--text-base);
    font-weight: var(--font-weight-normal);
    line-height: 1.5;
  }
}
```
-e 

## File: src/vite-env.d.ts
```ts
/// <reference types="vite/client" />

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.css" {
  const content: string;
  export default content;
}
```
-e 

## File: src/main.tsx
```tsx

  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  ```
-e 

## File: src/index.css
```css
@import "tailwindcss";

@theme {
  --font-sans: "GDS Transport", Arial, sans-serif;
}
```
