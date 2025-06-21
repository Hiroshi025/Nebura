  window.addEventListener('DOMContentLoaded', function () {
    tsParticles.load("tsparticles", {
      fullScreen: { enable: false },
      background: { color: "transparent" },
      fpsLimit: 60,
      particles: {
        number: { value: 60, density: { enable: true, area: 800 } },
        color: { value: "#4cc9f0" },
        shape: { type: "circle" },
        opacity: { value: 0.25 },
        size: { value: { min: 1, max: 3 } },
        move: { enable: true, speed: 1, direction: "none", outModes: "out" },
        links: {
          enable: true,
          distance: 120,
          color: "#4cc9f0",
          opacity: 0.15,
          width: 1
        }
      },
      detectRetina: true
    });
  });