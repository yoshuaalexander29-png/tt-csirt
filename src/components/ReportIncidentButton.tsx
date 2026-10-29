import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './ReportIncidentButton.module.css';

export interface ReportIncidentButtonProps {
  label?: string;
  onPress?: () => void;
  onHeroNavigate?: () => void;
  preventMorph?: boolean;
  targetId?: string;
  cardId?: string;
  heroCtaId?: string;
  footerId?: string;
  disabled?: boolean;
  className?: string;
}

/** High precision cubic bezier solver for butter-smooth 60/120fps morph */
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

const easeMotion = cubicBezier(0.18, 0.95, 0.28, 1.0);
const easeCamera = cubicBezier(0.20, 0.88, 0.28, 1.0);
const easeDock = cubicBezier(0.16, 1.0, 0.3, 1.0);

function resolveMorphTarget(targetId: string): HTMLElement | null {
  return (
    document.getElementById(targetId) ??
    document.getElementById('incident-panel-media') ??
    document.getElementById('incident-card') ??
    document.getElementById('report')
  );
}

export const ReportIncidentButton: React.FC<ReportIncidentButtonProps> = ({
  label = 'Need immediate support?',
  onPress,
  onHeroNavigate,
  preventMorph = false,
  targetId = 'incident-panel-media',
  heroCtaId = 'hero-incident-cta',
  footerId = 'footer-bottom-section',
  disabled = false,
  className = '',
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slabRef = useRef<HTMLDivElement | null>(null);
  const materialLayerRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  const [isMorphing, setIsMorphing] = useState<boolean>(false);
  const isMorphingRef = useRef<boolean>(false);
  const isDockedRef = useRef<boolean>(false);
  const [isHeroCtaInView, setIsHeroCtaInView] = useState<boolean>(true);
  const [isPanelInView, setIsPanelInView] = useState<boolean>(false);
  const [isFooterInView, setIsFooterInView] = useState<boolean>(false);

  const animFrameRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Velocity tracking during morph
  const lastScrollYRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);
  const SCROLL_VELOCITY_THRESHOLD = 1.6; // px per millisecond (fast scrolling threshold)

  // Active geometry cache ref for mathematical inverse-transform continuity across viewport changes
  const activeGeometryRef = useRef<{
    sourceRect: DOMRect;
    targetRect: DOMRect;
    sourceWorldCenterX: number;
    sourceWorldCenterY: number;
    targetWorldCenterX: number;
    targetWorldCenterY: number;
    targetScrollY: number;
    scrollDistance: number;
    travelDist: number;
    needsScroll: boolean;
    initialScrollY: number;
  } | null>(null);

  // Recalculates cached source and target rects in real time when layout shifts or window resizes
  const recalculateGeometry = useCallback(() => {
    const buttonEl = buttonRef.current;
    const destPanel = resolveMorphTarget(targetId);
    if (!buttonEl || !destPanel) return;

    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    const sourceRect = buttonEl.getBoundingClientRect();
    const targetRect = destPanel.getBoundingClientRect();

    const sourceWorldX = scrollX + sourceRect.left;
    const sourceWorldY = scrollY + sourceRect.top;
    const targetWorldX = scrollX + targetRect.left;
    const targetWorldY = scrollY + targetRect.top;

    const sourceWorldCenterX = sourceWorldX + sourceRect.width / 2;
    const sourceWorldCenterY = sourceWorldY + sourceRect.height / 2;
    const targetWorldCenterX = targetWorldX + targetRect.width / 2;
    const targetWorldCenterY = targetWorldY + targetRect.height / 2;

    const dx = targetWorldCenterX - sourceWorldCenterX;
    const dy = targetWorldCenterY - sourceWorldCenterY;
    const travelDist = Math.sqrt(dx * dx + dy * dy);

    const cardEl = (destPanel.closest('.need-card--incident') || document.getElementById('incident-card')) as HTMLElement | null;
    const sectionEl = (destPanel.closest('.needs-section') || document.querySelector('.needs-section') || cardEl) as HTMLElement | null;

    let targetScrollY = scrollY;
    if (sectionEl) {
      const sectionRect = sectionEl.getBoundingClientRect();
      const sectionWorldY = scrollY + sectionRect.top;
      targetScrollY = Math.max(0, Math.round(sectionWorldY - 24));
    } else if (cardEl) {
      const cardRect = cardEl.getBoundingClientRect();
      targetScrollY = Math.max(0, Math.round(scrollY + cardRect.top - 60));
    }

    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    targetScrollY = Math.min(maxScrollY, targetScrollY);

    const initialScroll = activeGeometryRef.current?.initialScrollY ?? scrollY;
    const scrollDistance = targetScrollY - initialScroll;
    const needsScroll = Math.abs(scrollDistance) > 10;

    activeGeometryRef.current = {
      sourceRect,
      targetRect,
      sourceWorldCenterX,
      sourceWorldCenterY,
      targetWorldCenterX,
      targetWorldCenterY,
      targetScrollY,
      scrollDistance,
      travelDist,
      needsScroll,
      initialScrollY: initialScroll,
    };
  }, [targetId]);

  // Window resize event listener to re-calculate geometry on viewport changes
  useEffect(() => {
    let resizeRaf: number | null = null;

    const handleResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        recalculateGeometry();
        if (isMorphingRef.current && activeGeometryRef.current) {
          // Frame-aligned sub-pixel update if actively morphing during viewport resize
          const geom = activeGeometryRef.current;
          const currentScrollX = window.scrollX || window.pageXOffset || 0;
          const currentScrollY = window.scrollY || window.pageYOffset || 0;
          if (slabRef.current) {
            const screenLeft = geom.targetWorldCenterX - geom.targetRect.width / 2 - currentScrollX;
            const screenTop = geom.targetWorldCenterY - geom.targetRect.height / 2 - currentScrollY;
            slabRef.current.style.transform = `translate3d(${screenLeft.toFixed(3)}px, ${screenTop.toFixed(3)}px, 0)`;
          }
        }
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      window.removeEventListener('resize', handleResize);
    };
  }, [recalculateGeometry]);

  // Instant dock helper
  const instantDock = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    abortControllerRef.current?.abort();

    const destPanel = resolveMorphTarget(targetId);
    const parentIncidentCard = (destPanel?.closest('.need-card--incident') || document.getElementById('incident-card')) as HTMLElement | null;

    if (destPanel) {
      destPanel.classList.remove(styles.destinationHidden);
      destPanel.classList.add('isDocked');
      destPanel.classList.remove('highlightPulse');
      void destPanel.offsetWidth;
      destPanel.classList.add('highlightPulse');
    }

    if (parentIncidentCard) {
      parentIncidentCard.classList.remove('contentStaged');
      parentIncidentCard.classList.add('scrollUnrollActive');
    }

    if (slabRef.current) {
      slabRef.current.style.display = 'none';
      slabRef.current.style.opacity = '0';
    }

    isMorphingRef.current = false;
    isDockedRef.current = true;
    setIsMorphing(false);
  }, [targetId]);

  // Scroll listener for velocity tracking during morph
  useEffect(() => {
    const handleScroll = () => {
      if (!isMorphingRef.current) return;

      const now = performance.now();
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const deltaTime = now - lastScrollTimeRef.current;

      if (deltaTime > 8 && lastScrollTimeRef.current > 0) {
        const deltaY = Math.abs(currentScrollY - lastScrollYRef.current);
        const velocity = deltaY / deltaTime;

        // If user scrolls faster than velocity threshold during morph, snap immediately
        if (velocity > SCROLL_VELOCITY_THRESHOLD) {
          instantDock();
          return;
        }
      }

      lastScrollYRef.current = currentScrollY;
      lastScrollTimeRef.current = now;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [instantDock]);

  // 1. Observe Hero CTA to hide floating button when hero CTA is visible
  useEffect(() => {
    const heroCtaEl = document.getElementById(heroCtaId) ?? document.querySelector('.hero-btn-primary');
    if (!heroCtaEl) {
      setIsHeroCtaInView(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsHeroCtaInView((prev) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.05) return true;
          if (!entry.isIntersecting || entry.intersectionRatio < 0.01) return false;
          return prev;
        });
      },
      { threshold: [0, 0.01, 0.05, 0.1, 0.5, 1.0] }
    );

    observer.observe(heroCtaEl);
    return () => observer.disconnect();
  }, [heroCtaId]);

  // 2. Observe Target Panel
  useEffect(() => {
    const targetElement = resolveMorphTarget(targetId);
    if (!targetElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const ratio = entry.intersectionRatio;
        if (entry.isIntersecting && ratio > 0.08) {
          if (!isMorphingRef.current) {
            instantDock();
          }
        }
        setIsPanelInView((prev) => {
          if (prev && ratio < 0.08) return false;
          if (!prev && ratio > 0.2) return true;
          return prev;
        });
      },
      { threshold: [0, 0.08, 0.15, 0.25, 0.5, 0.8, 1.0] }
    );

    observer.observe(targetElement);
    return () => observer.disconnect();
  }, [targetId, instantDock]);

  // 3. Observe Footer
  useEffect(() => {
    const footerElement = (footerId ? document.getElementById(footerId) : null) ?? 
      document.querySelector('.footer-light-bg') ?? 
      document.querySelector('footer');
    if (!footerElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const ratio = entries[0].intersectionRatio;
        setIsFooterInView(entries[0].isIntersecting && ratio > 0.01);
      },
      { threshold: [0, 0.01, 0.05, 0.1, 0.5, 1.0], rootMargin: '0px 0px 30px 0px' }
    );

    observer.observe(footerElement);
    return () => observer.disconnect();
  }, [footerId]);

  // Handle Morph into Slab
  const triggerMorph = useCallback(() => {
    if (disabled || isMorphingRef.current || isDockedRef.current) return;
    if (onPress) onPress();
    if (preventMorph) return;

    const buttonEl = buttonRef.current;
    const destPanel = resolveMorphTarget(targetId);
    const slabEl = slabRef.current;
    const matEl = materialLayerRef.current;
    const labelSpan = labelRef.current;

    if (!buttonEl || !destPanel || !slabEl || !matEl) {
      destPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      instantDock();
      return;
    }

    // Accessibility: Reduced Motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      destPanel.scrollIntoView({ behavior: 'auto', block: 'start' });
      instantDock();
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 1. Calculate and cache exact start (button) and end (slab) geometry in document world space
    recalculateGeometry();
    const geom = activeGeometryRef.current;
    if (!geom) return;

    const sourceRect = geom.sourceRect;
    const duration = Math.round(Math.min(520, Math.max(380, 360 + geom.travelDist * 0.08)));

    const cardEl = (destPanel.closest('.need-card--incident') || document.getElementById('incident-card')) as HTMLElement | null;

    // 2. Hide destination panel & stage card content
    destPanel.classList.add(styles.destinationHidden);
    if (cardEl) {
      cardEl.classList.remove('scrollUnrollActive');
      cardEl.classList.add('contentStaged');
    }

    // 3. Initialize Proxy Slab synchronously at the button's exact position and styling
    slabEl.style.display = 'block';
    slabEl.style.opacity = '1';
    slabEl.style.width = `${sourceRect.width}px`;
    slabEl.style.height = `${sourceRect.height}px`;
    slabEl.style.transform = `translate3d(${sourceRect.left}px, ${sourceRect.top}px, 0)`;
    slabEl.style.borderRadius = '8px';
    slabEl.style.background = 'var(--gov-red, #d64545)';
    slabEl.style.boxShadow = '0 12px 32px rgba(11, 12, 12, 0.35), 0 3px 8px rgba(0, 0, 0, 0.2)';

    matEl.style.padding = '0 22px';
    if (labelSpan) {
      labelSpan.style.fontSize = '16px';
      labelSpan.style.fontWeight = '800';
      labelSpan.style.letterSpacing = '-0.01em';
    }

    // Hide original floating button immediately
    const startScrollY = window.scrollY || window.pageYOffset || 0;
    lastScrollYRef.current = startScrollY;
    lastScrollTimeRef.current = performance.now();
    setIsMorphing(true);
    isMorphingRef.current = true;

    let startTime: number | null = null;

    const animate = (now: number) => {
      if (controller.signal.aborted) {
        destPanel.classList.remove(styles.destinationHidden);
        cardEl?.classList.remove('contentStaged', 'scrollUnrollActive');
        slabEl.style.display = 'none';
        return;
      }

      const activeGeom = activeGeometryRef.current ?? geom;

      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const motionP = easeMotion(progress);
      const cameraP = easeCamera(progress);

      // Camera Scroll Progression
      let currentScrollY = activeGeom.initialScrollY;
      if (activeGeom.needsScroll) {
        currentScrollY = activeGeom.initialScrollY + activeGeom.scrollDistance * cameraP;
        window.scrollTo({ top: currentScrollY, left: 0, behavior: 'instant' as ScrollBehavior });
      }

      // World Coordinate Trajectory (incorporating real-time resized coordinates)
      const worldCenterX = activeGeom.sourceWorldCenterX + (activeGeom.targetWorldCenterX - activeGeom.sourceWorldCenterX) * motionP;
      const worldCenterY = activeGeom.sourceWorldCenterY + (activeGeom.targetWorldCenterY - activeGeom.sourceWorldCenterY) * motionP;

      // Dimensional Morph into Slab (Starts transforming size & radius midway for authentic physical morph)
      let morphP = motionP > 0.25 ? (motionP - 0.25) / 0.75 : 0;
      const dockP = easeDock(morphP);

      const currentWidth = activeGeom.sourceRect.width + (activeGeom.targetRect.width - activeGeom.sourceRect.width) * dockP;
      const currentHeight = activeGeom.sourceRect.height + (activeGeom.targetRect.height - activeGeom.sourceRect.height) * dockP; // 48px -> 180px slab height!
      const currentRadiusBottom = 4 * (1 - dockP); // 4px -> 0px at bottom

      // Viewport Projection with high-precision sub-pixel interpolation
      const currentScrollX = window.scrollX || window.pageXOffset || 0;
      const screenLeft = worldCenterX - currentWidth / 2 - currentScrollX;
      const screenTop = worldCenterY - currentHeight / 2 - currentScrollY;

      // Apply morph transformations to slab with GPU sub-pixel coordinate alignment
      slabEl.style.width = `${currentWidth.toFixed(3)}px`;
      slabEl.style.height = `${currentHeight.toFixed(3)}px`;
      slabEl.style.transform = `translate3d(${screenLeft.toFixed(3)}px, ${screenTop.toFixed(3)}px, 0)`;
      slabEl.style.borderRadius = `4px 4px ${currentRadiusBottom.toFixed(2)}px ${currentRadiusBottom.toFixed(2)}px`;
      slabEl.style.boxShadow = `0 ${(12 * (1 - dockP * 0.8)).toFixed(2)}px ${(32 * (1 - dockP * 0.8)).toFixed(2)}px rgba(11, 12, 12, ${0.35 * (1 - dockP)})`;

      // Content morph inside slab: font size, padding, and icon fade
      const currentPaddingX = 20 + (28 - 20) * dockP;
      const currentPaddingY = 0 + (24 - 0) * dockP;
      matEl.style.padding = `${currentPaddingY}px ${currentPaddingX}px`;

      if (labelSpan) {
        const fontSize = 16 + (22 - 16) * dockP;
        labelSpan.style.fontSize = `${fontSize}px`;
        labelSpan.style.fontWeight = dockP > 0.5 ? '700' : '400';
        labelSpan.style.letterSpacing = dockP > 0.5 ? '-0.02em' : 'normal';
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Frame-Perfect Zero-Flash Handoff
        if (activeGeom.needsScroll) {
          window.scrollTo({ top: activeGeom.targetScrollY, left: 0, behavior: 'instant' as ScrollBehavior });
        }

        destPanel.classList.remove(styles.destinationHidden);
        destPanel.classList.add('isDocked');
        destPanel.classList.remove('highlightPulse');
        void destPanel.offsetWidth;
        destPanel.classList.add('highlightPulse');

        if (cardEl) {
          cardEl.classList.remove('contentStaged');
          cardEl.classList.add('scrollUnrollActive');
        }

        slabEl.style.display = 'none';
        slabEl.style.opacity = '0';

        isMorphingRef.current = false;
        isDockedRef.current = true;
        setIsMorphing(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [disabled, onPress, preventMorph, targetId, instantDock]);

  // Hook up Hero CTA to trigger morph or navigation
  useEffect(() => {
    const heroBtn = document.getElementById(heroCtaId) ?? document.querySelector('.hero-btn-primary');
    if (!heroBtn) return;

    const handleHeroClick = (e: Event) => {
      e.preventDefault();
      if (onHeroNavigate) {
        onHeroNavigate();
      }
      triggerMorph();
    };

    heroBtn.addEventListener('click', handleHeroClick);
    return () => heroBtn.removeEventListener('click', handleHeroClick);
  }, [heroCtaId, onHeroNavigate, triggerMorph]);

  const showFloatingButton =
    !isHeroCtaInView &&
    !isPanelInView &&
    !isFooterInView &&
    !isMorphing;

  return (
    <>
      {/* Stationary Floating Button */}
      <div
        ref={containerRef}
        className={`${styles.floatingContainer} ${!showFloatingButton ? styles.hidden : ''}`}
        role="region"
        aria-label="Immediate Incident Support Action"
      >
        <button
          ref={buttonRef}
          type="button"
          className={`${styles.reportButton} ${className}`.trim()}
          onClick={triggerMorph}
          disabled={disabled}
          tabIndex={showFloatingButton ? 0 : -1}
        >
          <span className={styles.labelText}>{label}</span>
        </button>
      </div>

      {/* Morphing Shared Element Proxy Slab */}
      <div ref={slabRef} className={styles.sharedSlab} aria-hidden="true" style={{ display: 'none' }}>
        <div ref={materialLayerRef} className={styles.materialLayer}>
          <span ref={labelRef} className={styles.labelText}>{label}</span>
        </div>
      </div>
    </>
  );
};
