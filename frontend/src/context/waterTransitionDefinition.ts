import React, { createContext } from 'react';

export interface WaterTransitionContextType {
  waterNavigate: (to: string, event?: React.MouseEvent | { clientX: number; clientY: number }) => void;
  isTransitioning: boolean;
}

export const WaterTransitionContext = createContext<WaterTransitionContextType>({
  waterNavigate: () => {},
  isTransitioning: false,
});
