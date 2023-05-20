import { useCallback, type FC } from "react";
import Particles from "react-particles";
import { loadFull } from "tsparticles";
import { type Engine } from "tsparticles-engine";

const AppParticles: FC = () => {
  const appParticlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="app-particles"
      init={appParticlesInit}
      canvasClassName="z-0"
      options={{
        fps_limit: 60,
        interactivity: {
          detectsOn: "canvas",
          events: {
            onHover: { enable: true, mode: "repulse" },
            resize: true,
          },
          modes: {
            repulse: { distance: 80, duration: 0.5 },
          },
        },
        particles: {
          color: { value: "#9333ea" },
          links: {
            color: "#3b82f6",
            distance: 150,
            enable: true,
            opacity: 0.3,
            width: 1,
          },
          move: {
            bounce: false,
            direction: "none",
            enable: true,
            outMode: "out",
            random: true,
            speed: 2,
            straight: false,
          },
          number: { density: { enable: true, area: 700 }, value: 50 },
          opacity: { value: 0.3 },
          shape: { type: "triangle" },
          size: { random: true, value: 7.5 },
        },
        detectRetina: true,
      }}
    />
  );
};

export default AppParticles;
