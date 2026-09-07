import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WaterTransitionContext } from './waterTransitionDefinition';

type TransitionPhase = 'idle' | 'entering' | 'holding' | 'exiting';

export const WaterTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [origin, setOrigin] = useState<{ x: string; y: string }>({ x: '50%', y: '50%' });
  const targetPathRef = useRef<string | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Synchronize route commit and paint with water ripple dissolve
  useEffect(() => {
    if (
      (phase === 'entering' || phase === 'holding') &&
      targetPathRef.current &&
      (location.pathname === targetPathRef.current || location.pathname.startsWith(targetPathRef.current))
    ) {
      targetPathRef.current = null;
      // CRITICAL: Clear all pending fallback timers immediately to eliminate any secondary flash!
      clearTimers();

      // Double rAF ensures the browser has committed and painted the new view under the opaque water droplet layer
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('exiting');
          const exitTimer = window.setTimeout(() => {
            setPhase('idle');
          }, 280);
          timersRef.current.push(exitTimer);
        });
      });
    }
  }, [location.pathname, phase, clearTimers]);

  const waterNavigate = useCallback(
    (to: string, event?: React.MouseEvent | { clientX: number; clientY: number }) => {
      // Prevent multiple transitions simultaneously
      if (phase !== 'idle') return;

      // Calculate origin coordinates for water drop impact point
      if (event && 'clientX' in event && typeof event.clientX === 'number') {
        setOrigin({
          x: `${event.clientX}px`,
          y: `${event.clientY}px`,
        });
      } else {
        setOrigin({
          x: '50%',
          y: '50%',
        });
      }

      clearTimers();
      targetPathRef.current = to;
      setPhase('entering');

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        navigate(to);
        setPhase('exiting');
        const t = window.setTimeout(() => setPhase('idle'), 150);
        timersRef.current.push(t);
        return;
      }

      // Trigger navigation as the droplet expands across the viewport
      const navTimer = window.setTimeout(() => {
        setPhase('holding');
        navigate(to);
      }, 300);

      // Safety fallback timer ONLY in case route listener was interrupted
      const fallbackTimer = window.setTimeout(() => {
        setPhase('exiting');
        const cleanup = window.setTimeout(() => setPhase('idle'), 280);
        timersRef.current.push(cleanup);
      }, 850);

      timersRef.current.push(navTimer, fallbackTimer);
    },
    [phase, navigate, clearTimers]
  );

  const isTransitioning = phase !== 'idle';

  return (
    <WaterTransitionContext.Provider value={{ waterNavigate, isTransitioning }}>
      {children}
      {isTransitioning && (
        <div
          className={`water-transition is-active is-${phase}`}
          style={
            {
              '--drop-x': origin.x,
              '--drop-y': origin.y,
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          {/* Concentric dynamic ripple shockwave rings */}
          <div className="circle-ripple-ring ring-1" />
          <div className="circle-ripple-ring ring-2" />
          <div className="circle-ripple-ring ring-3" />
          {/* Main dynamic enlarging circle */}
          <div className="water-drop" />
        </div>
      )}
    </WaterTransitionContext.Provider>
  );
};
