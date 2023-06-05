import { useCallback } from 'react';
import { loadFull } from 'tsparticles';
import { type Engine } from 'tsparticles-engine';

type UseParticlesInitResult = { particlesInit: (engine: Engine) => Promise<void> };

type UseParticlesInit = () => UseParticlesInitResult;

let particleEngineLoaded = false;

export const useParticlesInit: UseParticlesInit = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    if (particleEngineLoaded) {
      return;
    }

    await loadFull(engine);
    particleEngineLoaded = true;
  }, []);

  return {
    particlesInit,
  };
};
