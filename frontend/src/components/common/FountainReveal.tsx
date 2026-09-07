import React, { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getFountainOrigin, getFountainElements } from '../../utils/fountainTransition';

interface FountainRevealProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * FountainReveal:
 * Individual element / box flight animation originating from the mouse click position.
 * When the user clicks a navigation item in the sidebar, every major visual box on the
 * destination page launches from that click point and flies along its own vector to its
 * final resting position, creating a natural fountain/burst reveal.
 * The page container itself NEVER moves.
 */
export const FountainReveal: React.FC<FountainRevealProps> = ({
  children,
  className = '',
}) => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeAnimationsRef = useRef<Animation[]>([]);

  useLayoutEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Cancel any ongoing animations from previous rapid navigation clicks
    activeAnimationsRef.current.forEach((anim) => {
      try {
        anim.cancel();
      } catch {
        // Safe fallback
      }
    });
    activeAnimationsRef.current = [];

    // Extract click origin and meaningful visual boxes on destination page
    const origin = getFountainOrigin();
    const elements = getFountainElements(container);

    if (elements.length === 0) return;

    const animations: Animation[] = [];

    elements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Vector from element destination to click origin
      // Start translation: element starts right at the mouse click location
      const dx = origin.x - rect.left;
      const dy = origin.y - rect.top;

      // Subtle aerodynamic tilt based on vertical flight direction (-0.8deg to +0.8deg)
      const tiltAngle = dy < 0 ? -0.8 : 0.8;

      // Stagger: 38ms between elements (first element starts at 0ms immediately!)
      const delay = Math.min(index * 38, 240);

      try {
        const anim = el.animate(
          [
            {
              transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.85) rotate(${tiltAngle}deg)`,
              opacity: 0.15,
            },
            {
              transform: 'translate3d(0, 0, 0) scale(1) rotate(0deg)',
              opacity: 1,
            },
          ],
          {
            duration: 380,
            delay,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'backwards',
          }
        );

        anim.onfinish = () => {
          // Remove animation once complete, settling cleanly into normal layout
          try {
            anim.cancel();
          } catch {
            // Ignore
          }
        };

        // Guaranteed safety release so cursor hover animations are immediately responsive
        const safetyTimer = window.setTimeout(() => {
          try {
            anim.cancel();
          } catch {
            // Ignore
          }
        }, delay + 420);

        animations.push(anim);
        return () => window.clearTimeout(safetyTimer);
      } catch {
        // Fallback for environments where Web Animations API is restricted
      }
    });

    activeAnimationsRef.current = animations;

    return () => {
      animations.forEach((anim) => {
        try {
          anim.cancel();
        } catch {
          // Ignore
        }
      });
    };
  }, [location.pathname]);

  return (
    <div
      ref={containerRef}
      className={`fountain-reveal-viewport ${className}`}
      data-fountain-route={location.pathname}
    >
      {children}
    </div>
  );
};
