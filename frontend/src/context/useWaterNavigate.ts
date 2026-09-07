import { useContext } from 'react';
import { WaterTransitionContext } from './waterTransitionDefinition';

export const useWaterNavigate = () => {
  const context = useContext(WaterTransitionContext);
  if (!context) {
    throw new Error('useWaterNavigate must be used within a WaterTransitionProvider');
  }
  return context;
};
