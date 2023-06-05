import { type FC } from 'react';
import Particles from 'react-particles';
import { useParticlesInit } from '~/utils/hooks/useParticlesInit';

const AppParticles: FC = () => {
  const { particlesInit: appParticlesInit } = useParticlesInit();

  return (
    <Particles
      id="app-particles"
      init={appParticlesInit}
      canvasClassName="z-0"
      options={{
        fps_limit: 100,
        interactivity: {
          detectsOn: 'canvas',
          events: {
            onHover: { enable: true, mode: 'repulse' },
            resize: true,
          },
          modes: {
            repulse: { distance: 100, duration: 0.5 },
          },
        },
        particles: {
          color: { value: '#9333ea' },
          links: {
            color: '#3b82f6',
            distance: 150,
            enable: true,
            opacity: 0.3,
            width: 1,
          },
          move: {
            bounce: false,
            direction: 'none',
            enable: true,
            outMode: 'out',
            random: true,
            speed: 2,
            straight: false,
          },
          number: { density: { enable: true, area: 1000 }, value: 75 },
          opacity: { value: 0.3 },
          shape: { type: 'triangle' },
          size: { random: true, value: 7.5 },
        },
        detectRetina: true,
      }}
    />
  );
};

export default AppParticles;
